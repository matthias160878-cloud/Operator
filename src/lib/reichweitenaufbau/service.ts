import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api";
import { hashToken, newToken, CONFIRM_TTL_MS } from "@/lib/newsletter";
import { sendEmail, escapeHtml } from "@/lib/email";
import { aufbewahrungTage, demoAnlegen as weiterempfehlungDemo, demoEntfernen as weiterempfehlungDemoEntfernen, eindeutigerCode } from "@/lib/reichweite/service";
import { neuerCode } from "@/lib/reichweite/codes";
import { vergleiche, type VarianteEingabe, type VariantenMetrik } from "@/lib/reichweitenaufbau/varianten";
import { einwilligungsText, versandModus } from "@/lib/reichweitenaufbau/newsletterKunden";
import type { KampagnenBeleg } from "@/lib/reichweitenaufbau/werbung";

/** Kennzeichen für Demo-Inhalte in der Content Factory (ContentItem hat kein eigenes Demo-Feld). */
export const DEMO_FORMAT = "DEMO · Reichweitenaufbau";

export async function eigenerDatensatz<T>(finder: () => Promise<T | null>): Promise<T> {
  const r = await finder();
  if (!r) throw new NotFoundError();
  return r;
}

/** Selbst gemessene Werte einer Variante über ihren Empfehlungslink im Testzeitraum. */
export async function eigeneVariantenWerte(workspaceId: string, linkId: string, von: Date, bis: Date) {
  const zeitraum = { gte: von, lte: new Date(bis.getTime() + 86_399_999) };
  const [klicks, anfragen, newsletter] = await Promise.all([
    prisma.empfehlungsEreignis.count({ where: { workspaceId, linkId, art: "ZIEL_KLICK", createdAt: zeitraum } }),
    prisma.empfehlungsEreignis.count({ where: { workspaceId, linkId, art: "ANFRAGE", createdAt: zeitraum } }),
    prisma.newsletterKontakt.count({ where: { workspaceId, quelleLinkId: linkId, status: "ACTIVE", confirmedAt: zeitraum } }),
  ]);
  return { LINKKLICKS: klicks, ANFRAGEN: anfragen, NEWSLETTER: newsletter };
}

export async function variantenAuswertung(workspaceId: string, testId: string) {
  const test = await eigenerDatensatz(() =>
    prisma.variantenTest.findFirst({
      where: { id: testId, workspaceId },
      include: { varianten: { include: { messwerte: true, link: { select: { code: true } } }, orderBy: { createdAt: "asc" } } },
    })
  );
  const varianten: VarianteEingabe[] = [];
  for (const v of test.varianten) {
    const werte: VarianteEingabe["werte"] = {};
    // Neuester Eintrag je Metrik gilt.
    for (const m of [...v.messwerte].sort((a, b) => a.erfasstAm.getTime() - b.erfasstAm.getTime())) {
      werte[m.metrik as VariantenMetrik] = { wert: m.wert, quelle: m.quelle === "DEMO" ? "Demo-Daten" : "Manuell aus Plattform-Statistik" };
    }
    if (v.linkId) {
      const eigen = await eigeneVariantenWerte(workspaceId, v.linkId, test.laufzeitVon, test.laufzeitBis);
      for (const [k, wert] of Object.entries(eigen)) werte[k as VariantenMetrik] = { wert, quelle: test.istDemo ? "Eigene Messung (Demo-Daten)" : "Eigene Messung (Variantenlink)" };
    }
    varianten.push({ id: v.id, label: v.label, plattform: v.plattform, veroeffentlichtAm: v.veroeffentlichtAm, werte });
  }
  return {
    test,
    ergebnis: vergleiche({
      hauptkennzahl: test.hauptkennzahl as VariantenMetrik,
      zufallsverteilt: test.zufallsverteilt,
      laufzeitBis: test.laufzeitBis,
      varianten,
    }),
  };
}

