/**
 * Der Planer — Task Planner.
 *
 * Nimmt ein Ziel und macht daraus eine Folge von Schritten. Er fuehrt nichts
 * aus; er sagt nur, wer was in welcher Reihenfolge tun soll.
 *
 * ---- Zwei Betriebsarten, und warum in dieser Reihenfolge ----
 *
 * REGELBASIERT laeuft ohne Modellaufruf: Schluesselwoerter im Ziel zeigen auf
 * eine Absicht, und zu jeder Absicht steht eine Kette von Agenten. Das kostet
 * nichts, ist vorhersehbar und traegt auch ohne ANTHROPIC_API_KEY.
 *
 * MODELLGESTUETZT kommt spaeter. Ein Plan aus dem Modell wird durch DIESELBE
 * Pruefung geschickt wie ein von Hand geschriebener: `planPruefen`. Nennt er
 * einen Agenten, den es nicht gibt, wird der PLAN abgewiesen --- nicht der
 * Agent angelegt. Das ist die Stelle, an der solche Systeme anfangen zu
 * halluzinieren, und sie ist hier zu.
 *
 * Reine Rechnerei: kein Netz, kein Dateizugriff, kein Modellaufruf.
 */

import { AGENTEN, agentFinden, rechtFuerStufe } from "../agenten/register.js";

/** So viele Schritte hoechstens. Ein Plan, den niemand liest, ist keiner. */
export const HOECHSTENS_SCHRITTE = 8;

/**
 * Woher die Eingabe eines Schritts kommt.
 *  ZIEL      — der Wortlaut des Auftrags
 *  VORHER    — das Ergebnis des vorangegangenen Schritts
 *  OFFEN     — muss der Mensch liefern; der Ablauf haelt an
 */
export const QUELLE = { ZIEL: "ziel", VORHER: "vorher", OFFEN: "offen" };

const norm = (t) => String(t || "").toLowerCase()
  .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");

/**
 * Absichten. Die Reihenfolge zaehlt: die erste passende gewinnt, darum stehen
 * die engeren oben. "Kampagne" ist enger als "Text schreiben".
 *
 * Jede Kette ist eine Reihenfolge und keine Liste --- Schritt 2 arbeitet mit
 * dem, was Schritt 1 geliefert hat.
 */
const ABSICHTEN = [
  {
    id: "angebot",
    woran: /\b(angebot|offerte|kostenvoranschlag|anbieten)\b/,
    kette: ["anfrage-einschaetzen", "lastenheft-fragen", "angebot-entwurf"],
    warum: "Erst einschätzen, ob es passt, dann die offenen Fragen sammeln, dann schreiben.",
  },
  {
    id: "kampagne",
    woran: /\b(kampagne|bewerben|werbung|marketing|neukunden|mehr kunden|kunden gewinnen)\b/,
    kette: ["seo-keywords", "produkttext", "social-serie", "anzeigentext"],
    warum: "Erst die Begriffe, nach denen gesucht wird, dann der Text, dann die Verteilung.",
  },
  {
    id: "webseite",
    woran: /\b(webseite|website|homepage|internetseite|landingpage)\b/,
    kette: ["seitenstruktur", "texte-startseite", "seo-meta"],
    warum: "Struktur vor Text, Text vor Suchmaschinen-Angaben.",
  },
  {
    id: "automatisieren",
    woran: /\b(automatisier|prozess|ablauf|workflow|von hand|manuell)\w*/,
    kette: ["prozess-zerlegen", "automatisierbar-pruefen", "risiko-check", "einfuehrungsplan"],
    warum: "Zerlegen, rechnen, ob es sich lohnt, Fehlerfälle benennen, dann einführen.",
  },
  {
    id: "schulung",
    woran: /\b(schulung|schulen|team beibringen|weiterbildung|workshop)\b/,
    kette: ["schulungsplan", "uebung", "handout"],
    warum: "Ablauf, Übung, Merkblatt — in dieser Reihenfolge, sonst fehlt der Übung der Zweck.",
  },
  {
    id: "social",
    woran: /\b(social|instagram|tiktok|linkedin|facebook|beitrag|posting|posts?)\b/,
    kette: ["social-serie", "social-post"],
    warum: "Erst die Reihe planen, dann den einzelnen Beitrag schreiben.",
  },
  {
    id: "kundenantwort",
    woran: /\b(mail|e-mail|antwort|anschreiben|zurueckschreiben|antworten)\b/,
    kette: ["mail-antwort"],
    warum: "Ein Antwortentwurf genügt; mehr Schritte machen ihn nicht besser.",
  },
  {
    id: "text",
    woran: /\b(text|schreiben|artikel|blog|newsletter|formulieren)\b/,
    kette: ["blogartikel", "seo-meta"],
    warum: "Text schreiben, dann die Angaben für die Suchmaschine daraus ableiten.",
  },
  {
    id: "ordnung",
    woran: /\b(protokoll|notizen|aufgaben|checkliste|ablage|sortieren)\b/,
    kette: ["protokoll", "aufgabenliste"],
    warum: "Aus Notizen ein Protokoll, aus dem Protokoll die Aufgaben.",
  },
];

