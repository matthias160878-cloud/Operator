/**
 * Geführter Ablauf „Inhalte zum Weiterempfehlen“: aus einem Briefing werden
 * Vorlagen für sechs Inhaltsarten. Es sind Vorlagen mit Platzhaltern in
 * [eckigen Klammern] — keine fertigen Aussagen. Ergebnisse, Referenzen oder
 * Erfolgsgarantien werden nie erfunden; Vorher-nachher gibt es nur mit einer
 * belegten Grundlage. Übernommene Vorschläge laufen als Entwurf durch die
 * bestehende Freigabe der Content Factory.
 */

export const TONALITAETEN = {
  LOCKER_DU: "Locker (du)",
  PERSOENLICH_DU: "Persönlich (du)",
  SACHLICH_SIE: "Sachlich (Sie)",
  FOERMLICH_SIE: "Förmlich (Sie)",
} as const;
export type Tonalitaet = keyof typeof TONALITAETEN;

export const AUFFORDERUNGEN = {
  SPEICHERN: "Zum Speichern",
  TEILEN: "Zum Teilen",
  ANFRAGEN: "Zum Anfragen",
  NEWSLETTER: "Zum Newsletter",
} as const;
export type Aufforderung = keyof typeof AUFFORDERUNGEN;

export const INHALTSARTEN = {
  PROBLEMLOESUNG: "Kurze Problemlösung",
  TIPPS: "Hilfreiche Tipps",
  VORHER_NACHHER: "Vorher-nachher-Beispiel",
  ERKLAERVIDEO: "Erklärvideo",
  CHECKLISTE: "Checkliste",
  KUNDENFRAGEN: "Häufige Kundenfragen",
} as const;
export type Inhaltsart = keyof typeof INHALTSARTEN;

export const PLATTFORMEN = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "LINKEDIN", "FACEBOOK"] as const;
export type IdeenPlattform = (typeof PLATTFORMEN)[number];

export interface Briefing {
  zielgruppe: string;
  problem: string;
  ergebnis: string;
  plattform: IdeenPlattform;
  format: string;
  tonalitaet: Tonalitaet;
  material: string;
  aufforderung: Aufforderung;
  /** Echte Grundlage für Vorher-nachher (z. B. „eigenes Projekt Mai 2026, Fotos vorhanden“). Leer = kein Vorher-nachher. */
  grundlageVorherNachher: string;
}

export interface Vorschlag {
  art: Inhaltsart;
  label: string;
  einstieg: string;
  text: string;
  bildVideoIdee: string;
  beschreibung: string;
  aufforderung: string;
  hinweise: string[];
  /** Grund, warum dieser Vorschlag nicht erstellt werden kann */
  gesperrt: string | null;
}

/** Wörter, die Erfolg versprechen. Sie werden in Briefings markiert und nie selbst erzeugt. */
const VERSPRECHEN = [/garantiert/i, /\bviral/i, /100\s?%/i, /millionen/i, /sofort reich/i, /über nacht/i, /ohne risiko/i, /jeder kunde/i];

export function versprechenImText(text: string): string[] {
  return VERSPRECHEN.filter((r) => r.test(text)).map((r) => (text.match(r)?.[0] ?? "").trim());
}

function anrede(t: Tonalitaet) {
  const sie = t === "SACHLICH_SIE" || t === "FOERMLICH_SIE";
  return {
    du: sie ? "Sie" : "du",
    hast: sie ? "Haben Sie" : "Hast du",
  };
}

const CTA_TEXTE: Record<Aufforderung, { du: string; sie: string }> = {
  SPEICHERN: {
    du: "Speicher dir den Beitrag, damit du ihn später wiederfindest.",
    sie: "Speichern Sie den Beitrag, damit Sie ihn später wiederfinden.",
  },
  TEILEN: {
    du: "Kennst du jemanden, dem das hilft? Teile es gern – nur wenn du magst.",
    sie: "Kennen Sie jemanden, dem das hilft? Teilen Sie es gern – nur wenn Sie mögen.",
  },
  ANFRAGEN: {
    du: "Fragen dazu? Über den Link in der Beschreibung kannst du uns direkt schreiben.",
    sie: "Fragen dazu? Über den Link in der Beschreibung können Sie uns direkt schreiben.",
  },
  NEWSLETTER: {
    du: "Mehr davon gibt es im Newsletter – die Anmeldung ist freiwillig, Link in der Beschreibung.",
    sie: "Mehr davon gibt es im Newsletter – die Anmeldung ist freiwillig, Link in der Beschreibung.",
  },
};

