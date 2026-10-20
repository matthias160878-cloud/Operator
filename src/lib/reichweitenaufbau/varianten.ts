/**
 * Varianten auswerten. Reine Funktionen, ohne Datenbank.
 *
 * Regeln:
 *  - Organisch zu verschiedenen Zeiten veröffentlichte Varianten sind ein
 *    „Variantenvergleich“, kein A/B-Test. A/B-Test heißt es nur, wenn die
 *    Plattform selbst zufällig verteilt hat (zufallsverteilt = true).
 *  - Ein Unterschied wird nur bei ausreichender Datenmenge und statistisch
 *    auffälligem Ergebnis genannt (Zwei-Anteile-z-Test, |z| ≥ 1,96, je
 *    Variante mindestens 100 Aufrufe und 10 Ereignisse). Sonst: keine Aussage.
 *  - Durchschnittswerte der Plattform (Wiedergabedauer, Abschlussrate) lassen
 *    ohne Einzeldaten keinen Test zu — nur Gegenüberstellung.
 *  - Varianten auf unterschiedlichen Plattformen werden nicht gewertet.
 *  - Es gibt keine plattformübergreifende Summe als „eindeutige Reichweite“.
 */

export type MetrikArt = "BEZUG" | "ANZAHL" | "DURCHSCHNITT";

export const VARIANTEN_METRIKEN = {
  AUFRUFE: { label: "Aufrufe", art: "BEZUG", einheit: "Aufrufe laut Plattform (keine Personen)" },
  WIEDERGABEDAUER_SEK: { label: "Ø Wiedergabedauer", art: "DURCHSCHNITT", einheit: "Sekunden (Durchschnitt laut Plattform)" },
  ABSCHLUSSRATE_PROZENT: { label: "Abschlussrate", art: "DURCHSCHNITT", einheit: "% laut Plattform (Definition je Plattform verschieden)" },
  WEITERLEITUNGEN: { label: "Weiterleitungen", art: "ANZAHL", einheit: "Teilungen laut Plattform" },
  GESPEICHERT: { label: "Gespeichert", art: "ANZAHL", einheit: "Speicherungen laut Plattform" },
  PROFILBESUCHE: { label: "Profilbesuche", art: "ANZAHL", einheit: "Profilaufrufe laut Plattform" },
  LINKKLICKS: { label: "Linkklicks", art: "ANZAHL", einheit: "Klicks zur Zielseite (eigene Messung über den Variantenlink)" },
  NEWSLETTER: { label: "Newsletter-Anmeldungen", art: "ANZAHL", einheit: "bestätigte Anmeldungen (Double-Opt-in) über den Variantenlink" },
  ANFRAGEN: { label: "Anfragen", art: "ANZAHL", einheit: "Anfragen über das Formular des Variantenlinks (Qualifizierung manuell)" },
} as const satisfies Record<string, { label: string; art: MetrikArt; einheit: string }>;
export type VariantenMetrik = keyof typeof VARIANTEN_METRIKEN;
export const VARIANTEN_METRIK_KEYS = Object.keys(VARIANTEN_METRIKEN) as VariantenMetrik[];
/** Diese Werte werden über den Empfehlungslink der Variante selbst gemessen, nicht eingetragen. */
export const EIGENE_METRIKEN: VariantenMetrik[] = ["LINKKLICKS", "NEWSLETTER", "ANFRAGEN"];

export const EIGENSCHAFTEN = {
  EINSTIEG: "Einstieg (erste Sekunden)",
  TITEL: "Titel",
  VORSCHAUBILD: "Vorschaubild",
  LAENGE: "Länge",
  CTA: "Handlungsaufforderung",
} as const;

export const MIN_AUFRUFE = 100;
export const MIN_EREIGNISSE = 10;
const Z_GRENZE = 1.96;

export interface VarianteEingabe {
  id: string;
  label: string;
  plattform: string;
  veroeffentlichtAm: Date | null;
  /** Werte je Metrik; null = nicht vorhanden */
  werte: Partial<Record<VariantenMetrik, { wert: number; quelle: string } | null>>;
}