/** Gemessene Ergebnisse je Reichweiten-Kampagne als Grundlage für Werbevorschläge. */
export async function kampagnenBelege(workspaceId: string): Promise<KampagnenBeleg[]> {
  const kampagnen = await prisma.reichweitenKampagne.findMany({ where: { workspaceId }, select: { id: true, titel: true, istDemo: true } });
  const gruppen = await prisma.empfehlungsEreignis.groupBy({ by: ["kampagneId", "art"], where: { workspaceId }, _count: { _all: true } });
  const nl = await prisma.newsletterKontakt.groupBy({ by: ["quelleKampagneId"], where: { workspaceId, status: "ACTIVE" }, _count: { _all: true } });
  const zahl = (k: string, art: string) => gruppen.find((g) => g.kampagneId === k && g.art === art)?._count._all ?? 0;
  return kampagnen.map((k) => ({
    kampagneId: k.id,
    titel: k.titel,
    istDemo: k.istDemo,
    aufrufe: zahl(k.id, "AUFRUF"),
    zielKlicks: zahl(k.id, "ZIEL_KLICK"),
    anfragen: zahl(k.id, "ANFRAGE"),
    newsletterBestaetigt: nl.find((n) => n.quelleKampagneId === k.id)?._count._all ?? 0,
  }));
}

// ── Newsletter ──────────────────────────────────────────────────────────────

export async function newsletterAnmelden(input: {
  seite: { id: string; workspaceId: string; kampagneId: string | null; istDemo: boolean; titel: string; themen: string };
  absender: string;
  email: string;
  themen: string[];
  refCode: string | null;
  origin: string;
}): Promise<{ modus: "ECHT" | "DEMO"; demoBestaetigungsUrl: string | null; demoAbmeldeUrl: string | null }> {
  const { seite, email } = input;
  const modus = versandModus();
  const demo = seite.istDemo || modus === "DEMO";
  const now = new Date();
  // Herkunft nur aus einem Link derselben Kampagne übernehmen.
  const link = input.refCode
    ? await prisma.empfehlungsLink.findFirst({ where: { code: input.refCode, workspaceId: seite.workspaceId, widerrufenAm: null } })
    : null;
  const vorhanden = await prisma.newsletterKontakt.findUnique({ where: { workspaceId_email: { workspaceId: seite.workspaceId, email } } });
  await prisma.newsletterEreignis.create({ data: { workspaceId: seite.workspaceId, seiteId: seite.id, art: "ANMELDUNG", istDemo: demo } });
  if (vorhanden?.status === "ACTIVE") return { modus, demoBestaetigungsUrl: null, demoAbmeldeUrl: null }; // kein Doppelkontakt, keine erneute Mail
  if (vorhanden?.lastMailAt && now.getTime() - vorhanden.lastMailAt.getTime() < 10 * 60_000) return { modus, demoBestaetigungsUrl: null, demoAbmeldeUrl: null };

  const confirm = newToken();
  const unsubscribe = newToken();
  const daten = {
    status: "PENDING",
    themen: JSON.stringify(input.themen),
    confirmTokenHash: confirm.hash,
    confirmExpiresAt: new Date(now.getTime() + CONFIRM_TTL_MS),
    unsubscribeHash: unsubscribe.hash,
    consentText: einwilligungsText(input.absender, input.themen),
    consentAt: now,
    lastMailAt: now,
    unsubscribedAt: null,
    seiteId: seite.id,
    quelleKampagneId: link?.kampagneId ?? seite.kampagneId,
    quelleLinkId: link?.id ?? null,
    istDemo: demo,
  };
  await prisma.newsletterKontakt.upsert({
    where: { workspaceId_email: { workspaceId: seite.workspaceId, email } },
    create: { workspaceId: seite.workspaceId, email, ...daten },
    update: daten,
  });
  const bestaetigen = `${input.origin}/api/nl/bestaetigen?t=${confirm.token}`;
  const abmelden = `${input.origin}/api/nl/abmelden?t=${unsubscribe.token}`;
  // Im Demo-Modus gibt es keine E-Mail: Bestätigungs- und Abmeldelink gehen deutlich als DEMO an die anmeldende Person zurück.
  if (modus === "DEMO") return { modus, demoBestaetigungsUrl: bestaetigen, demoAbmeldeUrl: abmelden };
  const text = `Guten Tag,\n\nbitte bestätigen Sie Ihre Anmeldung zum Newsletter „${seite.titel}“ von ${input.absender}:\n${bestaetigen}\n\nOhne Bestätigung erhalten Sie nichts.\nAbmelden: ${abmelden}`;
  await sendEmail({
    to: email,
    subject: `Bitte bestätigen: Newsletter ${input.absender}`,
    text,
    html: `<p>Guten Tag,</p><p>bitte bestätigen Sie Ihre Anmeldung zum Newsletter „${escapeHtml(seite.titel)}“ von ${escapeHtml(input.absender)}:</p><p><a href="${escapeHtml(bestaetigen)}">Anmeldung bestätigen</a></p><p>Ohne Bestätigung erhalten Sie nichts.</p><p style="font-size:12px">Abmelden: <a href="${escapeHtml(abmelden)}">${escapeHtml(abmelden)}</a></p>`,
    idempotencyKey: `nl-${confirm.hash.slice(0, 32)}`,
  });
  return { modus, demoBestaetigungsUrl: null, demoAbmeldeUrl: null };
}

