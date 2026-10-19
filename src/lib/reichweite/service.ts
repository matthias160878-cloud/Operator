import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api";
import { getProvider, isProviderConfigured } from "@/lib/oauth/providers";
import { neuerCode } from "@/lib/reichweite/codes";
import { auswerten, type EreignisArt } from "@/lib/reichweite/auswertung";

/** Höchste Stufe für von Besuchern erzeugte Links (Schutz vor endlosen Ketten). */
export const MAX_STUFE = 5;

/** Aufbewahrung der Ereignisse in Tagen (EMPFEHLUNG_AUFBEWAHRUNG_TAGE, Standard 180). */
export function aufbewahrungTage(): number {
  const n = Number(process.env.EMPFEHLUNG_AUFBEWAHRUNG_TAGE ?? "180");
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 180;
}

/** Löscht Ereignisse, die älter als die Aufbewahrungsfrist sind. */
export async function alteEreignisseLoeschen(workspaceId?: string): Promise<number> {
  const grenze = new Date(Date.now() - aufbewahrungTage() * 86_400_000);
  const r = await prisma.empfehlungsEreignis.deleteMany({
    where: { createdAt: { lt: grenze }, ...(workspaceId ? { workspaceId } : {}) },
  });
  return r.count;
}

/** Schlüssel für Missbrauchsschutz: gehashte Adresse, die IP selbst wird nirgends gespeichert. */
export function ipSchluessel(prefix: string, ip: string): string {
  return `${prefix}:${createHash("sha256").update(ip).digest("hex").slice(0, 24)}`;
}

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|slack|discord|linkedin|embedly|skype|headless|curl|wget|python-requests/i;

/** Vorschau-Abrufe von Messengern, Bots und Browser-Prefetch werden nicht als Aufruf gezählt. */
export function istZaehlbarerAufruf(h: Headers): boolean {
  const ua = h.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return false;
  const purpose = `${h.get("purpose") ?? ""} ${h.get("sec-purpose") ?? ""} ${h.get("x-moz") ?? ""}`.toLowerCase();
  if (purpose.includes("prefetch") || purpose.includes("prerender")) return false;
  if (h.get("next-router-prefetch")) return false;
  return true;
}

export async function eindeutigerCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = neuerCode();
    if (!(await prisma.empfehlungsLink.findUnique({ where: { code } }))) return code;
  }
  throw new Error("Kein freier Code gefunden.");
}

export async function eigeneKampagne(workspaceId: string, id: string) {
  const k = await prisma.reichweitenKampagne.findFirst({ where: { id, workspaceId } });
  if (!k) throw new NotFoundError();
  return k;
}

/** Öffentlicher Zugriff über den Code: liefert nur Link + öffentliche Kampagnenfelder. */
export async function oeffentlicherLink(code: string) {
  const link = await prisma.empfehlungsLink.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      stufe: true,
      workspaceId: true,
      kampagneId: true,
      istDemo: true,
      widerrufenAm: true,
      kampagne: { select: { titel: true, text: true, zielUrl: true, aktiv: true } },
    },
  });
  if (!link) return null;
  return { ...link, aktiv: link.kampagne.aktiv && !link.widerrufenAm };
}

export async function ereignisSpeichern(
  link: { id: string; workspaceId: string; kampagneId: string; istDemo: boolean },
  art: EreignisArt
) {
  await prisma.empfehlungsEreignis.create({
    data: { workspaceId: link.workspaceId, kampagneId: link.kampagneId, linkId: link.id, art, istDemo: link.istDemo },
  });
}

export async function kampagnenAuswertung(workspaceId: string, kampagneId: string) {
  await eigeneKampagne(workspaceId, kampagneId);
  await alteEreignisseLoeschen(workspaceId);
  const [links, ereignisse, kennzahlen] = await Promise.all([
    prisma.empfehlungsLink.findMany({ where: { workspaceId, kampagneId } }),
    prisma.empfehlungsEreignis.findMany({
      where: { workspaceId, kampagneId },
      select: { linkId: true, art: true, istDemo: true, createdAt: true },
    }),
    prisma.reichweitenKennzahl.findMany({ where: { workspaceId, kampagneId } }),
  ]);
  return auswerten({ links, ereignisse, kennzahlen });
}

const PLATTFORMEN = ["YOUTUBE", "INSTAGRAM", "FACEBOOK", "LINKEDIN", "TIKTOK"] as const;

/** Tatsächlicher Einrichtungsstand je Plattform, ohne Geheimnisse. */
export async function plattformStatus(workspaceId: string) {
  const [konten, composio] = await Promise.all([
    prisma.platformAccount.findMany({ where: { workspaceId }, select: { platform: true, status: true } }),
    prisma.composioConnection.findMany({ where: { workspaceId }, select: { toolkit: true, status: true } }),
  ]);
  return PLATTFORMEN.map((p) => {
    const provider = getProvider(p);
    return {
      plattform: p,
      anmeldungEingerichtet: provider ? isProviderConfigured(provider) : false,
      konto: konten.find((k) => k.platform === p)?.status ?? "NICHT_VERBUNDEN",
      composio: composio.find((c) => c.toolkit === p)?.status ?? "NONE",
      statistikAbruf: "NICHT_ANGEBUNDEN" as const,
    };
  });
}

