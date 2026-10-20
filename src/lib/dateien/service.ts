import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";

/**
 * Dateiaustausch zwischen Kunde, Betreiber (SECRET 58) und Agenten.
 *
 * Ordner eines Kundenkontos:
 *  - „Eigene Dateien“, „Von Agenten“ und selbst angelegte Ordner: nur der Kunde sieht sie.
 *  - „An SECRET 58“: Der Kunde legt hier Dateien für den Betreiber ab. Nur dieser Ordner
 *    ist für den Betreiber sichtbar — alle anderen Kundeninhalte bleiben privat.
 *  - „Von SECRET 58“: Hier legt der Betreiber Dateien für den Kunden ab.
 * Weitergabe an andere (auch andere Kunden) über Freigabe-Links mit Ablauf, Abrufgrenze
 * und Widerruf. Gespeichert wird nur der Hash des Link-Schlüssels.
 */

export const ORDNER = {
  eigene: "Eigene Dateien",
  agenten: "Von Agenten",
  anBetreiber: "An SECRET 58",
  vomBetreiber: "Von SECRET 58",
} as const;
export const STANDARD_ORDNER: string[] = [ORDNER.eigene, ORDNER.agenten, ORDNER.anBetreiber, ORDNER.vomBetreiber];

export type Quelle = "KUNDE" | "BETREIBER" | "AGENT";

export class DateiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const MB = 1024 * 1024;
/** Höchstgröße je Datei. Obergrenze 10 MB, weil der Proxy Anfragen nur bis ~12 MB puffert. */
export function maxDateiBytes(): number {
  const mb = Number(process.env.DATEIEN_MAX_MB || 10);
  return Math.round(Math.min(Math.max(Number.isFinite(mb) ? mb : 10, 0.1), 10) * MB);
}
/** Speicherkontingent je Kundenkonto. */
export function kontingentBytes(): number {
  const mb = Number(process.env.DATEIEN_KONTINGENT_MB || 100);
  return Math.round(Math.max(Number.isFinite(mb) ? mb : 100, 1) * MB);
}

/** Ausführbare Dateien werden nicht angenommen (Weitergabe von Schadsoftware vermeiden). */
const GESPERRT = /\.(exe|msi|bat|cmd|com|scr|pif|ps1|psm1|vbs|vbe|js|jse|wsf|wsh|jar|apk|dll|sh|reg|lnk|hta|cpl)$/i;

/** Dateiname: keine Pfade, keine Steuerzeichen, höchstens 120 Zeichen. */
export function sauberName(name: string): string {
  const base = String(name ?? "").split(/[\\/]/).pop() ?? "";
  const n = base
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "_")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 120);
  return n || "Datei";
}

export function sauberOrdner(ordner: string): string {
  const o = String(ordner ?? "")
    .replace(/[\u0000-\u001f\u007f<>:"|?*\\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  if (!o) throw new DateiError(400, "Bitte einen Ordnernamen angeben.");
  return o;
}

/** Typen, die im Browser angesehen werden dürfen (alles andere nur als Download). */
const ANSICHT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  txt: "text/plain; charset=utf-8",
  csv: "text/plain; charset=utf-8",
};
export function ansichtTyp(name: string): string | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return ANSICHT[ext] ?? null;
}

const sha = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");

async function protokoll(workspaceId: string, userId: string | null, action: string, detail: string) {
  await prisma.auditLog.create({ data: { workspaceId, userId, action, detail: detail.slice(0, 500) } });
}

