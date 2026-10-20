import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api";
import { darfFreigeben } from "@/lib/reichweite/zugriff";
import { eindeutigerCode, kampagnenAuswertung } from "@/lib/reichweite/service";
import { ergebnisZuordnung } from "@/lib/reichweite/zuordnung";
import { HAUPTKENNZAHLEN, ablaufVorschlag, pruefeKampagne, type Hauptkennzahl, type KampagnenEingabe } from "@/lib/reichweitenaufbau/kampagnenplan";
import { FORMAT_PLATTFORMEN, UNGEPRUEFT, type FormatVariante } from "@/lib/reichweitenaufbau/plattformformate";
import type { Role } from "@prisma/client";

const tag = (s: string) => new Date(`${s}T00:00:00Z`);

/** Inhaber und Admins des Workspaces – mögliche Verantwortliche für Freigaben. */
export async function freigeber(workspaceId: string) {
  return prisma.user.findMany({ where: { workspaceId, role: { in: ["OWNER", "ADMIN"] } }, select: { id: true, name: true, email: true }, orderBy: { createdAt: "asc" } });
}

export class KampagnenFehler extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

/**
 * Kampagnenassistent: legt eine Kampagne mit allen Pflichtangaben und einem
 * bearbeitbaren Ablauf an. Gleiche erstellKennung = dieselbe Kampagne
 * (kein Doppelanlegen bei Doppelklick oder Wiederholung).
 */
export async function kampagneAusAssistent(
  user: { workspaceId: string; userId: string; role: Role },
  e: KampagnenEingabe & { text: string; erstellKennung: string; istDemo?: boolean }
) {
  const vorhanden = await prisma.reichweitenKampagne.findUnique({ where: { erstellKennung: e.erstellKennung } });
  if (vorhanden) {
    if (vorhanden.workspaceId !== user.workspaceId) throw new KampagnenFehler("Ungültige Kennung.");
    return { kampagne: vorhanden, neu: false };
  }
  const fehler = pruefeKampagne(e);
  if (fehler) throw new KampagnenFehler(fehler);
  if (e.budgetCent !== null && !darfFreigeben(user.role)) throw new KampagnenFehler("Ein Budget dürfen nur Inhaber und Admins festlegen.", 403);
  const verantwortlich = (await freigeber(user.workspaceId)).find((u) => u.id === e.verantwortlichId);
  if (!verantwortlich) throw new KampagnenFehler("Verantwortlich für Freigaben kann nur ein Inhaber oder Admin dieses Workspaces sein.");
  const schritte = ablaufVorschlag({ ...e, verantwortlichName: verantwortlich.name || verantwortlich.email });
  const kampagne = await prisma.reichweitenKampagne.create({
    data: {
      workspaceId: user.workspaceId,
      titel: e.titel.trim().slice(0, 120),
      text: e.text.trim().slice(0, 1000),
      zielUrl: e.zielUrl,
      ziel: e.ziel.trim().slice(0, 300),
      hauptkennzahl: e.hauptkennzahl,
      zielgruppe: e.zielgruppe.trim().slice(0, 300),
      startAm: tag(e.startAm),
      endeAm: tag(e.endeAm),
      verantwortlichId: verantwortlich.id,
      budgetCent: e.budgetCent,
      budgetFestgelegtAm: e.budgetCent !== null ? new Date() : null,
      erstellKennung: e.erstellKennung,
      istDemo: !!e.istDemo,
      schritte: { create: schritte.map((s, i) => ({ workspaceId: user.workspaceId, reihenfolge: i + 1, art: s.art, titel: s.titel, notiz: s.notiz, faelligAm: s.faelligAm })) },
    },
  });
  // Ein erster Team-Link, damit Ergebnisse von Anfang an zugeordnet werden können
  await prisma.empfehlungsLink.create({ data: { workspaceId: user.workspaceId, kampagneId: kampagne.id, code: await eindeutigerCode(), bezeichnung: "Hauptlink", istDemo: !!e.istDemo } });
  return { kampagne, neu: true };
}

export async function eigeneReichweitenKampagne(workspaceId: string, id: string) {
  const k = await prisma.reichweitenKampagne.findFirst({ where: { id, workspaceId } });
  if (!k) throw new NotFoundError();
  return k;
}

