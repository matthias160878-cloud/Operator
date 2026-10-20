import { prisma } from "@/lib/db";
import { eindeutigerCode } from "@/lib/reichweite/service";
import { plattformVarianten, type Fakt, type FormatPlattform } from "@/lib/reichweitenaufbau/plattformformate";
import { KampagnenFehler, freigabeSperre, freigeber, kampagneAusAssistent, kampagnenErgebnis, varianteUebernehmen } from "@/lib/reichweitenaufbau/kampagnenService";
import type { Role } from "@prisma/client";

/**
 * Vollständiger Demo-Testlauf: Briefing → Entwurf → Prüfung → Freigabe →
 * simulierte Ausführung → Auswertung. Alle Daten sind als DEMO gekennzeichnet;
 * es wird nichts veröffentlicht, versendet, bezahlt oder per KI erzeugt.
 * Jeder Schritt ist wiederholbar, ohne doppelte Einträge zu erzeugen.
 */
export const TESTLAUF_SCHRITTE = ["Briefing", "Entwurf", "Prüfung", "Freigabe", "Simulierte Ausführung", "Auswertung"] as const;

type Nutzer = { workspaceId: string; userId: string; role: Role };

const kennung = (workspaceId: string) => `testlauf:${workspaceId}`;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const PLATTFORMEN: FormatPlattform[] = ["INSTAGRAM", "LINKEDIN", "YOUTUBE"];
const FAKTEN: Fakt[] = [
  { text: "DEMO: Unser Herbstkurs hat 6 Termine à 90 Minuten.", quelle: "DEMO – eigene Kursbeschreibung (Beispiel)", geprueft: true },
  { text: "DEMO: Teilnahme ist online und vor Ort möglich.", quelle: "DEMO – eigene Kursbeschreibung (Beispiel)", geprueft: true },
];

async function testlaufKampagne(workspaceId: string) {
  return prisma.reichweitenKampagne.findUnique({ where: { erstellKennung: kennung(workspaceId) } });
}

export async function testlaufEntfernen(workspaceId: string) {
  // Inhalte hängen nur lose an der Kampagne (SetNull) – daher ausdrücklich mitlöschen.
  const k = await testlaufKampagne(workspaceId);
  if (!k || k.workspaceId !== workspaceId) return;
  await prisma.$transaction([
    prisma.contentItem.deleteMany({ where: { workspaceId, reichweitenKampagneId: k.id } }),
    prisma.reichweitenKampagne.delete({ where: { id: k.id } }),
  ]);
}