const LISTE = {
  id: true,
  ordner: true,
  name: true,
  mime: true,
  groesse: true,
  quelle: true,
  quelleName: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function belegt(workspaceId: string): Promise<number> {
  const r = await prisma.kundenDatei.aggregate({ where: { workspaceId }, _sum: { groesse: true } });
  return r._sum.groesse ?? 0;
}

export async function uebersicht(workspaceId: string) {
  const now = new Date();
  const [dateien, links, freigaben, belegtBytes, eigeneOrdner] = await Promise.all([
    prisma.kundenDatei.findMany({ where: { workspaceId }, select: LISTE, orderBy: { createdAt: "desc" } }),
    prisma.kundenLink.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
    prisma.dateiFreigabe.findMany({
      where: { workspaceId, widerrufenAm: null, ablauf: { gt: now } },
      select: { id: true, dateiId: true, ablauf: true, maxAbrufe: true, abrufe: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    belegt(workspaceId),
    prisma.setting.findFirst({ where: { workspaceId, key: "dateien.ordner" } }),
  ]);
  let extra: string[] = [];
  try {
    extra = eigeneOrdner ? (JSON.parse(eigeneOrdner.value) as string[]) : [];
  } catch {
    extra = [];
  }
  const ordner = [...STANDARD_ORDNER];
  for (const o of [...extra, ...dateien.map((d) => d.ordner)]) if (!ordner.includes(o)) ordner.push(o);
  return {
    dateien,
    links,
    freigaben: freigaben.filter((f) => f.abrufe < f.maxAbrufe),
    ordner,
    belegtBytes,
    kontingentBytes: kontingentBytes(),
    maxDateiBytes: maxDateiBytes(),
  };
}

export async function ordnerAnlegen(workspaceId: string, name: string) {
  const o = sauberOrdner(name);
  const row = await prisma.setting.findFirst({ where: { workspaceId, key: "dateien.ordner" } });
  let liste: string[] = [];
  try {
    liste = row ? (JSON.parse(row.value) as string[]) : [];
  } catch {
    liste = [];
  }
  if (STANDARD_ORDNER.includes(o) || liste.includes(o)) return o;
  if (liste.length >= 50) throw new DateiError(400, "Höchstens 50 eigene Ordner.");
  liste.push(o);
  if (row) await prisma.setting.update({ where: { id: row.id }, data: { value: JSON.stringify(liste) } });
  else await prisma.setting.create({ data: { workspaceId, key: "dateien.ordner", value: JSON.stringify(liste) } });
  return o;
}

export async function ordnerLoeschen(workspaceId: string, name: string) {
  const o = sauberOrdner(name);
  if (STANDARD_ORDNER.includes(o)) throw new DateiError(400, "Standardordner können nicht gelöscht werden.");
  if (await prisma.kundenDatei.count({ where: { workspaceId, ordner: o } }))
    throw new DateiError(409, "Der Ordner ist nicht leer. Bitte Dateien zuerst verschieben.");
  const row = await prisma.setting.findFirst({ where: { workspaceId, key: "dateien.ordner" } });
  if (!row) return;
  let liste: string[] = [];
  try {
    liste = JSON.parse(row.value) as string[];
  } catch {
    liste = [];
  }
  await prisma.setting.update({ where: { id: row.id }, data: { value: JSON.stringify(liste.filter((x) => x !== o)) } });
}

export interface NeueDatei {
  name: string;
  daten: Buffer;
  mime?: string;
  ordner: string;
  quelle: Quelle;
  quelleName?: string;
  userId?: string | null;
}

/** Legt eine Datei im Kundenkonto ab (prüft Größe, Typ und Kontingent). */
export async function ablegen(workspaceId: string, d: NeueDatei) {
  const name = sauberName(d.name);
  if (GESPERRT.test(name)) throw new DateiError(415, "Ausführbare Dateien (z. B. .exe, .bat, .js) werden aus Sicherheitsgründen nicht angenommen.");
  if (d.daten.length === 0) throw new DateiError(400, "Die Datei ist leer.");
  if (d.daten.length > maxDateiBytes())
    throw new DateiError(413, `Die Datei ist zu groß (höchstens ${Math.round(maxDateiBytes() / MB)} MB).`);
  const ordner = sauberOrdner(d.ordner);
  if (d.quelle === "KUNDE" && ordner === ORDNER.vomBetreiber)
    throw new DateiError(403, "In „Von SECRET 58“ legt nur SECRET 58 Dateien ab.");
  if ((await belegt(workspaceId)) + d.daten.length > kontingentBytes())
    throw new DateiError(413, `Speicherplatz erschöpft (${Math.round(kontingentBytes() / MB)} MB je Konto). Bitte alte Dateien löschen.`);
  const mime = /^[\w.+-]+\/[\w.+-]+$/.test(d.mime ?? "") ? (d.mime as string) : "application/octet-stream";
  const datei = await prisma.kundenDatei.create({
    data: {
      workspaceId,
      ordner,
      name,
      mime,
      groesse: d.daten.length,
      sha256: sha(d.daten),
      quelle: d.quelle,
      quelleName: (d.quelleName ?? "").slice(0, 80),
      erstelltVonId: d.userId ?? null,
      inhalt: { create: { daten: new Uint8Array(d.daten) } },
    },
    select: LISTE,
  });
  await protokoll(workspaceId, d.userId ?? null, "datei.abgelegt", `${d.quelle}: ${name} → ${ordner} (${d.daten.length} B)`);
  return datei;
}

/**
 * Für Agenten: Ergebnisdatei im Ordner „Von Agenten“ des Kunden ablegen.
 * Aufruf nur aus serverseitigem Code mit bekanntem Workspace (nie mit Werten aus einer Anfrage).
 */
export function agentAblage(workspaceId: string, agent: string, name: string, daten: Buffer | string, mime?: string) {
  return ablegen(workspaceId, {
    name,
    daten: typeof daten === "string" ? Buffer.from(daten, "utf-8") : daten,
    mime: mime ?? (typeof daten === "string" ? "text/plain" : undefined),
    ordner: ORDNER.agenten,
    quelle: "AGENT",
    quelleName: agent,
  });
}

async function eigene(workspaceId: string, id: string) {
  const d = await prisma.kundenDatei.findFirst({ where: { id, workspaceId }, select: LISTE });
  if (!d) throw new DateiError(404, "Nicht gefunden.");
  return d;
}

export async function inhaltLaden(workspaceId: string, id: string) {
  const d = await eigene(workspaceId, id);
  const i = await prisma.kundenDateiInhalt.findUnique({ where: { dateiId: id } });
  if (!i) throw new DateiError(404, "Nicht gefunden.");
  return { datei: d, daten: Buffer.from(i.daten) };
}

export async function aendern(workspaceId: string, userId: string, id: string, input: unknown) {
  const p = z.object({ name: z.string().max(200).optional(), ordner: z.string().max(80).optional() }).strict().parse(input);
  const d = await eigene(workspaceId, id);
  const data: { name?: string; ordner?: string } = {};
  if (p.name !== undefined) {
    const n = sauberName(p.name);
    if (GESPERRT.test(n)) throw new DateiError(415, "Diese Dateiendung ist nicht erlaubt.");
    data.name = n;
  }
  if (p.ordner !== undefined) {
    const o = sauberOrdner(p.ordner);
    if (o === ORDNER.vomBetreiber && d.ordner !== ORDNER.vomBetreiber)
      throw new DateiError(403, "In „Von SECRET 58“ legt nur SECRET 58 Dateien ab.");
    data.ordner = o;
  }
  const r = await prisma.kundenDatei.update({ where: { id: d.id }, data, select: LISTE });
  await protokoll(workspaceId, userId, "datei.geaendert", `${d.name} → ${r.name} / ${r.ordner}`);
  return r;
}

export async function loeschen(workspaceId: string, userId: string, id: string) {
  const d = await eigene(workspaceId, id);
  await prisma.kundenDatei.delete({ where: { id: d.id } });
  await protokoll(workspaceId, userId, "datei.geloescht", d.name);
}

/* ---------- Freigabe-Links ---------- */

export const tokenHash = (t: string) => sha(`secret58-freigabe:${t}`);

export async function freigabeErstellen(workspaceId: string, userId: string, id: string, input: unknown) {
  const p = z
    .object({ tage: z.number().int().min(1).max(30).default(7), maxAbrufe: z.number().int().min(1).max(100).default(5) })
    .strict()
    .parse(input ?? {});
  const d = await eigene(workspaceId, id);
  const aktiv = await prisma.dateiFreigabe.count({ where: { workspaceId, widerrufenAm: null, ablauf: { gt: new Date() } } });
  if (aktiv >= 200) throw new DateiError(429, "Zu viele aktive Freigabe-Links. Bitte alte widerrufen.");
  const token = randomBytes(32).toString("base64url");
  const f = await prisma.dateiFreigabe.create({
    data: {
      dateiId: d.id,
      workspaceId,
      tokenHash: tokenHash(token),
      ablauf: new Date(Date.now() + p.tage * 86_400_000),
      maxAbrufe: p.maxAbrufe,
      erstelltVonId: userId,
    },
  });
  await protokoll(workspaceId, userId, "datei.freigabe", `${d.name}: ${p.tage} Tage, ${p.maxAbrufe} Abrufe`);
  return { id: f.id, token, pfad: `/api/freigabe/${token}`, ablauf: f.ablauf, maxAbrufe: f.maxAbrufe };
}

export async function freigabeWiderrufen(workspaceId: string, userId: string, freigabeId: string) {
  const f = await prisma.dateiFreigabe.findFirst({ where: { id: freigabeId, workspaceId } });
  if (!f) throw new DateiError(404, "Nicht gefunden.");
  await prisma.dateiFreigabe.update({ where: { id: f.id }, data: { widerrufenAm: new Date() } });
  await protokoll(workspaceId, userId, "datei.freigabe.widerrufen", f.dateiId);
}

/** Öffentlicher Abruf über einen Freigabe-Link. Zählt atomar, damit die Abrufgrenze hält. */
export async function freigabeAbrufen(token: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) throw new DateiError(404, "Link ungültig oder abgelaufen.");
  const f = await prisma.dateiFreigabe.findUnique({ where: { tokenHash: tokenHash(token) } });
  if (!f) throw new DateiError(404, "Link ungültig oder abgelaufen.");
  const now = new Date();
  const claim = await prisma.dateiFreigabe.updateMany({
    where: { id: f.id, widerrufenAm: null, ablauf: { gt: now }, abrufe: { lt: f.maxAbrufe } },
    data: { abrufe: { increment: 1 } },
  });
  if (claim.count !== 1) throw new DateiError(410, "Link ungültig, abgelaufen oder bereits ausgeschöpft.");
  const datei = await prisma.kundenDatei.findUnique({ where: { id: f.dateiId }, select: LISTE });
  const i = await prisma.kundenDateiInhalt.findUnique({ where: { dateiId: f.dateiId } });
  if (!datei || !i) throw new DateiError(404, "Link ungültig oder abgelaufen.");
  await protokoll(f.workspaceId, null, "datei.freigabe.abruf", `${datei.name} (${f.abrufe + 1}/${f.maxAbrufe})`);
  return { datei, daten: Buffer.from(i.daten) };
}

/* ---------- Links (z. B. eigene Webseite) ---------- */

export const LINK_ARTEN = ["Eigene Webseite", "Shop", "Social Media", "Cloud-Ordner / Dokument", "Sonstiges"] as const;

export function normUrl(v: string): string | null {
  let s = String(v ?? "").trim();
  if (!s || s.length > 500) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if ((u.protocol !== "https:" && u.protocol !== "http:") || !u.hostname.includes(".") || u.username || u.password) return null;
    return u.href;
  } catch {
    return null;
  }
}

export async function linkAnlegen(workspaceId: string, userId: string, input: unknown) {
  const p = z
    .object({ titel: z.string().max(80).default(""), url: z.string().max(500), art: z.enum(LINK_ARTEN).default("Sonstiges") })
    .strict()
    .parse(input);
  const url = normUrl(p.url);
  if (!url) throw new DateiError(400, "Bitte eine gültige Webadresse eingeben, z. B. www.ihre-firma.de.");
  if ((await prisma.kundenLink.count({ where: { workspaceId } })) >= 100) throw new DateiError(400, "Höchstens 100 Links.");
  if (await prisma.kundenLink.findFirst({ where: { workspaceId, url } })) throw new DateiError(409, "Dieser Link ist schon gespeichert.");
  const titel = p.titel.replace(/[\u0000-\u001f\u007f]/g, " ").trim() || new URL(url).hostname;
  const l = await prisma.kundenLink.create({ data: { workspaceId, titel, url, art: p.art } });
  await protokoll(workspaceId, userId, "link.angelegt", url);
  return l;
}

export async function linkLoeschen(workspaceId: string, userId: string, id: string) {
  const l = await prisma.kundenLink.findFirst({ where: { id, workspaceId } });
  if (!l) throw new DateiError(404, "Nicht gefunden.");
  await prisma.kundenLink.delete({ where: { id: l.id } });
  await protokoll(workspaceId, userId, "link.geloescht", l.url);
}

/* ---------- Betreiber ---------- */

/** Kundenkonten mit Anzahl der Dateien „An SECRET 58“ (nur Zahlen, keine Inhalte). */
export async function betreiberKonten() {
  const [ws, an, von] = await Promise.all([
    prisma.workspace.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.kundenDatei.groupBy({ by: ["workspaceId"], where: { ordner: ORDNER.anBetreiber }, _count: { _all: true } }),
    prisma.kundenDatei.groupBy({ by: ["workspaceId"], where: { ordner: ORDNER.vomBetreiber, quelle: "BETREIBER" }, _count: { _all: true } }),
  ]);
  const n = (rows: { workspaceId: string; _count: { _all: number } }[], id: string) => rows.find((r) => r.workspaceId === id)?._count._all ?? 0;
  return ws.map((w) => ({ id: w.id, name: w.name, anBetreiber: n(an, w.id), vomBetreiber: n(von, w.id) }));
}

/** Betreiber sieht nur „An SECRET 58“ und die eigenen Ablagen in „Von SECRET 58“. */
const betreiberSichtbar = (workspaceId: string) => ({
  workspaceId,
  OR: [{ ordner: ORDNER.anBetreiber }, { ordner: ORDNER.vomBetreiber, quelle: "BETREIBER" }],
});

export async function betreiberDateien(workspaceId: string) {
  if (!(await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { id: true } })))
    throw new DateiError(404, "Nicht gefunden.");
  return prisma.kundenDatei.findMany({ where: betreiberSichtbar(workspaceId), select: LISTE, orderBy: { createdAt: "desc" } });
}