/** Legt eine deutlich gekennzeichnete Demo-Kampagne an (nur Beispieldaten, nichts wird veröffentlicht). */
export async function demoAnlegen(workspaceId: string) {
  await demoEntfernen(workspaceId);
  const tag = 86_400_000;
  const jetzt = Date.now();
  const kampagne = await prisma.reichweitenKampagne.create({
    data: {
      workspaceId,
      istDemo: true,
      titel: "DEMO – Frühjahrs-Video: 3 Tipps für mehr Sichtbarkeit",
      text: "Beispielkampagne mit erfundenen Zahlen zur Vorschau des Moduls. Nichts davon wurde veröffentlicht.",
      zielUrl: "https://example.com/demo-zielseite",
    },
  });
  const link = (data: { parentId?: string; stufe: number; bezeichnung: string; herkunft: string; createdAt: Date }) =>
    eindeutigerCode().then((code) =>
      prisma.empfehlungsLink.create({ data: { workspaceId, kampagneId: kampagne.id, code, istDemo: true, ...data } })
    );
  const bio = await link({ stufe: 1, bezeichnung: "DEMO Instagram-Bio", herkunft: "TEAM", createdAt: new Date(jetzt - 14 * tag) });
  const yt = await link({ stufe: 1, bezeichnung: "DEMO YouTube-Beschreibung", herkunft: "TEAM", createdAt: new Date(jetzt - 14 * tag) });
  const b2 = await link({ parentId: bio.id, stufe: 2, bezeichnung: "", herkunft: "BESUCHER", createdAt: new Date(jetzt - 10 * tag) });
  const b3 = await link({ parentId: b2.id, stufe: 3, bezeichnung: "", herkunft: "BESUCHER", createdAt: new Date(jetzt - 6 * tag) });

  const ereignisse: { linkId: string; art: EreignisArt; tageZurueck: number }[] = [];
  const viele = (linkId: string, art: EreignisArt, anzahl: number, ab: number) => {
    for (let i = 0; i < anzahl; i++) ereignisse.push({ linkId, art, tageZurueck: ab - (i % ab) });
  };
  viele(bio.id, "AUFRUF", 42, 14);
  viele(bio.id, "ZIEL_KLICK", 11, 14);
  viele(bio.id, "ANFRAGE", 2, 12);
  viele(bio.id, "LINK_ERZEUGT", 1, 10);
  viele(yt.id, "AUFRUF", 27, 14);
  viele(yt.id, "ZIEL_KLICK", 6, 13);
  viele(b2.id, "AUFRUF", 9, 9);
  viele(b2.id, "ZIEL_KLICK", 3, 8);
  viele(b2.id, "ANFRAGE", 1, 7);
  viele(b2.id, "LINK_ERZEUGT", 1, 6);
  viele(b3.id, "AUFRUF", 3, 5);
  await prisma.empfehlungsEreignis.createMany({
    data: ereignisse.map((e) => ({
      workspaceId,
      kampagneId: kampagne.id,
      linkId: e.linkId,
      art: e.art,
      istDemo: true,
      createdAt: new Date(jetzt - e.tageZurueck * tag),
    })),
  });

  const von = new Date(jetzt - 14 * tag);
  const bis = new Date(jetzt - tag);
  await prisma.reichweitenKennzahl.createMany({
    data: [
      { plattform: "INSTAGRAM", metrik: "IMPRESSIONEN", wert: 4800 },
      { plattform: "INSTAGRAM", metrik: "REICHWEITE", wert: 3100 },
      { plattform: "INSTAGRAM", metrik: "VIDEOAUFRUFE", wert: 2650 },
      { plattform: "INSTAGRAM", metrik: "SHARES", wert: 37 },
      { plattform: "YOUTUBE", metrik: "IMPRESSIONEN", wert: 2900 },
      { plattform: "YOUTUBE", metrik: "VIDEOAUFRUFE", wert: 610 },
    ].map((k) => ({ ...k, workspaceId, kampagneId: kampagne.id, quelle: "DEMO", zeitraumVon: von, zeitraumBis: bis })),
  });
  return kampagne;
}

export async function demoEntfernen(workspaceId: string) {
  const r = await prisma.reichweitenKampagne.deleteMany({ where: { workspaceId, istDemo: true } });
  return r.count;
}

export async function protokoll(workspaceId: string, userId: string, action: string, detail = "") {
  await prisma.auditLog.create({ data: { workspaceId, userId, action, detail: detail.slice(0, 300) } });
}
