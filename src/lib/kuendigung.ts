import { randomInt } from "node:crypto";
import { escapeHtml } from "@/lib/email";

/**
 * Kündigungsbutton (§ 312k BGB): reine Hilfsfunktionen (Referenz, Zeitpunkt,
 * Bestätigungstext). Datenbank, Versand und Posteingang: src/app/api/kuendigen.
 */

export const KUENDIGUNGS_ARTEN = { ORDENTLICH: "Ordentliche Kündigung", AUSSERORDENTLICH: "Außerordentliche Kündigung" } as const;
export type KuendigungsArt = keyof typeof KUENDIGUNGS_ARTEN;

export const VERTRAEGE = {
  PRO: "Social Media KI – Pro",
  MAXI: "Social Media KI – Maxi",
  SONSTIGES: "Sonstiger Vertrag (bitte beschreiben)",
} as const;
export type VertragsSchluessel = keyof typeof VERTRAEGE;

export const ZEITPUNKT_NAECHSTMOEGLICH = "naechstmoeglich";

/** Ohne leicht verwechselbare Zeichen (0/O, 1/I/L). */
const REFERENZ_ZEICHEN = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function neueReferenz(jetzt: Date = new Date()): string {
  let teil = "";
  for (let i = 0; i < 6; i++) teil += REFERENZ_ZEICHEN[randomInt(REFERENZ_ZEICHEN.length)];
  return `K-${heuteInDeutschland(jetzt).slice(0, 4)}-${teil}`;
}

export function istReferenz(s: string): boolean {
  return /^K-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/.test(s);
}

/** Heutiges Datum (JJJJ-MM-TT) in deutscher Zeit. */
export function heuteInDeutschland(jetzt: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(jetzt);
}

/**
 * Gewünschter Kündigungszeitpunkt: "naechstmoeglich" oder ein echtes
 * Kalenderdatum (JJJJ-MM-TT) ab heute bis höchstens 5 Jahre in der Zukunft.
 * Gibt den normierten Wert zurück oder null bei ungültiger Angabe.
 */
export function pruefeZeitpunkt(eingabe: string, heute: string = heuteInDeutschland()): string | null {
  const s = eingabe.trim();
  if (s === "" || s === ZEITPUNKT_NAECHSTMOEGLICH) return ZEITPUNKT_NAECHSTMOEGLICH;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [j, mo, t] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(j, mo - 1, t));
  if (d.getUTCFullYear() !== j || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== t) return null;
  if (s < heute) return null;
  const grenze = `${Number(heute.slice(0, 4)) + 5}${heute.slice(4)}`;
  if (s > grenze) return null;
  return s;
}

export function zeitpunktText(zeitpunkt: string): string {
  if (zeitpunkt === ZEITPUNKT_NAECHSTMOEGLICH) return "zum nächstmöglichen Zeitpunkt";
  const [j, m, t] = zeitpunkt.split("-");
  return `zum ${t}.${m}.${j}`;
}

export function eingangText(d: Date): string {
  return new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "long", timeStyle: "medium" }).format(d) + " Uhr (deutsche Zeit)";
}

export interface KuendigungsAngaben {
  referenz: string;
  art: KuendigungsArt;
  grund: string;
  name: string;
  email: string;
  kundennummer: string;
  vertrag: string;
  zeitpunkt: string;
  bestaetigungEmail: string;
  eingangAm: Date;
}

/** Zeilen der Bestätigung — dieselben auf dem Bildschirm und in der E-Mail. */
export function bestaetigungsZeilen(k: KuendigungsAngaben): [string, string][] {
  const zeilen: [string, string][] = [
    ["Referenznummer", k.referenz],
    ["Eingang", eingangText(k.eingangAm)],
    ["Art der Kündigung", KUENDIGUNGS_ARTEN[k.art]],
  ];
  if (k.art === "AUSSERORDENTLICH") zeilen.push(["Kündigungsgrund", k.grund || "(nicht angegeben)"]);
  zeilen.push(
    ["Name", k.name],
    ["E-Mail-Adresse des Kontos", k.email],
    ["Arbeitsbereich / Kundennummer", k.kundennummer || "(nicht angegeben)"],
    ["Vertrag", k.vertrag],
    ["Gewünschter Beendigungszeitpunkt", zeitpunktText(k.zeitpunkt)],
    ["Bestätigung an", k.bestaetigungEmail],
  );
  return zeilen;
}

export const BESTAETIGUNG_BETREFF = "Eingangsbestätigung Ihrer Kündigung – SECRET 58";

/** Eingangsbestätigung in Textform (neutral — verrät nicht, ob ein Konto existiert). */
export function bestaetigungsMail(k: KuendigungsAngaben): { subject: string; text: string; html: string } {
  const zeilen = bestaetigungsZeilen(k);
  const einleitung =
    "Ihre Kündigung ist bei uns eingegangen. Diese E-Mail bestätigt den Eingang Ihrer Kündigungserklärung mit folgendem Inhalt:";
  const schluss =
    "Wir bearbeiten Ihre Kündigung und teilen Ihnen das Vertragsende mit. Bitte bewahren Sie diese E-Mail und die Referenznummer auf. " +
    "Haben Sie diese Kündigung nicht abgegeben, antworten Sie bitte auf diese E-Mail.";
  const text = [
    "Guten Tag,",
    "",
    einleitung,
    "",
    ...zeilen.map(([a, b]) => `${a}: ${b}`),
    "",
    schluss,
    "",
    "SECRET 58",
  ].join("\n");
  const html =
    `<p>Guten Tag,</p><p>${escapeHtml(einleitung)}</p>` +
    `<table cellpadding="4" style="border-collapse:collapse">${zeilen
      .map(([a, b]) => `<tr><td style="vertical-align:top;color:#555">${escapeHtml(a)}</td><td><strong>${escapeHtml(b)}</strong></td></tr>`)
      .join("")}</table>` +
    `<p>${escapeHtml(schluss)}</p><p>SECRET 58</p>`;
  return { subject: BESTAETIGUNG_BETREFF, text, html };
}