/** Herkunftsschlüssel einer Variante – dieselbe Variante wird nur einmal übernommen. */
export function variantenSchluessel(kampagneId: string, v: Pick<FormatVariante, "plattform" | "text">) {
  return createHash("sha256").update(`${kampagneId}|${v.plattform}|${v.text}`).digest("hex").slice(0, 40);
}

const PLATFORM = { INSTAGRAM: "INSTAGRAM", TIKTOK: "TIKTOK", YOUTUBE: "YOUTUBE", LINKEDIN: "LINKEDIN", FACEBOOK: "FACEBOOK" } as const;

/** Übernimmt eine Variante als Entwurf in die Content Factory (eigene Prüfung und Freigabe je Variante). */
export async function varianteUebernehmen(workspaceId: string, kampagneId: string, v: FormatVariante) {
  const k = await eigeneReichweitenKampagne(workspaceId, kampagneId);
  const schluessel = variantenSchluessel(k.id, v);
  const vorhanden = await prisma.contentItem.findUnique({ where: { herkunftsSchluessel: schluessel } });
  if (vorhanden) return { item: vorhanden, neu: false };
  const d = FORMAT_PLATTFORMEN[v.plattform];
  const item = await prisma.contentItem.create({
    data: {
      workspaceId,
      campaignId: k.campaignId,
      reichweitenKampagneId: k.id,
      title: `${v.titel} – ${d.name}`.slice(0, 160),
      platform: PLATFORM[v.plattform],
      format: `Reichweitenaufbau · Plattformformat · ${d.format}`,
      status: "DRAFT",
      hook: v.einstieg.slice(0, 500),
      script: v.videoablauf.length ? v.videoablauf.join("\n") : v.text,
      caption: v.text,
      faktenJson: JSON.stringify(v.fakten),
      herkunftsSchluessel: schluessel,
    },
  });
  return { item, neu: true };
}

/**
 * Freigaberegel für Inhalte aus Kampagnen: nur die verantwortliche Person
 * (oder der Inhaber) gibt frei, und nicht solange ungeprüfte Aussagen markiert sind.
 */
export async function freigabeSperre(itemId: string, user: { userId: string; role: Role }): Promise<string | null> {
  const item = await prisma.contentItem.findUnique({ where: { id: itemId }, include: { reichweitenKampagne: { select: { verantwortlichId: true } } } });
  if (!item) return null;
  const text = `${item.hook}\n${item.script}\n${item.caption}`;
  if (text.includes(UNGEPRUEFT)) return `Diese Variante enthält noch ungeprüfte Aussagen (${UNGEPRUEFT}). Bitte prüfen und die Markierung entfernen oder die Aussage löschen.`;
  const v = item.reichweitenKampagne?.verantwortlichId;
  if (v && v !== user.userId && user.role !== "OWNER") return "Freigeben darf nur die für diese Kampagne verantwortliche Person (oder der Inhaber).";
  return null;
}

/** Ergebnis einer Kampagne: Hauptkennzahl, Auswertung und nachvollziehbare Zuordnung je Link und Angebotsseite. */
export async function kampagnenErgebnis(workspaceId: string, kampagneId: string) {
  const k = await eigeneReichweitenKampagne(workspaceId, kampagneId);
  const [auswertung, links, ereignisse] = await Promise.all([
    kampagnenAuswertung(workspaceId, k.id),
    prisma.empfehlungsLink.findMany({ where: { workspaceId, kampagneId: k.id }, orderBy: { createdAt: "asc" } }),
    prisma.empfehlungsEreignis.findMany({ where: { workspaceId, kampagneId: k.id }, select: { linkId: true, art: true } }),
  ]);
  const info = HAUPTKENNZAHLEN[k.hauptkennzahl as Hauptkennzahl];
  const zahl = !info ? null : info.ereignis ? auswertung.eigeneMessung[info.ereignis] : auswertung.newsletter;
  return {
    hauptkennzahl: info ? { schluessel: k.hauptkennzahl, label: info.label, wert: zahl?.wert ?? null, istDemo: zahl?.istDemo ?? false } : null,
    auswertung,
    zuordnung: ergebnisZuordnung(links, ereignisse, k.zielUrl),
  };
}
