/** Reine Regeln für den Kunden-Newsletter (auch im Browser nutzbar). */

export function einwilligungsText(absender: string, themen: string[]): string {
  const t = themen.length ? ` zu den Themen: ${themen.join(", ")}` : "";
  return `Ich möchte den Newsletter von ${absender}${t} erhalten und bin mit der Verarbeitung meiner E-Mail-Adresse dafür einverstanden. Abmeldung jederzeit möglich.`;
}

export function themenLesen(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function themenBereinigen(eingabe: unknown, erlaubt?: string[]): string[] {
  const liste = Array.isArray(eingabe) ? eingabe : [];
  const sauber = [...new Set(liste.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 60)).filter(Boolean))].slice(0, 12);
  return erlaubt ? sauber.filter((t) => erlaubt.includes(t)) : sauber;
}

export const AUSGABE_STATUS = {
  ENTWURF: "Entwurf",
  PRUEFUNG: "In Prüfung",
  FREIGEGEBEN: "Freigegeben",
  GEPLANT: "Geplant",
  VERSENDET_DEMO: "Versendet (DEMO – keine E-Mail verschickt)",
  VERSENDET: "Versendet",
} as const;
export type AusgabeStatus = keyof typeof AUSGABE_STATUS;

/** Erlaubte Übergänge; Versand nur aus GEPLANT und nur, wenn der Text noch dem freigegebenen entspricht. */
export const AUSGABE_UEBERGAENGE: Record<string, AusgabeStatus[]> = {
  pruefen: ["ENTWURF"],
  freigeben: ["ENTWURF", "PRUEFUNG"],
  planen: ["FREIGEGEBEN", "GEPLANT"],
  zurueck: ["PRUEFUNG", "FREIGEGEBEN", "GEPLANT"],
  versenden: ["GEPLANT"],
};

export function darfUebergang(aktion: keyof typeof AUSGABE_UEBERGAENGE, status: string): boolean {
  return (AUSGABE_UEBERGAENGE[aktion] as string[]).includes(status);
}