export async function testlaufZustand(workspaceId: string) {
  const k = await testlaufKampagne(workspaceId);
  if (!k || k.workspaceId !== workspaceId) return { schritt: 0, schritte: TESTLAUF_SCHRITTE, kampagne: null, ablauf: [], inhalte: [], links: [], ergebnis: null };
  const [ablauf, inhalte, links] = await Promise.all([
    prisma.kampagnenSchritt.findMany({ where: { kampagneId: k.id }, orderBy: { reihenfolge: "asc" } }),
    prisma.contentItem.findMany({
      where: { workspaceId, reichweitenKampagneId: k.id },
      select: { id: true, title: true, platform: true, status: true, caption: true, faktenJson: true, simuliertAm: true, publishedAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.empfehlungsLink.findMany({ where: { workspaceId, kampagneId: k.id }, select: { id: true, code: true, bezeichnung: true, herkunft: true, stufe: true, angebotUrl: true }, orderBy: { createdAt: "asc" } }),
  ]);
  return {
    schritt: k.testlaufSchritt,
    schritte: TESTLAUF_SCHRITTE,
    kampagne: k,
    ablauf,
    inhalte,
    links,
    ergebnis: k.testlaufSchritt >= 6 ? await kampagnenErgebnis(workspaceId, k.id) : null,
  };
}

/** Rückt genau einen Schritt weiter; parallele oder wiederholte Aufrufe rücken nicht doppelt vor. */
async function weiterVon(id: string, von: number) {
  return (await prisma.reichweitenKampagne.updateMany({ where: { id, testlaufSchritt: von }, data: { testlaufSchritt: von + 1 } })).count === 1;
}

async function schrittErledigt(kampagneId: string, art: string) {
  await prisma.kampagnenSchritt.updateMany({ where: { kampagneId, art, erledigtAm: null }, data: { erledigtAm: new Date() } });
}

export async function testlaufWeiter(user: Nutzer) {
  const { workspaceId } = user;
  const k = await testlaufKampagne(workspaceId);
  const schritt = k?.workspaceId === workspaceId ? k.testlaufSchritt : 0;

  if (!k || schritt === 0) {
    // 1. Briefing – über den Kampagnenassistenten, wie bei einer echten Kampagne
    const alle = await freigeber(workspaceId);
    const verantwortlich = alle.find((u) => u.id === user.userId) ?? alle[0];
    if (!verantwortlich) throw new KampagnenFehler("Im Workspace gibt es keinen Inhaber oder Admin für die Freigabe.");
    const start = Date.now() + 7 * 86_400_000;
    const { kampagne } = await kampagneAusAssistent(user, {
      titel: "DEMO-Testlauf – Herbstkurs bekannter machen",
      text: "Erfundene Beispielkampagne für den Testlauf. Nichts davon wird veröffentlicht.",
      ziel: "DEMO: 10 Anfragen für den Herbstkurs",
      hauptkennzahl: "ANFRAGEN",
      zielgruppe: "DEMO: Berufstätige aus der Region, 30–55 Jahre",
      zielUrl: "https://example.com/demo-herbstkurs",
      startAm: iso(start),
      endeAm: iso(start + 28 * 86_400_000),
      verantwortlichId: verantwortlich.id,
      budgetCent: null,
      erstellKennung: kennung(workspaceId),
      istDemo: true,
    });
    await weiterVon(kampagne.id, 0);
    return testlaufZustand(workspaceId);
  }

  if (schritt === 1) {
    // 2. Entwurf – regelbasierte Plattformvarianten (ohne KI, ohne Kosten), je Variante ein eigener Entwurf
    const varianten = plattformVarianten({
      thema: "DEMO: Herbstkurs",
      kernaussage: "DEMO: In sechs Terminen sicherer im Umgang mit dem Thema werden.",
      zielgruppe: k.zielgruppe,
      aufforderung: "Jetzt unverbindlich anfragen",
      zielUrl: k.zielUrl,
      fakten: FAKTEN,
      plattformen: PLATTFORMEN,
    });
    for (const v of varianten) await varianteUebernehmen(workspaceId, k.id, v);
    await schrittErledigt(k.id, "INHALT");
    await weiterVon(k.id, 1);
  } else if (schritt === 2) {
    // 3. Prüfung
    await prisma.contentItem.updateMany({ where: { workspaceId, reichweitenKampagneId: k.id, status: "DRAFT" }, data: { status: "IN_REVIEW" } });
    await schrittErledigt(k.id, "PRUEFUNG");
    await weiterVon(k.id, 2);
  } else if (schritt === 3) {
    // 4. Freigabe – dieselben Regeln wie bei echten Inhalten (verantwortliche Person, keine ungeprüften Aussagen)
    const items = await prisma.contentItem.findMany({ where: { workspaceId, reichweitenKampagneId: k.id, status: "IN_REVIEW" }, select: { id: true } });
    for (const i of items) {
      const sperre = await freigabeSperre(i.id, user);
      if (sperre) throw new KampagnenFehler(sperre, 409);
    }
    await prisma.contentItem.updateMany({ where: { id: { in: items.map((i) => i.id) } }, data: { status: "APPROVED" } });
    await schrittErledigt(k.id, "FREIGABE");
    await weiterVon(k.id, 3);
  } else if (schritt === 4) {
    // 5. Simulierte Ausführung – nichts wird gepostet; Demo-Links und Demo-Ereignisse genau einmal
    await prisma.$transaction(async (tx) => {
      if ((await tx.reichweitenKampagne.updateMany({ where: { id: k.id, testlaufSchritt: 4 }, data: { testlaufSchritt: 5 } })).count !== 1) return;
      const items = await tx.contentItem.findMany({ where: { workspaceId, reichweitenKampagneId: k.id, status: "APPROVED", simuliertAm: null }, select: { id: true, platform: true } });
      await tx.contentItem.updateMany({ where: { id: { in: items.map((i) => i.id) } }, data: { simuliertAm: new Date() } });
      const neu = (bezeichnung: string, extra: { parentId?: string; stufe?: number; herkunft?: string; angebotUrl?: string } = {}) =>
        eindeutigerCode().then((code) => tx.empfehlungsLink.create({ data: { workspaceId, kampagneId: k.id, code, bezeichnung, istDemo: true, ...extra } }));
      const insta = await neu("DEMO Instagram-Beitrag");
      const linkedin = await neu("DEMO LinkedIn-Beitrag", { angebotUrl: "https://example.com/demo-herbstkurs-firmen" });
      const youtube = await neu("DEMO YouTube-Short");
      const weitergegeben = await neu("", { parentId: linkedin.id, stufe: 2, herkunft: "BESUCHER" });
      const ereignisse: { linkId: string | null; art: string; n: number }[] = [
        { linkId: insta.id, art: "AUFRUF", n: 24 },
        { linkId: insta.id, art: "ZIEL_KLICK", n: 7 },
        { linkId: insta.id, art: "ANFRAGE", n: 2 },
        { linkId: linkedin.id, art: "AUFRUF", n: 15 },
        { linkId: linkedin.id, art: "ZIEL_KLICK", n: 6 },
        { linkId: linkedin.id, art: "ANFRAGE", n: 3 },
        { linkId: linkedin.id, art: "LINK_ERZEUGT", n: 1 },
        { linkId: weitergegeben.id, art: "AUFRUF", n: 4 },
        { linkId: weitergegeben.id, art: "ANFRAGE", n: 1 },
        { linkId: youtube.id, art: "AUFRUF", n: 9 },
        // Ohne Link gemessen (z. B. gelöschter Link) – bleibt „Herkunft unbekannt“
        { linkId: null, art: "ANFRAGE", n: 1 },
      ];
      await tx.empfehlungsEreignis.createMany({
        data: ereignisse.flatMap((e) => Array.from({ length: e.n }, () => ({ workspaceId, kampagneId: k.id, linkId: e.linkId, art: e.art, istDemo: true }))),
      });
      await tx.kampagnenSchritt.updateMany({ where: { kampagneId: k.id, art: "VEROEFFENTLICHUNG", erledigtAm: null }, data: { erledigtAm: new Date() } });
    });
  } else if (schritt === 5) {
    // 6. Auswertung
    await schrittErledigt(k.id, "AUSWERTUNG");
    await weiterVon(k.id, 5);
  }
  return testlaufZustand(workspaceId);
}