export async function newsletterBestaetigen(token: string) {
  const k = await prisma.newsletterKontakt.findUnique({ where: { confirmTokenHash: hashToken(token) } });
  if (!k || !k.confirmExpiresAt || k.confirmExpiresAt < new Date()) return null;
  await prisma.newsletterKontakt.update({
    where: { id: k.id },
    data: { status: "ACTIVE", confirmedAt: new Date(), confirmTokenHash: null, confirmExpiresAt: null },
  });
  if (k.seiteId) await prisma.newsletterEreignis.create({ data: { workspaceId: k.workspaceId, seiteId: k.seiteId, art: "BESTAETIGT", istDemo: k.istDemo } });
  return k;
}

export async function newsletterAbmelden(token: string) {
  const k = await prisma.newsletterKontakt.findUnique({ where: { unsubscribeHash: hashToken(token) } });
  if (!k) return null;
  if (k.status !== "UNSUBSCRIBED") {
    await prisma.newsletterKontakt.update({ where: { id: k.id }, data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date(), confirmTokenHash: null } });
    if (k.seiteId) await prisma.newsletterEreignis.create({ data: { workspaceId: k.workspaceId, seiteId: k.seiteId, art: "ABGEMELDET", istDemo: k.istDemo } });
  }
  return k;
}

/** Datensparsamkeit: unbestätigte Anmeldungen und Abmeldungen nach 30 Tagen löschen, Zählereignisse nach der Aufbewahrungsfrist. */
export async function newsletterAufraeumen(workspaceId?: string) {
  const w = workspaceId ? { workspaceId } : {};
  const grenze30 = new Date(Date.now() - 30 * 86_400_000);
  await prisma.newsletterKontakt.deleteMany({ where: { ...w, status: "PENDING", createdAt: { lt: grenze30 }, confirmedAt: null, lastMailAt: { lt: grenze30 } } });
  await prisma.newsletterKontakt.deleteMany({ where: { ...w, status: "UNSUBSCRIBED", unsubscribedAt: { lt: grenze30 } } });
  await prisma.newsletterEreignis.deleteMany({ where: { ...w, createdAt: { lt: new Date(Date.now() - aufbewahrungTage() * 86_400_000) } } });
}