export interface Zelle {
  wert: number | null;
  quelle: string | null;
  /** Anteil an den Aufrufen in Prozent (nur bei Anzahl-Metriken mit Aufrufen) */
  quoteProzent: number | null;
}

export interface VariantenErgebnis {
  bezeichnung: "A/B-Test" | "Variantenvergleich";
  hauptkennzahl: VariantenMetrik;
  status: "KEINE_AUSSAGE" | "HINWEIS" | "AUFFAELLIG";
  aussage: string;
  formel: string;
  z: number | null;
  tabelle: { varianteId: string; label: string; plattform: string; zellen: Record<VariantenMetrik, Zelle> }[];
  hinweise: string[];
  einschaetzung: string[];
}

export function quote(anzahl: number, aufrufe: number): number | null {
  return aufrufe > 0 ? (anzahl / aufrufe) * 100 : null;
}

/** Zwei-Anteile-z-Test (gepoolt). */
export function zWert(x1: number, n1: number, x2: number, n2: number): number | null {
  if (n1 <= 0 || n2 <= 0) return null;
  const p = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (se === 0) return null;
  return (x1 / n1 - x2 / n2) / se;
}

const fmt = (n: number, stellen = 1) => n.toLocaleString("de-DE", { maximumFractionDigits: stellen });

