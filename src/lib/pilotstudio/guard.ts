/**
 * Pilotstudio: Einordnung eingehender Anfragen und Prüfregeln für Antwortentwürfe.
 * Eingehende Nachrichten sind nicht vertrauenswürdig — sie werden hier nur gelesen,
 * nie als Anweisung ausgeführt.
 */

const RULES: { category: string; human: boolean; re: RegExp; note?: string }[] = [
  {
    category: "manipulationsversuch",
    human: true,
    re: /ignorier\w*\s+(alle|sämtliche|deine|die)?\s*(regeln|anweisungen|vorgaben)|ignore (all|previous) (rules|instructions)|system\s?prompt|sende\w*\s+(mir\s+)?(alle\s+)?kundendaten|(e-?mail-?adressen|daten) aller kunden/i,
    note: "Nachricht enthält Anweisungen an das System. Sie werden nicht ausgeführt.",
  },
  { category: "zahlung", human: true, re: /abbuch|abgebucht|zurückbuch|rückbuch|doppelt (bezahlt|berechnet)|zahlung|rechnung falsch|kreditkarte/i, note: "Zahlungsfrage: nur eine zuständige Person prüft." },
  { category: "datenschutz", human: true, re: /lösch|dsgvo|datenauskunft|auskunft über (meine|die) daten|personenbezogen/i, note: "Datenschutzanfrage: Übergabe an zuständige Person." },
  { category: "kuendigung", human: true, re: /kündig/i, note: "Vertragsfrage: Kündigungstermin erst nach Vertragsprüfung." },
  { category: "reklamation", human: true, re: /beschädigt|kaputt|defekt|riss|geld zurück|erstattung|reklamation/i, note: "Keine Erstattung ohne Prüfung zusagen." },
  { category: "zugang", human: false, re: /login|einloggen|anmeld|passwort|konto gesperrt|zugang/i },
  { category: "termin", human: false, re: /termin|treffen|uhr\b|besprechung|vorbeikommen/i },
  { category: "verfuegbarkeit", human: false, re: /schweiz|österreich|ausland|verfügbar|liefern sie (auch )?nach|auch für firmen in/i },
  { category: "angebot", human: false, re: /angebot|preis|kosten|kostet|website|webseite/i },
];

export const CATEGORIES = [
  "angebot",
  "termin",
  "zugang",
  "reklamation",
  "zahlung",
  "unklar",
  "datenschutz",
  "manipulationsversuch",
  "verfuegbarkeit",
  "kuendigung",
  "sonstiges",
] as const;

export function classify(subject: string, body: string): { category: string; needsHuman: boolean; riskNote: string } {
  const text = `${subject}\n${body}`;
  for (const r of RULES) {
    if (r.re.test(text)) return { category: r.category, needsHuman: r.human, riskNote: r.note ?? "" };
  }
  return { category: "unklar", needsHuman: false, riskNote: "" };
}

const FLAGS: [string, RegExp][] = [
  ["Preisangabe – Preise nur aus freigegebener Preisliste", /\d[\d.,]*\s?(€|eur\b|euro|chf|franken)|(€|chf)\s?\d/i],
  ["Passwort wird angefordert", /(ihr|dein|euer)\s+(aktuelles\s+)?passwort\s+(bitte\s+)?(an|zu|mit)?\s*(senden|schicken|mitteilen|nennen|angeben)|(senden|schicken|nennen) sie (uns )?(bitte )?ihr passwort/i],
  ["Termin wird ohne Kalenderprüfung bestätigt", /(termin|treffen)[^.?!]{0,60}\b(ist|wurde|haben wir)\s+(fest\s+)?(bestätigt|gebucht|reserviert|eingetragen)|bestätigen (wir )?ihnen (gern )?den termin/i],
  ["Erstattung wird zugesagt", /(wir erstatten|erstatten wir|wird (ihnen )?erstattet|erhalten sie (ihr geld|eine erstattung|eine gutschrift)|überweisen (wir )?ihnen)/i],
  ["Zahlung oder Rückbuchung wird ausgelöst/zugesagt", /(haben|wurde|wird)[^.?!]{0,30}(zurückgebucht|storniert|rückerstattet)/i],
  ["Löschung wird als erledigt behauptet", /(daten|konto)[^.?!]{0,40}\b(wurden|wurde|ist|sind)\s+(bereits\s+|vollständig\s+)?(gelöscht|entfernt)/i],
  ["Kündigungstermin ohne Vertragsprüfung", /(kündigung|vertrag)[^.?!]{0,60}(zum|endet am|wirksam (zum|am))\s+\d{1,2}\./i],
  ["Verfügbarkeit wird ohne Prüfung zugesagt", /\b(ja|selbstverständlich|natürlich),?\s+(wir|das)\s+(liefern|bieten|ist|sind)\b|\bgarantier/i],
  ["Enthält E-Mail-Adresse (mögliche Datenweitergabe)", /[\w.+-]+@[\w-]+\.[\w.-]+/],
  ["Enthält Telefonnummer (mögliche Datenweitergabe)", /(\+\d{2}|\b0\d{2,4})[\s/-]?\d{3,}[\s-]?\d{2,}/],
];

/** Auffälligkeiten im Antwortentwurf. Leere Liste = keine Prüfregel verletzt. */
export function guardFlags(text: string): string[] {
  return FLAGS.filter(([, re]) => re.test(text)).map(([name]) => name);
}