export function aufforderungText(a: Aufforderung, t: Tonalitaet): string {
  return anrede(t).du === "Sie" ? CTA_TEXTE[a].sie : CTA_TEXTE[a].du;
}

function sauber(s: string, fallback: string) {
  const t = s.trim();
  return t || fallback;
}

export function pruefeBriefing(b: Partial<Briefing>): string | null {
  if (!b.zielgruppe?.trim()) return "Bitte die Zielgruppe angeben.";
  if (!b.problem?.trim()) return "Bitte das Thema oder konkrete Problem angeben.";
  if (!b.ergebnis?.trim()) return "Bitte das gewünschte Ergebnis angeben.";
  if (!b.plattform || !PLATTFORMEN.includes(b.plattform)) return "Bitte eine Plattform wählen.";
  if (!b.tonalitaet || !(b.tonalitaet in TONALITAETEN)) return "Bitte eine Tonalität wählen.";
  if (!b.aufforderung || !(b.aufforderung in AUFFORDERUNGEN)) return "Bitte eine Handlungsaufforderung wählen.";
  return null;
}

export function erzeugeVorschlaege(b: Briefing): Vorschlag[] {
  const w = anrede(b.tonalitaet);
  const zg = sauber(b.zielgruppe, "[Zielgruppe]");
  const pr = sauber(b.problem, "[Problem]");
  const er = sauber(b.ergebnis, "[Ergebnis]");
  const fmt = sauber(b.format, "Kurzvideo");
  const mat = b.material.trim();
  const cta = aufforderungText(b.aufforderung, b.tonalitaet);
  const materialHinweis = mat ? `Vorhandenes Material nutzen: ${mat}.` : "Kein Material angegeben – eigene Aufnahmen oder Bilder einplanen.";
  const grund = [`Vorlage für ${b.plattform}, Format ${fmt}. Platzhalter in [ ] durch eigene, überprüfbare Angaben ersetzen.`];

  const vorschlaege: Vorschlag[] = [
    {
      art: "PROBLEMLOESUNG",
      label: INHALTSARTEN.PROBLEMLOESUNG,
      einstieg: `${pr}? So geh${w.du === "Sie" ? "en Sie" : "st du"} es in einem Schritt an.`,
      text: `Viele aus der Zielgruppe „${zg}“ kennen das: ${pr}.\nDer erste Schritt: [konkreter, selbst erprobter Schritt].\nWarum das hilft: [kurze, sachliche Begründung].\nZiel: ${er}.\n${cta}`,
      bildVideoIdee: `Problem in 2 Sekunden zeigen, dann den Schritt in einer Nahaufnahme. ${materialHinweis}`,
      beschreibung: `Kurze Lösung für: ${pr}. Für ${zg}.`,
      aufforderung: cta,
      hinweise: [...grund],
      gesperrt: null,
    },
    {
      art: "TIPPS",
      label: INHALTSARTEN.TIPPS,
      einstieg: `3 Tipps zu „${pr}“, die ${w.du} heute ausprobieren ${w.du === "Sie" ? "können" : "kannst"}.`,
      text: `Tipp 1: [Tipp aus eigener Erfahrung]\nTipp 2: [Tipp]\nTipp 3: [Tipp]\nWorauf es ankommt: ${er}.\n${cta}`,
      bildVideoIdee: `Je Tipp eine Texttafel oder ein Schnitt. ${materialHinweis}`,
      beschreibung: `Drei praktische Tipps für ${zg}.`,
      aufforderung: cta,
      hinweise: [...grund, "Keine Zahlen oder Ergebnisse nennen, die nicht belegt sind."],
      gesperrt: null,
    },
    {
      art: "VORHER_NACHHER",
      label: INHALTSARTEN.VORHER_NACHHER,
      einstieg: `Vorher – nachher: ${pr}.`,
      text: `Ausgangslage: [belegter Zustand vorher]\nWas gemacht wurde: [nachvollziehbare Schritte]\nErgebnis: [belegter Zustand nachher]\nGrundlage: ${b.grundlageVorherNachher.trim() || "[fehlt]"}\n${cta}`,
      bildVideoIdee: `Echte Vorher- und Nachher-Aufnahmen aus derselben Perspektive, ohne Filter oder Montage.`,
      beschreibung: `Nachvollziehbares Beispiel aus einem echten Fall.`,
      aufforderung: cta,
      hinweise: [...grund, "Nur mit echten Aufnahmen und Einverständnis der gezeigten Personen bzw. Kunden.", "Kein Versprechen, dass jeder dasselbe Ergebnis erzielt."],
      gesperrt: b.grundlageVorherNachher.trim()
        ? null
        : "Vorher-nachher braucht eine echte Grundlage (eigener Fall mit Aufnahmen oder dokumentiertes Kundenprojekt mit Einverständnis). Bitte im Briefing angeben.",
    },
    {
      art: "ERKLAERVIDEO",
      label: INHALTSARTEN.ERKLAERVIDEO,
      einstieg: `Was steckt eigentlich hinter „${pr}“? Kurz erklärt.`,
      text: `0–3 s: Frage stellen – ${pr}\n3–20 s: Erklärung in einfachen Worten [Kernaussage]\n20–35 s: Beispiel aus der Praxis [eigenes Beispiel]\n35–45 s: Was das für ${zg} heißt: ${er}\nSchluss: ${cta}`,
      bildVideoIdee: `Sprecher:in vor neutralem Hintergrund, einfache Grafik zur Kernaussage. ${materialHinweis}`,
      beschreibung: `Verständlich erklärt für ${zg}.`,
      aufforderung: cta,
      hinweise: [...grund],
      gesperrt: null,
    },
    {
      art: "CHECKLISTE",
      label: INHALTSARTEN.CHECKLISTE,
      einstieg: `Checkliste: ${pr} – ${w.hast} an alles gedacht?`,
      text: `☐ [Punkt 1]\n☐ [Punkt 2]\n☐ [Punkt 3]\n☐ [Punkt 4]\n☐ [Punkt 5]\nZiel: ${er}.\n${cta}`,
      bildVideoIdee: `Karussell mit einer Seite je Punkt oder eine übersichtliche Grafik zum Speichern.`,
      beschreibung: `Checkliste zum Abhaken für ${zg}.`,
      aufforderung: aufforderungText(b.aufforderung === "TEILEN" ? "TEILEN" : "SPEICHERN", b.tonalitaet),
      hinweise: [...grund],
      gesperrt: null,
    },
    {
      art: "KUNDENFRAGEN",
      label: INHALTSARTEN.KUNDENFRAGEN,
      einstieg: `Diese Frage bekommen wir oft: „[echte Kundenfrage zu ${pr}]“`,
      text: `Frage: [wörtlich oder sinngemäß aus echten Anfragen]\nKurze Antwort: [Antwort]\nWas ${w.du} jetzt tun ${w.du === "Sie" ? "können" : "kannst"}: [Schritt]\n${cta}`,
      bildVideoIdee: `Frage als Texteinblendung, Antwort direkt in die Kamera. ${materialHinweis}`,
      beschreibung: `Antwort auf eine häufige Frage von ${zg}.`,
      aufforderung: cta,
      hinweise: [...grund, "Nur Fragen verwenden, die tatsächlich gestellt wurden – ohne Namen der Fragenden."],
      gesperrt: null,
    },
  ];
  const warnung = versprechenImText(`${b.problem} ${b.ergebnis} ${b.material}`);
  if (warnung.length) {
    for (const v of vorschlaege) v.hinweise.push(`Achtung: Das Briefing enthält Erfolgsversprechen (${warnung.join(", ")}). Bitte vor der Freigabe entfernen oder belegen.`);
  }
  return vorschlaege;
}
