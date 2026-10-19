/**
 * Kooperationen: Übersicht und persönliche Anfrage-Entwürfe. Es wird nichts
 * versendet, keine Kontaktliste ausgelesen und niemand automatisch angeschrieben.
 */
export const KOOP_ARTEN = {
  CREATOR: "Creator",
  REGIONAL: "Regionales Unternehmen",
  PARTNER: "Fachlicher Partner",
  KONTAKT: "Bestehender Geschäftskontakt",
} as const;

export const KOOP_FORMATE = {
  GEMEINSAMER_BEITRAG: "Gemeinsamer Beitrag",
  INTERVIEW: "Interview",
  EMPFEHLUNG: "Gegenseitige fachliche Empfehlung",
  AKTION: "Gemeinsame Aktion",
} as const;

export const KOOP_STATUS = {
  IDEE: "Idee",
  ANFRAGE_ENTWURF: "Anfrage-Entwurf",
  ANGEFRAGT: "Angefragt (selbst versendet)",
  IM_GESPRAECH: "Im Gespräch",
  VEREINBART: "Vereinbart",
  UMGESETZT: "Umgesetzt",
  ABGESCHLOSSEN: "Ausgewertet",
  ABGESAGT: "Abgesagt",
} as const;

/** Kennzeichnung gemeinsamer Beiträge (§ 5a Abs. 4 UWG, § 22 MStV, § 6 DDG). */
export const KOOP_KENNZEICHNUNG = {
  OFFEN: "Noch nicht geklärt",
  WERBUNG: "Als „Werbung“ kennzeichnen",
  ANZEIGE: "Als „Anzeige“ kennzeichnen",
  KEINE_GEGENLEISTUNG: "Keine Gegenleistung – keine Kennzeichnung nötig",
} as const;

export const KENNZEICHNUNG_HINWEIS =
  "Gibt es eine Gegenleistung (Geld, Produkte, Rabatte, gegenseitige Werbung), muss der Beitrag gut sichtbar als „Werbung“ oder „Anzeige“ gekennzeichnet sein (§ 5a Abs. 4 UWG, § 22 MStV). Bitte vor der Veröffentlichung klären und die Kennzeichnungsfunktion der Plattform nutzen.";

/** Warnung für die Übersicht, solange die Kennzeichnung bei vereinbarten oder umgesetzten Kooperationen offen ist. */
export function kennzeichnungWarnung(k: { status: string; kennzeichnung: string }): string | null {
  if (k.kennzeichnung !== "OFFEN") return null;
  return ["VEREINBART", "UMGESETZT", "ABGESCHLOSSEN"].includes(k.status) ? "Werbekennzeichnung noch nicht geklärt." : null;
}

export const PASSUNG = { HOCH: "hoch", MITTEL: "mittel", NIEDRIG: "niedrig", UNKLAR: "unklar" } as const;

/**
 * Gemeinsame Beiträge direkt aus der App (z. B. Instagram-Collab) gibt es nur,
 * wenn eine Schnittstelle das unterstützt. Derzeit ist keine angebunden.
 */
export function gemeinsamerBeitragDirekt(plattform: string): { moeglich: false; grund: string } {
  return {
    moeglich: false,
    grund: `Gemeinsame Beiträge auf ${plattform || "der Plattform"} sind aus der App nicht direkt ausführbar – keine passende Schnittstelle angebunden. Bitte in der Plattform-App selbst anlegen.`,
  };
}

export function anfrageEntwurf(input: {
  name: string;
  format: keyof typeof KOOP_FORMATE;
  idee: string;
  passungNotiz: string;
  absender: string;
  sie: boolean;
}): string {
  const { name, idee, passungNotiz, absender, sie } = input;
  const format = KOOP_FORMATE[input.format] ?? "Zusammenarbeit";
  const anrede = sie ? `Guten Tag ${name.trim() || "[Name]"},` : `Hallo ${name.trim() || "[Name]"},`;
  const du = sie
    ? { euch: "Ihnen", ihr: "Sie", euer: "Ihr", hast: "Hätten Sie" }
    : { euch: "dir", ihr: "du", euer: "dein", hast: "Hättest du" };
  return [
    anrede,
    "",
    `ich bin ${absender.trim() || "[Ihr Name / Unternehmen]"}. ${passungNotiz.trim() ? `Ich melde mich, weil ${passungNotiz.trim()}` : "[Warum gerade diese Person/Organisation – konkret und ehrlich]"}`,
    "",
    `Meine Idee: ${format.toLowerCase()} – ${idee.trim() || "[kurze Beschreibung]"}.`,
    "Falls es dabei eine Gegenleistung gibt, kennzeichnen wir den Beitrag beide offen als Werbung bzw. Anzeige.",
    `${du.hast} Interesse an einem kurzen Austausch dazu? Ich richte mich gern nach ${sie ? "Ihrem" : "deinem"} Zeitplan.`,
    "",
    "Viele Grüße",
    absender.trim() || "[Name]",
    "",
    "— Entwurf. Bitte persönlich anpassen und selbst versenden. Nichts wird automatisch verschickt.",
  ].join("\n");
}
