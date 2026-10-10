/**
 * Die Rechte — Permission System.
 *
 * Diese Schicht liegt UEBER agenten/gate.js, nicht an seiner Stelle. Die
 * beiden fragen Verschiedenes:
 *
 *   gate.js     Worum geht es?      Banking, Behoerden, Anwalt --- gesperrt,
 *                                   egal welches Recht jemand haette.
 *   rechte.js   Was wird getan?     Lesen, schreiben, veroeffentlichen,
 *                                   loeschen --- braucht das eine Freigabe?
 *
 * Ein Schritt laeuft nur, wenn BEIDE zustimmen. Das ist keine Dopplung: Das
 * Gate greift vor dem Modellaufruf und kennt keine Freigabe, die es aushebelt.
 * Die Rechteschicht kennt Freigaben --- und genau deshalb darf sie nicht die
 * einzige Instanz sein.
 *
 * Reine Rechnerei: kein Netz, kein Dateizugriff, kein Modellaufruf.
 */

import { STUFE, pruefe as gatePruefe } from "../agenten/gate.js";

/** Die sieben Rechte. */
export const RECHT = {
  LESEN: "LESEN",
  SCHREIBEN: "SCHREIBEN",
  AUSFUEHREN: "AUSFUEHREN",
  VEROEFFENTLICHEN: "VEROEFFENTLICHEN",
  LOESCHEN: "LOESCHEN",
  FREMDE_API: "FREMDE_API",
  GELD: "GELD",
};

/**
 * Was jedes Recht bedeutet.
 *
 * `nie: true` heisst: wird nicht ausgefuehrt. Auch nicht mit Freigabe, auch
 * nicht vom Eigentuemer, auch nicht in einer hoeheren Stufe. Es gibt genau
 * einen solchen Eintrag, und das ist Absicht --- siehe unten.
 */
export const VORGABE = {
  LESEN:            { stufe: STUFE.LESEN,        freigabe: false, nie: false,
                      zweck: "Etwas ansehen. Ändert nichts." },
  SCHREIBEN:        { stufe: STUFE.INTERN,       freigabe: false, nie: false,
                      zweck: "Etwas anlegen oder ändern. Wirkt nur im eigenen Haus." },
  AUSFUEHREN:       { stufe: STUFE.INTERN,       freigabe: false, nie: false,
                      zweck: "Einen Agenten laufen lassen. Erzeugt einen Entwurf." },
  VEROEFFENTLICHEN: { stufe: STUFE.AUSSEN,       freigabe: true,  nie: false,
                      zweck: "Etwas nach außen geben — Beitrag, Mail, Zusage." },
  LOESCHEN:         { stufe: STUFE.AUSSEN,       freigabe: true,  nie: false,
                      zweck: "Etwas endgültig entfernen." },
  FREMDE_API:       { stufe: STUFE.AUSSEN,       freigabe: true,  nie: false,
                      zweck: "Einen fremden Dienst aufrufen, der etwas bewirkt." },
  GELD:             { stufe: STUFE.AUSSEN,       freigabe: true,  nie: true,
                      zweck: "Eine Zahlung auslösen. Wird nicht ausgeführt." },
};

/**
 * ---- Warum GELD nie laeuft ----
 *
 * Der Auftrag nennt fuer FINANCIAL "immer Benutzerfreigabe" und sagt an
 * anderer Stelle "Zahlungsaktionen niemals automatisieren". Beides zusammen
 * geht nicht: Eine Freigabe ist ein Knopf, und ein Knopf wird irgendwann
 * versehentlich gedrueckt.
 *
 * Hier gilt darum die strengere Lesart. Das System loest keine Zahlung aus.
 * Die Kartenzahlung dieses Projekts widerspricht dem nicht --- dort erzeugt
 * der Server eine Bezahladresse, und der Mensch bezahlt beim Dienstleister.
 * Was hier ausgeschlossen ist, ist der Agent, der selbst ueberweist.
 */

export const ALLE = Object.keys(VORGABE);

export function bekannt(recht) {
  return typeof recht === "string" && Object.hasOwn(VORGABE, recht);
}

export function stufeVon(recht) {
  return bekannt(recht) ? VORGABE[recht].stufe : STUFE.AUSSEN;
}

export function brauchtFreigabe(recht) {
  return bekannt(recht) ? VORGABE[recht].freigabe : true;
}

/**
 * Prueft einen Schritt. Gate zuerst --- was thematisch gesperrt ist, wird
 * abgewiesen, bevor irgendeine Freigabe gefragt wird.
 *
 * @param {{recht: string, nachricht: string, freigabe?: boolean}} schritt
 * @returns {{entscheidung: "ausfuehren"|"freigabe"|"abgelehnt", grund: string, recht: string, stufe: number}}
 */
export function pruefe(schritt) {
  const recht = schritt?.recht;
  const nachricht = typeof schritt?.nachricht === "string" ? schritt.nachricht : "";

  if (!bekannt(recht)) {
    return {
      entscheidung: "abgelehnt", recht: String(recht), stufe: STUFE.AUSSEN,
      grund: `Unbekanntes Recht: ${String(recht)}. Unbekanntes bekommt das Strengste.`,
    };
  }
  const v = VORGABE[recht];

  /* 1. Das Gate. Es kennt keine Freigabe, die es aushebelt. */
  const gate = gatePruefe({ stufe: v.stufe, nachricht, freigabe: schritt?.freigabe === true });
  if (gate.entscheidung === "abgelehnt") {
    return { entscheidung: "abgelehnt", grund: gate.grund, recht, stufe: v.stufe };
  }

  /* 2. Das eine Recht, das auch mit Freigabe nicht laeuft. */
  if (v.nie) {
    return {
      entscheidung: "abgelehnt", recht, stufe: v.stufe,
      grund:
        "Zahlungen löst kein Agent aus — auch nicht mit Freigabe. " +
        "Das gehört an einen Menschen: info@secret58.com.",
    };
  }

  /* 3. Braucht es eine Freigabe, und liegt sie vor? */
  if (v.freigabe && schritt?.freigabe !== true) {
    return {
      entscheidung: "freigabe", recht, stufe: v.stufe,
      grund: `${v.zweck} Das braucht Ihre Freigabe.`,
    };
  }

  /* 4. Das Gate kann trotzdem noch eine Freigabe verlangen. */
  if (gate.entscheidung === "freigabe") {
    return { entscheidung: "freigabe", grund: gate.grund, recht, stufe: v.stufe };
  }

  return { entscheidung: "ausfuehren", grund: v.zweck, recht, stufe: v.stufe };
}

/** Die Rechte nach aussen — fuer die Oberflaeche, ohne Innereien. */
export function oeffentlich() {
  return ALLE.map((r) => ({
    recht: r,
    zweck: VORGABE[r].zweck,
    stufe: VORGABE[r].stufe,
    braucht_freigabe: VORGABE[r].freigabe,
    wird_nie_ausgefuehrt: VORGABE[r].nie,
  }));
}