/** Wenn nichts passt: erst einschaetzen lassen, statt zu raten. */
const RUECKFALL = {
  id: "unklar",
  kette: ["anfrage-einschaetzen"],
  warum:
    "Das Ziel ließ sich keiner bekannten Absicht zuordnen. Statt zu raten, schätzt " +
    "ein Agent zuerst ein, worum es geht — daraus lässt sich ein zweiter Plan machen.",
};

/** Welche Absicht steckt im Ziel? */
export function absicht(ziel) {
  const t = norm(ziel);
  for (const a of ABSICHTEN) if (a.woran.test(t)) return a;
  return RUECKFALL;
}

export function absichten() {
  return [...ABSICHTEN, RUECKFALL].map((a) => ({ id: a.id, kette: a.kette.slice(), warum: a.warum }));
}

/**
 * Baut die Eingabe eines Schritts.
 *
 * Das erste Pflichtfeld bekommt den Wortlaut --- beim ersten Schritt das Ziel,
 * danach das Ergebnis des Schritts davor. Genau das ist die Kette: Schritt 2
 * arbeitet mit dem, was Schritt 1 geliefert hat.
 *
 * Weitere Pflichtfelder bleiben OFFEN. Sie zu erfinden waere das Gegenteil
 * dessen, was dieses Projekt tut.
 */
function eingabePlanen(agent, nr) {
  const pflicht = agent.felder.filter((f) => f.pflicht);
  const quelle = {};
  const offen = [];
  pflicht.forEach((f, i) => {
    if (i === 0) quelle[f.name] = nr === 1 ? QUELLE.ZIEL : QUELLE.VORHER;
    else { quelle[f.name] = QUELLE.OFFEN; offen.push(f.label); }
  });
  return { quelle, offen };
}

/**
 * Plant regelbasiert.
 * @returns {{ok: true, absicht: string, warum: string, schritte: object[]} | {ok: false, grund: string}}
 */
export function planen(ziel) {
  const z = String(ziel || "").trim();
  if (!z) return { ok: false, grund: "Ohne Ziel lässt sich nichts planen." };

  const a = absicht(z);
  const schritte = [];
  for (const id of a.kette.slice(0, HOECHSTENS_SCHRITTE)) {
    const agent = agentFinden(id);
    /* Eine Kette, die auf einen entfernten Agenten zeigt, ist ein Fehler in
       DIESER Datei --- nicht etwas, das man stillschweigend ueberspringt. */
    if (!agent) {
      return { ok: false, grund: `Die Absicht „${a.id}“ nennt den Agenten „${id}“, den es nicht gibt.` };
    }
    const nr = schritte.length + 1;
    const { quelle, offen } = eingabePlanen(agent, nr);
    schritte.push({
      nr, agent: agent.id, name: agent.name,
      stufe: agent.stufe,
      recht: rechtFuerStufe(agent.stufe),
      quelle, offen,
      warum: agent.zweck,
    });
  }
  return { ok: true, absicht: a.id, warum: a.warum, schritte };
}

/**
 * Prueft einen Plan. DIESELBE Pruefung fuer einen regelbasierten Plan und fuer
 * einen, den ein Modell vorgeschlagen hat.
 */
export function planPruefen(schritte) {
  if (!Array.isArray(schritte) || schritte.length === 0) {
    return { ok: false, grund: "Ein Plan ohne Schritte ist keiner." };
  }
  if (schritte.length > HOECHSTENS_SCHRITTE) {
    return { ok: false, grund: `Mehr als ${HOECHSTENS_SCHRITTE} Schritte — das liest niemand mehr.` };
  }
  const gesehen = new Set();
  for (let i = 0; i < schritte.length; i++) {
    const s = schritte[i];
    const id = typeof s?.agent === "string" ? s.agent : "";
    const agent = agentFinden(id);
    if (!agent) {
      return { ok: false, grund: `Schritt ${i + 1} nennt „${id || "nichts"}“ — diesen Agenten gibt es nicht.` };
    }
    if (gesehen.has(id)) {
      return { ok: false, grund: `Der Agent „${id}“ steht zweimal im Plan.` };
    }
    gesehen.add(id);
    if (Number.isInteger(s.stufe) && s.stufe !== agent.stufe) {
      return { ok: false, grund: `Schritt ${i + 1} gibt für „${id}“ eine andere Stufe an als die Registratur.` };
    }
  }
  return { ok: true, schritte };
}

/** Der Plan in der Form, die kern/auftrag.js erwartet. */
export function fuerAuftrag(schritte) {
  return schritte.map((s) => ({
    agent: s.agent, stufe: s.stufe, recht: s.recht,
    eingabe: { quelle: s.quelle, offen: s.offen, warum: s.warum },
  }));
}

/** Zum Anzeigen, ohne Innereien. */
export function oeffentlich(plan) {
  if (!plan?.ok) return plan;
  return {
    absicht: plan.absicht, warum: plan.warum,
    schritte: plan.schritte.map((s) => ({
      nr: s.nr, agent: s.agent, name: s.name, recht: s.recht,
      warum: s.warum, offen: s.offen,
    })),
  };
}