export function vergleiche(input: {
  hauptkennzahl: VariantenMetrik;
  zufallsverteilt: boolean;
  laufzeitBis: Date;
  jetzt?: Date;
  varianten: VarianteEingabe[];
}): VariantenErgebnis {
  const { hauptkennzahl, varianten } = input;
  const jetzt = input.jetzt ?? new Date();
  const info = VARIANTEN_METRIKEN[hauptkennzahl];
  const bezeichnung = input.zufallsverteilt ? "A/B-Test" : "Variantenvergleich";
  const hinweise: string[] = [];
  const einschaetzung: string[] = [];

  const tabelle = varianten.map((v) => {
    const aufrufe = v.werte.AUFRUFE?.wert ?? null;
    const zellen = {} as Record<VariantenMetrik, Zelle>;
    for (const m of VARIANTEN_METRIK_KEYS) {
      const w = v.werte[m] ?? null;
      zellen[m] = {
        wert: w ? w.wert : null,
        quelle: w ? w.quelle : null,
        quoteProzent: w && VARIANTEN_METRIKEN[m].art === "ANZAHL" && aufrufe ? quote(w.wert, aufrufe) : null,
      };
    }
    return { varianteId: v.id, label: v.label, plattform: v.plattform, zellen };
  });

  if (!input.zufallsverteilt) {
    hinweise.push(
      "Variantenvergleich, kein A/B-Test: Die Varianten wurden nicht zufällig auf dasselbe Publikum verteilt. Unterschiede können auch an Zeitpunkt, Wochentag oder Plattform-Ausspielung liegen."
    );
  }
  hinweise.push("Werte verschiedener Plattformen werden nicht addiert; Aufrufe sind keine Personen.");

  let formel = info.art === "ANZAHL" ? `${info.label} ÷ Aufrufe × 100 (je Variante, gleiche Plattform)` : `${info.label} laut Plattform (Durchschnitt, keine Einzeldaten)`;
  if (hauptkennzahl === "AUFRUFE") formel = "Aufrufe laut Plattform (absolute Zahl, abhängig von der Ausspielung)";

  const ergebnis = (status: VariantenErgebnis["status"], aussage: string, z: number | null = null): VariantenErgebnis => ({
    bezeichnung,
    hauptkennzahl,
    status,
    aussage,
    formel,
    z,
    tabelle,
    hinweise,
    einschaetzung,
  });

  if (varianten.length < 2) return ergebnis("KEINE_AUSSAGE", "Mindestens zwei Varianten nötig.");
  const plattformen = new Set(varianten.map((v) => v.plattform));
  if (plattformen.size > 1) {
    return ergebnis("KEINE_AUSSAGE", "Varianten liegen auf verschiedenen Plattformen – Definitionen und Ausspielung unterscheiden sich, daher keine Wertung.");
  }
  if (jetzt < input.laufzeitBis) hinweise.push("Die festgelegte Laufzeit ist noch nicht vorbei – Zwischenstand.");

  if (info.art === "DURCHSCHNITT" || info.art === "BEZUG") {
    const mitWert = tabelle.filter((t) => t.zellen[hauptkennzahl].wert !== null);
    if (mitWert.length >= 2) {
      const best = [...mitWert].sort((a, b) => b.zellen[hauptkennzahl].wert! - a.zellen[hauptkennzahl].wert!)[0];
      einschaetzung.push(
        `Einschätzung: ${best.label} hat den höchsten Wert bei „${info.label}“. Ohne Einzeldaten ist nicht prüfbar, ob der Unterschied mehr als Zufall ist.`
      );
    }
    return ergebnis("KEINE_AUSSAGE", `Für „${info.label}“ ist kein statistischer Vergleich möglich (nur Werte der Plattform ohne Einzeldaten).`);
  }

  // Anzahl-Metrik mit Aufrufen als Bezugsgröße
  const kandidaten = tabelle
    .map((t) => ({ t, x: t.zellen[hauptkennzahl].wert, n: t.zellen.AUFRUFE.wert }))
    .filter((k): k is { t: (typeof tabelle)[number]; x: number; n: number } => k.x !== null && k.n !== null && k.n > 0);
  if (kandidaten.length < 2) {
    return ergebnis("KEINE_AUSSAGE", `Es fehlen Werte für „${info.label}“ oder die Aufrufe als Bezugsgröße bei mindestens einer Variante.`);
  }
  const zuWenig = kandidaten.filter((k) => k.n < MIN_AUFRUFE || k.x < MIN_EREIGNISSE);
  const sortiert = [...kandidaten].sort((a, b) => b.x / b.n - a.x / a.n);
  const [a, b] = sortiert;
  const z = zWert(a.x, a.n, b.x, b.n);
  if (zuWenig.length) {
    return ergebnis(
      "KEINE_AUSSAGE",
      `Zu wenige Daten für eine Aussage (nötig je Variante: mindestens ${MIN_AUFRUFE} Aufrufe und ${MIN_EREIGNISSE} Ereignisse; zu wenig bei ${zuWenig.map((k) => k.t.label).join(", ")}).`,
      z
    );
  }
  const qa = (a.x / a.n) * 100;
  const qb = (b.x / b.n) * 100;
  if (z === null || Math.abs(z) < Z_GRENZE) {
    return ergebnis("KEINE_AUSSAGE", `Kein belastbarer Unterschied: ${a.t.label} ${fmt(qa)} % gegenüber ${b.t.label} ${fmt(qb)} % (z = ${z === null ? "–" : fmt(z, 2)}, Grenze ${Z_GRENZE}).`, z);
  }
  if (input.zufallsverteilt) {
    einschaetzung.push(`Einschätzung: Die Eigenschaft von ${a.t.label} für weitere Beiträge testen – ein einzelner Test ist keine Regel.`);
    return ergebnis("AUFFAELLIG", `${a.t.label} liegt statistisch auffällig vorn: ${fmt(qa)} % gegenüber ${fmt(qb)} % (z = ${fmt(z, 2)}).`, z);
  }
  einschaetzung.push(`Einschätzung: ${a.t.label} erneut unter vergleichbaren Bedingungen prüfen, bevor daraus eine Regel wird.`);
  return ergebnis(
    "HINWEIS",
    `Hinweis, kein Beweis: ${a.t.label} ${fmt(qa)} % gegenüber ${b.t.label} ${fmt(qb)} % (z = ${fmt(z, 2)}). Da nicht zufällig verteilt, kann der Unterschied auch andere Ursachen haben.`,
    z
  );
}
