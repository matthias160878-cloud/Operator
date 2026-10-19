/**
 * Vorschläge für freiwillige Handlungsaufforderungen und Begleittexte.
 * Bewusst ohne Versprechen von Reichweite oder „Viralität“.
 */
export const CTA_VORSCHLAEGE = [
  "Kennst du jemanden, für den das hilfreich ist? Teile den Link gern – nur wenn du magst.",
  "Wenn dir der Beitrag gefallen hat, freuen wir uns über eine Empfehlung an Menschen, die das interessiert.",
  "Speichere den Beitrag für später oder schick ihn an eine Person, der er weiterhilft.",
  "Fragen dazu? Über den Link kannst du uns direkt eine Anfrage schicken.",
];

export function begleittexte(titel: string): string[] {
  const t = titel.trim() || "diesen Beitrag";
  return [
    `Hab gerade „${t}“ gesehen und dachte an dich:`,
    `Das könnte dich interessieren – „${t}“:`,
    `Kurzer Tipp von mir: „${t}“`,
  ];
}

/** Hinweise, die in der Übersicht immer sichtbar sind. */
export const KEINE_GARANTIE =
  "Teilen ist immer freiwillig. Ob und wie weit ein Beitrag weitergegeben wird, entscheiden die Zuschauer und die Plattformen – nicht diese App.";
