/** Eingabeprüfung für Kampagnen- und Linkfelder. */

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const TELEFON = /(\+|00)?\d[\d\s/().-]{6,}\d/;

/** Interne Bezeichnungen dürfen keine E-Mail-Adressen oder Telefonnummern enthalten (Datensparsamkeit). */
export function enthaeltPersonendaten(text: string): boolean {
  return EMAIL.test(text) || TELEFON.test(text);
}

export function kuerzen(text: unknown, max: number): string {
  return typeof text === "string" ? text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max) : "";
}

/**
 * Zielseite eines Empfehlungslinks: nur http/https, keine Zugangsdaten in
 * der Adresse. Leere Eingabe ist erlaubt (dann gibt es keinen Weiter-Knopf).
 */
export function pruefeZielUrl(raw: unknown): { ok: true; url: string } | { ok: false; fehler: string } {
  const text = kuerzen(raw, 500);
  if (!text) return { ok: true, url: "" };
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, fehler: "Zielseite ist keine gültige Adresse." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, fehler: "Zielseite muss mit http:// oder https:// beginnen." };
  if (url.username || url.password) return { ok: false, fehler: "Zielseite darf keine Zugangsdaten enthalten." };
  if (enthaeltPersonendaten(decodeURIComponent(url.search))) return { ok: false, fehler: "Zielseite darf keine E-Mail-Adressen oder Telefonnummern enthalten." };
  return { ok: true, url: url.toString() };
}