export async function seitenZahlen(workspaceId: string) {
  const g = await prisma.newsletterEreignis.groupBy({ by: ["seiteId", "art"], where: { workspaceId }, _count: { _all: true } });
  const k = await prisma.newsletterKontakt.groupBy({ by: ["seiteId", "status"], where: { workspaceId }, _count: { _all: true } });
  return { ereignisse: g.map((x) => ({ seiteId: x.seiteId, art: x.art, anzahl: x._count._all })), kontakte: k.map((x) => ({ seiteId: x.seiteId, status: x.status, anzahl: x._count._all })) };
}

export async function neuerSeitenCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = neuerCode();
    if (!(await prisma.newsletterSeite.findUnique({ where: { code } }))) return code;
  }
  throw new Error("Kein freier Code gefunden.");
}

/** Datum ohne Uhrzeit (UTC-Mitternacht) – so wie Datumsfelder im Formular gespeichert werden. */
const tagesbeginn = (ms: number) => new Date(new Date(ms).toISOString().slice(0, 10));

// ── Demo ────────────────────────────────────────────────────────────────────

export async function demoEntfernen(workspaceId: string) {
  const w = { workspaceId, istDemo: true };
  await prisma.$transaction([
    prisma.variantenTest.deleteMany({ where: w }),
    prisma.kooperation.deleteMany({ where: w }),
    prisma.werbeplan.deleteMany({ where: w }),
    prisma.newsletterAusgabe.deleteMany({ where: w }),
    prisma.newsletterKontakt.deleteMany({ where: w }),
    prisma.newsletterSeite.deleteMany({ where: w }),
    prisma.contentItem.deleteMany({ where: { workspaceId, format: DEMO_FORMAT } }),
  ]);
  await weiterempfehlungDemoEntfernen(workspaceId);
}

