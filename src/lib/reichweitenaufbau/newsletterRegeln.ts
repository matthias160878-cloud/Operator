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
  VERSAND_LAEUFT: "Versand läuft",
  VERSENDET_DEMO: "Versendet (DEMO – keine E-Mail verschickt)",
  VERSENDET: "Versendet",
} as const;
export type AusgabeStatus = keyof typeof AUSGABE_STATUS;

/**
 * Erlaubte Übergänge. Versand nur nach Freigabe, nur per Klick (es gibt keinen
 * automatischen Versand zum geplanten Zeitpunkt) und nur, wenn der Text noch
 * dem freigegebenen entspricht.
 */
export const AUSGABE_UEBERGAENGE: Record<string, AusgabeStatus[]> = {
  pruefen: ["ENTWURF"],
  freigeben: ["ENTWURF", "PRUEFUNG"],
  planen: ["FREIGEGEBEN", "GEPLANT"],
  zurueck: ["PRUEFUNG", "FREIGEGEBEN", "GEPLANT"],
  versenden: ["FREIGEGEBEN", "GEPLANT"],
};

export function darfUebergang(aktion: keyof typeof AUSGABE_UEBERGAENGE, status: string): boolean {
  return (AUSGABE_UEBERGAENGE[aktion] as string[]).includes(status);
}

export interface Anbieterangaben {
  name: string;
  anschrift: string;
  email: string;
  datenschutzUrl: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Fußzeile jeder Kunden-Newsletter-Mail: Grund des Erhalts, Abmeldelink, Anbieterangaben (§ 5 DDG). */
export function newsletterFusszeile(a: Anbieterangaben, abmeldeUrl: string, grund: string): { text: string; html: string } {
  const anschrift = a.anschrift.split(/\r?\n/).map((z) => z.trim()).filter(Boolean).join(", ");
  const text = `\n\n--\n${grund}\nAbmelden: ${abmeldeUrl}\n\nAnbieter: ${a.name}, ${anschrift}, ${a.email}\nDatenschutz: ${a.datenschutzUrl}`;
  const html =
    `<hr style="border:none;border-top:1px solid #ddd;margin:24px 0 12px">` +
    `<p style="font-size:12px;color:#666">${esc(grund)}<br><a href="${esc(abmeldeUrl)}">Newsletter abbestellen</a></p>` +
    `<p style="font-size:12px;color:#666">Anbieter: ${esc(a.name)}, ${esc(anschrift)}, <a href="mailto:${esc(a.email)}">${esc(a.email)}</a><br>` +
    `<a href="${esc(a.datenschutzUrl)}">Datenschutzerklärung</a></p>`;
  return { text, html };
}

/** Ausgabetext als einfaches HTML (Absätze, Zeilenumbrüche, keine eingebetteten Inhalte). */
export function textAlsHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((absatz) => `<p>${esc(absatz).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Header für die Ein-Klick-Abmeldung (RFC 8058), verlangt von Gmail und Yahoo für Massenversender. */
export function abmeldeHeader(abmeldeUrl: string): Record<string, string> {
  return { "List-Unsubscribe": `<${abmeldeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
}
