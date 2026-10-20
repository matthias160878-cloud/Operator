import { aktivesModell, type KiAnbieter } from "@/lib/ai/modelle";

/**
 * Kostenschätzung für KI-Aufrufe mit dem eigenen Schlüssel des Kunden.
 * Preise in US-Dollar je 1 Mio. Token (Eingabe, Ausgabe) laut Anbieter,
 * Stand 10/2026. Nur für bekannte Modelle; sonst „nicht berechenbar“.
 * Eigene Preise: KI_PREIS_ANTHROPIC / KI_PREIS_OPENAI / KI_PREIS_GEMINI = "ein,aus".
 * Die Abrechnung erfolgt immer beim Anbieter – dies ist eine Schätzung.
 */
const PREISE: Record<string, [number, number]> = {
  "claude-haiku-4-5": [1, 5],
  "claude-haiku-4-5-20251001": [1, 5],
  "claude-haiku-5-5": [0.1, 0.5],
  "claude-sonnet-4-6": [3, 15],
  "claude-sonnet-5": [2, 10],
  "claude-sonnet-5-5": [2, 10],
  "claude-opus-5": [5, 25],
  "claude-opus-5-5": [4, 20],
};

/** Grobe Umrechnung Zeichen → Token für deutschen Text (eher zu hoch geschätzt). */
export const ZEICHEN_JE_TOKEN = 3;

export interface KostenSchaetzung {
  anbieter: KiAnbieter;
  modell: string;
  berechenbar: boolean;
  eingabeToken: number;
  ausgabeTokenMax: number;
  /** Höchstbetrag in US-Dollar (volle Ausgabelänge); null = nicht berechenbar */
  usdMax: number | null;
  hinweis: string;
}

export function preisFuer(anbieter: KiAnbieter, modell = aktivesModell(anbieter)): [number, number] | null {
  const eigen = process.env[`KI_PREIS_${anbieter.toUpperCase()}`]?.split(",").map((x) => Number(x.trim()));
  if (eigen && eigen.length === 2 && eigen.every((x) => Number.isFinite(x) && x >= 0)) return [eigen[0], eigen[1]];
  return PREISE[modell] ?? null;
}

export function kostenSchaetzen(anbieter: KiAnbieter, eingabeZeichen: number, ausgabeTokenMax: number): KostenSchaetzung {
  const modell = aktivesModell(anbieter);
  const preis = preisFuer(anbieter, modell);
  const eingabeToken = Math.ceil(eingabeZeichen / ZEICHEN_JE_TOKEN);
  if (!preis) {
    return {
      anbieter, modell, berechenbar: false, eingabeToken, ausgabeTokenMax, usdMax: null,
      hinweis: `Für das Modell „${modell}“ ist kein Preis hinterlegt – Kosten nicht berechenbar. Bitte die Preisliste des Anbieters prüfen.`,
    };
  }
  const usdMax = (eingabeToken * preis[0] + ausgabeTokenMax * preis[1]) / 1_000_000;
  return {
    anbieter, modell, berechenbar: true, eingabeToken, ausgabeTokenMax, usdMax,
    hinweis: `Schätzung höchstens ${usdBetrag(usdMax)} (${eingabeToken} Eingabe-Token, bis ${ausgabeTokenMax} Ausgabe-Token, ${preis[0]} $ / ${preis[1]} $ je 1 Mio. Token). Abgerechnet wird beim Anbieter über Ihren Schlüssel.`,
  };
}

export function usdBetrag(usd: number): string {
  return usd < 0.01 ? `< 0,01 $` : `${usd.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} $`;
}