export async function betreiberInhalt(id: string) {
  const d = await prisma.kundenDatei.findFirst({ where: { id }, select: { ...LISTE, workspaceId: true } });
  if (!d) throw new DateiError(404, "Nicht gefunden.");
  const sichtbar = d.ordner === ORDNER.anBetreiber || (d.ordner === ORDNER.vomBetreiber && d.quelle === "BETREIBER");
  if (!sichtbar) throw new DateiError(404, "Nicht gefunden.");
  const i = await prisma.kundenDateiInhalt.findUnique({ where: { dateiId: id } });
  if (!i) throw new DateiError(404, "Nicht gefunden.");
  return { datei: d, daten: Buffer.from(i.daten) };
}

export async function betreiberAblegen(workspaceId: string, userId: string, name: string, daten: Buffer, mime?: string) {
  if (!(await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { id: true } })))
    throw new DateiError(404, "Nicht gefunden.");
  return ablegen(workspaceId, { name, daten, mime, ordner: ORDNER.vomBetreiber, quelle: "BETREIBER", quelleName: "SECRET 58", userId });
}

export async function betreiberLoeschen(userId: string, id: string) {
  const d = await prisma.kundenDatei.findFirst({ where: { id, ordner: ORDNER.vomBetreiber, quelle: "BETREIBER" } });
  if (!d) throw new DateiError(404, "Nicht gefunden.");
  await prisma.kundenDatei.delete({ where: { id } });
  await protokoll(d.workspaceId, userId, "datei.geloescht.betreiber", d.name);
}
