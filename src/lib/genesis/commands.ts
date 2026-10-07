/**
 * Genesis-Befehlserkennung — reine Funktion, ohne Browser-APIs, damit sie
 * testbar ist. Genesis darf nur navigieren und ein Paket VORWÄHLEN. Kauf,
 * Zahlungsfreigabe und andere sensible Aktionen führt Genesis nie aus; der
 * angemeldete Kunde bestätigt sie selbst per Klick.
 */
export type GenesisAction =
  | { type: "navigate"; href: string; label: string }
  | { type: "selectPlan"; plan: "PRO" | "MAXI"; href: string; label: string }
  | { type: "refuse"; message: string }
  | { type: "unknown"; message: string };

const TARGETS: { href: string; label: string; words: string[] }[] = [
  { href: "/social-media", label: "Social Media AI", words: ["social media ai", "social media ki", "social media", "soziale medien"] },
  { href: "/", label: "Zentrale", words: ["zentrale", "dashboard", "startseite", "übersicht", "uebersicht", "home"] },
  { href: "/schulung", label: "Schulung", words: ["schulung", "training", "tutorial"] },
  { href: "/brand-dna", label: "Marken-DNA", words: ["marken dna", "markendna", "marken-dna", "brand dna", "marke"] },
  { href: "/growth", label: "Wachstum", words: ["wachstum", "growth"] },
  { href: "/inbox", label: "Posteingang", words: ["posteingang", "inbox", "nachrichten"] },
  { href: "/billing", label: "Paket & Abrechnung", words: ["abrechnung", "paket", "pakete", "billing", "abo"] },
  { href: "/sales", label: "Einnahmen & Verkauf", words: ["einnahmen", "verkauf", "shop", "umsatz"] },
  { href: "/website", label: "Meine Webseite", words: ["webseite", "website", "widget"] },
  { href: "/ideas", label: "Ideen", words: ["ideen", "ideas"] },
  { href: "/calendar", label: "Kalender", words: ["kalender", "calendar"] },
  { href: "/content-factory", label: "Content Factory", words: ["content factory", "inhalte"] },
];

const OPEN_VERBS = ["öffne", "oeffne", "offne", "zeige", "zeig", "geh zu", "gehe zu", "wechsle zu", "navigiere zu", "open", "go to", "show"];
const SELECT_VERBS = ["wähle", "waehle", "wahle", "nimm", "auswählen", "select", "choose"];
const SENSITIVE = ["kauf", "kaufe", "bezahl", "zahl", "bestätig", "bestaetig", "bestell", "buy", "pay", "checkout", "lösch", "loesch", "kündig", "kuendig"];

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[„“"'.!?,:;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function interpretCommand(raw: string): GenesisAction {
  const text = normalize(raw);
  if (!text) return { type: "unknown", message: "Ich habe nichts verstanden." };

  const startsWith = (verbs: string[]) => verbs.find((v) => text === v || text.startsWith(`${v} `));

  const selectVerb = startsWith(SELECT_VERBS);
  if (selectVerb) {
    const rest = text.slice(selectVerb.length).trim();
    const plan = /\bmaxi\b/.test(rest) ? "MAXI" : /\bpro\b/.test(rest) ? "PRO" : null;
    if (plan) {
      return {
        type: "selectPlan",
        plan,
        href: `/billing?plan=${plan.toLowerCase()}`,
        label: `${plan === "PRO" ? "Pro" : "Maxi"} ist vorgewählt. Den Kauf bestätigst du selbst.`,
      };
    }
  }

  // Sensible Aktionen nie per Sprache auslösen.
  if (SENSITIVE.some((w) => text.split(" ").some((t) => t.startsWith(w)))) {
    return {
      type: "refuse",
      message: "Kauf, Zahlung, Kündigung und Löschen führe ich nicht aus. Bitte bestätige das selbst auf der jeweiligen Seite.",
    };
  }

  const openVerb = startsWith(OPEN_VERBS);
  const target = openVerb ? text.slice(openVerb.length).trim() : text;
  // Längste passende Bezeichnung gewinnt ("social media ai" vor "social media").
  let best: { href: string; label: string; len: number } | null = null;
  for (const t of TARGETS) {
    for (const w of t.words) {
      if ((target === w || target.startsWith(`${w} `) || target.endsWith(` ${w}`) || target.includes(` ${w} `)) && (!best || w.length > best.len)) {
        best = { href: t.href, label: t.label, len: w.length };
      }
    }
  }
  if (best && (openVerb || target.split(" ").length <= 3)) {
    return { type: "navigate", href: best.href, label: `Öffne ${best.label}.` };
  }
  return { type: "unknown", message: "Diesen Befehl kenne ich nicht. Beispiele: „Öffne Schulung“, „Wähle Maxi“." };
}

export const GENESIS_EXAMPLES = [
  "Öffne Social Media AI",
  "Wähle Pro",
  "Wähle Maxi",
  "Öffne Schulung",
  "Öffne Marken-DNA",
  "Öffne Wachstum",
  "Öffne Posteingang",
];