/** Vollständiger Demo-Ablauf mit erfundenen, durchgehend gekennzeichneten Daten. Nichts wird veröffentlicht oder versendet. */
export async function demoAnlegen(workspaceId: string) {
  await demoEntfernen(workspaceId);
  const kampagne = await weiterempfehlungDemo(workspaceId);
  const tag = 86_400_000;
  const jetzt = Date.now();

  await prisma.contentItem.createMany({
    data: [
      {
        workspaceId,
        title: "DEMO – Checkliste: 5 Punkte vor dem ersten Reel",
        platform: "INSTAGRAM",
        format: DEMO_FORMAT,
        status: "IN_REVIEW",
        hook: "Checkliste: Hast du an alles gedacht?",
        script: "☐ [Punkt 1]\n☐ [Punkt 2]\n☐ [Punkt 3]",
        caption: "DEMO-Vorlage – nicht veröffentlicht.",
        thumbnailIdea: "Karussell mit einer Seite je Punkt",
      },
      {
        workspaceId,
        title: "DEMO – Häufige Kundenfrage beantwortet",
        platform: "YOUTUBE",
        format: DEMO_FORMAT,
        status: "DRAFT",
        hook: "Diese Frage bekommen wir oft …",
        script: "Frage: [echte Frage]\nAntwort: [Antwort]",
        caption: "DEMO-Vorlage – nicht veröffentlicht.",
        thumbnailIdea: "Frage als Texteinblendung",
      },
    ],
  });

  // Variantenvergleich mit je einem eigenen Link pro Variante
  const linkA = await prisma.empfehlungsLink.create({
    data: { workspaceId, kampagneId: kampagne.id, code: await eindeutigerCode(), bezeichnung: "DEMO Variante A (Einstieg Frage)", istDemo: true },
  });
  const linkB = await prisma.empfehlungsLink.create({
    data: { workspaceId, kampagneId: kampagne.id, code: await eindeutigerCode(), bezeichnung: "DEMO Variante B (Einstieg Ergebnis)", istDemo: true },
  });
  const von = new Date(jetzt - 12 * tag);
  const bis = new Date(jetzt - 2 * tag);
  const test = await prisma.variantenTest.create({
    data: {
      workspaceId,
      kampagneId: kampagne.id,
      istDemo: true,
      titel: "DEMO – Einstieg: Frage oder Ergebnis?",
      ziel: "Mehr Klicks zur Angebotsseite",
      hauptkennzahl: "LINKKLICKS",
      eigenschaft: "EINSTIEG",
      datenquelle: "Instagram-Statistik (manuell) + eigene Messung über Variantenlinks",
      laufzeitVon: von,
      laufzeitBis: bis,
      varianten: {
        create: [
          { workspaceId, label: "Variante A", beschreibung: "Einstieg mit Frage", plattform: "INSTAGRAM", linkId: linkA.id, veroeffentlichtAm: new Date(jetzt - 12 * tag) },
          { workspaceId, label: "Variante B", beschreibung: "Einstieg mit Ergebnis", plattform: "INSTAGRAM", linkId: linkB.id, veroeffentlichtAm: new Date(jetzt - 9 * tag) },
        ],
      },
    },
    include: { varianten: true },
  });
  const [vA, vB] = test.varianten;
  const mw = (varianteId: string, metrik: string, wert: number) => ({ workspaceId, varianteId, metrik, wert, quelle: "DEMO" });
  await prisma.variantenMesswert.createMany({
    data: [
      mw(vA.id, "AUFRUFE", 1840), mw(vA.id, "WIEDERGABEDAUER_SEK", 9.4), mw(vA.id, "ABSCHLUSSRATE_PROZENT", 31), mw(vA.id, "WEITERLEITUNGEN", 22), mw(vA.id, "GESPEICHERT", 41), mw(vA.id, "PROFILBESUCHE", 63),
      mw(vB.id, "AUFRUFE", 1210), mw(vB.id, "WIEDERGABEDAUER_SEK", 11.2), mw(vB.id, "ABSCHLUSSRATE_PROZENT", 38), mw(vB.id, "WEITERLEITUNGEN", 15), mw(vB.id, "GESPEICHERT", 52), mw(vB.id, "PROFILBESUCHE", 48),
    ],
  });
  const ev = (linkId: string, art: string, n: number, abTag: number) =>
    Array.from({ length: n }, (_, i) => ({ workspaceId, kampagneId: kampagne.id, linkId, art, istDemo: true, createdAt: new Date(jetzt - (abTag - (i % 7)) * tag) }));
  await prisma.empfehlungsEreignis.createMany({
    data: [...ev(linkA.id, "AUFRUF", 70, 11), ...ev(linkA.id, "ZIEL_KLICK", 31, 11), ...ev(linkB.id, "AUFRUF", 44, 8), ...ev(linkB.id, "ZIEL_KLICK", 14, 8), ...ev(linkA.id, "ANFRAGE", 2, 10)],
  });

  // Kooperationen
  const koopLink = await prisma.empfehlungsLink.create({
    data: { workspaceId, kampagneId: kampagne.id, code: await eindeutigerCode(), bezeichnung: "DEMO Kooperation Bäckerei Beispiel", istDemo: true },
  });
  await prisma.kooperation.createMany({
    data: [
      {
        workspaceId, istDemo: true, name: "DEMO Bäckerei Beispiel", profilUrl: "https://example.com/baeckerei", art: "REGIONAL", zielgruppenpassung: "HOCH",
        passungNotiz: "gleiche Region, ähnliche Kundschaft", idee: "Gemeinsame Aktion zum Stadtfest", format: "AKTION", status: "IM_GESPRAECH",
        naechsterSchritt: "Termin zur Abstimmung", termin: new Date(jetzt + 3 * tag), kampagneId: kampagne.id, linkId: koopLink.id,
      },
      {
        workspaceId, istDemo: true, name: "DEMO Creatorin Musterfrau", profilUrl: "https://example.com/creatorin", art: "CREATOR", zielgruppenpassung: "MITTEL",
        passungNotiz: "teilweise gleiche Interessen", idee: "Interview zu häufigen Fragen", format: "INTERVIEW", status: "IDEE", naechsterSchritt: "",
      },
      {
        workspaceId, istDemo: true, name: "DEMO Steuerbüro Beispiel", profilUrl: "", art: "PARTNER", zielgruppenpassung: "UNKLAR",
        passungNotiz: "", idee: "Gegenseitige fachliche Empfehlung", format: "EMPFEHLUNG", status: "ANFRAGE_ENTWURF", naechsterSchritt: "Entwurf persönlich anpassen",
        anfrageEntwurf: "Guten Tag [Name],\n\n… (DEMO-Entwurf – nicht versendet)",
      },
    ],
  });

  await prisma.werbeplan.create({
    data: {
      workspaceId, istDemo: true, titel: "DEMO – Checkliste bewerben", kampagneId: kampagne.id, plattform: "META", ziel: "TRAFFIC",
      zielgruppe: "Selbstständige 25–55, Interesse Social Media", zielgruppenArt: "NEU", region: "Deutschland (Baden-Württemberg)", sprache: "Deutsch",
      startAm: tagesbeginn(jetzt + 7 * tag), endeAm: tagesbeginn(jetzt + 13 * tag), tagesbudgetCent: 1000, gesamtbudgetCent: 7000,
      zielUrl: "https://example.com/demo-zielseite", erfolgsmessung: "Klicks zur Zielseite über eigenen Kampagnenlink; Anfragen über Formular", status: "PRUEFUNG",
    },
  });

  const seite = await prisma.newsletterSeite.create({
    data: {
      workspaceId, istDemo: true, code: await neuerSeitenCode(), titel: "DEMO – Monatliche Praxistipps",
      themenBeschreibung: "Einmal im Monat drei praktische Tipps für mehr Sichtbarkeit. Kein Spam, Abmeldung jederzeit.",
      themen: JSON.stringify(["Praxistipps", "Neue Angebote"]), kampagneId: kampagne.id,
    },
  });
  await prisma.newsletterEreignis.createMany({
    data: [
      ...Array.from({ length: 58 }, (_, i) => ({ workspaceId, seiteId: seite.id, art: "AUFRUF", istDemo: true, createdAt: new Date(jetzt - (i % 10) * tag) })),
      ...Array.from({ length: 9 }, (_, i) => ({ workspaceId, seiteId: seite.id, art: "ANMELDUNG", istDemo: true, createdAt: new Date(jetzt - (i % 10) * tag) })),
      ...Array.from({ length: 6 }, (_, i) => ({ workspaceId, seiteId: seite.id, art: "BESTAETIGT", istDemo: true, createdAt: new Date(jetzt - (i % 10) * tag) })),
    ],
  });
  for (const [i, status] of (["ACTIVE", "ACTIVE", "PENDING"] as const).entries()) {
    await prisma.newsletterKontakt.create({
      data: {
        workspaceId, istDemo: true, email: `demo-kontakt-${i + 1}@example.invalid`, status, themen: JSON.stringify(["Praxistipps"]),
        unsubscribeHash: newToken().hash, consentText: "DEMO-Einwilligung", consentAt: new Date(jetzt - 5 * tag),
        confirmedAt: status === "ACTIVE" ? new Date(jetzt - 5 * tag) : null, seiteId: seite.id, quelleKampagneId: kampagne.id,
        quelleLinkId: i === 0 ? linkA.id : null,
      },
    });
  }
  await prisma.newsletterAusgabe.create({
    data: {
      workspaceId, istDemo: true, betreff: "DEMO – 3 Tipps für den Herbst", text: "Hallo,\n\nhier sind drei Tipps … [DEMO-Text]\n\nViele Grüße",
      bildIdee: "Herbstliches Titelbild mit eigenem Foto", themen: JSON.stringify(["Praxistipps"]), kampagneId: kampagne.id, status: "ENTWURF",
    },
  });
  return kampagne;
}
