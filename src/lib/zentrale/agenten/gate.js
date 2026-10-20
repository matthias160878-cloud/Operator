/**
 * Das Gate — was ein Agent darf und was nicht.
 *
 * Die Regeln stehen hier als Code und nicht als Satz im Systemprompt, damit
 * sie nicht davon abhängen, ob das Modell sie befolgt. Der Systemprompt sagt
 * dem Agenten, wie er antworten soll; das Gate entscheidet, ob er überhaupt
 * gefragt wird.
 */

/** Freigabestufen. Im Zweifel die niedrigere. */
export const STUFE = {
  LESEN: 0,        // liest nur
  VORSCHLAGEN: 1,  // schlägt vor, führt nicht aus
  INTERN: 2,       // führt aus, wirkt nur intern
  AUSSEN: 3,       // wirkt nach außen — Mail, Veröffentlichung, Bestellung, Zahlung
};

/**
 * Themen, die in keiner Stufe automatisch bearbeitet werden — auch nicht mit
 * Freigabe. Die Prüfung läuft vor dem Modellaufruf, die Nachricht erreicht
 * den Agenten also gar nicht erst.
 */
const GESPERRT = [
  /\bonline.?banking\b/i, /\bbank(konto|zugang|ing)\b/i, /\biban\b/i,
  /\büberweis(en|ung)/i, /\bkontostand\b/i, /\btan\b/i,
  /\bfinanzamt\b/i, /\belster\b/i, /\bsteuererkl/i, /\bbehörde/i,
  /\bkreditkarte/i, /\bpaypal\b/i, /\bzahlung auslösen/i,
];

/** Was ein Mensch beantworten muss, nicht der Agent. */
const AN_MENSCHEN = /\b(anwalt|klage|kündigung|beschwerde|schadenersatz|dsgvo-auskunft|vertrag anfechten)\b/i;

/** Woran ein Terminwunsch zu erkennen ist. */
const NACH_TERMIN = /\b(termin|erstgespräch|treffen|anruf vereinbar|kalender|uhrzeit|buchen|buchung|absagen|verschieben|wann (hätten|haben) sie)\b/i;

/**
 * Stuft eine Aktion ein. Was hinausgeht, ist Stufe 3 — ohne Ausnahme.
 * @param {"antworten"|"termin_vorschlagen"|"termin_buchen"|"mail_senden"} aktion
 */
export function stufeVon(aktion) {
  switch (aktion) {
    case "antworten": return STUFE.INTERN;
    case "termin_vorschlagen": return STUFE.VORSCHLAGEN;
    case "termin_buchen": return STUFE.AUSSEN;
    case "mail_senden": return STUFE.AUSSEN;
    default: return STUFE.AUSSEN; // Unbekanntes bekommt das Strengste.
  }
}

/**
 * Prüft einen Auftrag, bevor er ausgeführt wird.
 * @param {{stufe: number, nachricht: string, freigabe?: boolean}} auftrag
 * @returns {{entscheidung: "ausfuehren"|"freigabe"|"abgelehnt", grund: string}}
 */
export function pruefe(auftrag) {
  if (!auftrag || typeof auftrag.nachricht !== "string") {
    return { entscheidung: "abgelehnt", grund: "Auftrag ohne Nachricht." };
  }

  if (GESPERRT.some((r) => r.test(auftrag.nachricht))) {
    return {
      entscheidung: "abgelehnt",
      grund:
        "Banking-, Behörden- und Zahlungsvorgänge übernimmt kein Agent — in keiner Stufe. " +
        "Schreiben Sie uns dazu bitte direkt an info@secret58.com.",
    };
  }

  if (!Number.isInteger(auftrag.stufe) || auftrag.stufe < 0 || auftrag.stufe > 3) {
    return { entscheidung: "abgelehnt", grund: `Unbekannte Stufe: ${auftrag.stufe}.` };
  }

  if (auftrag.stufe === STUFE.AUSSEN && auftrag.freigabe !== true) {
    return { entscheidung: "freigabe", grund: "Wirkt nach außen und braucht eine Freigabe." };
  }

  return { entscheidung: "ausfuehren", grund: "Innerhalb der erlaubten Stufe." };
}

/**
 * Wer ist zuständig? Regelbasiert und ohne Modellaufruf — das kostet nichts
 * und trägt auch dann, wenn die API gerade nicht erreichbar ist.
 *
 * @param {string} nachricht
 * @returns {"gesperrt"|"mensch"|"terminplaner"|"chat"}
 */
export function zustaendig(nachricht) {
  if (typeof nachricht !== "string") return "chat";
  if (GESPERRT.some((r) => r.test(nachricht))) return "gesperrt";
  if (AN_MENSCHEN.test(nachricht)) return "mensch";
  if (NACH_TERMIN.test(nachricht)) return "terminplaner";
  return "chat";
}
