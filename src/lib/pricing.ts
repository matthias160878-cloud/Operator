import type { Locale } from "@/i18n/config";

/**
 * Preis-Hilfsfunktionen und der (weiterhin nicht buchbare) Autopilot-
 * Vorschau-Teil. Die eigentliche Paketdefinition (Pro/Maxi, Preise,
 * Kontingente) liegt zentral in `src/lib/packages.ts` — hier nur noch
 * Dinge, die nicht paketspezifisch sind.
 */

/**
 * Optionaler Einrichtungsservice (einmalig): Der Betreiber richtet für die
 * Kundin/den Kunden API-Schlüssel, Brand DNA und erste Posts ein. Wird im
 * Checkout nur angeboten, wenn STRIPE_SETUP_PRICE_ID gesetzt ist.
 */
export const SETUP_SERVICE_PRICE_EUR = 299;

export function formatSetupServicePrice(locale: Locale): string {
  return formatEur(locale, SETUP_SERVICE_PRICE_EUR);
}

/**
 * Geplanter Autopilot (Monatsabo, alle Anbieterkosten inklusive) — nur als
 * Vorschau auf /buy, noch nicht buchbar. Staffelung ausschließlich nach
 * Menge, nie nach Funktionen. Kalkulation: docs/preisanalyse.html.
 */
export interface AutopilotTier {
  key: "s" | "m" | "l";
  priceEur: number;
  brands: number;
  ideas: number;
  videos: number;
  voiceMinutes: number;
}

export const AUTOPILOT_TIERS: AutopilotTier[] = [
  { key: "s", priceEur: 149, brands: 1, ideas: 30, videos: 10, voiceMinutes: 10 },
  { key: "m", priceEur: 399, brands: 3, ideas: 90, videos: 30, voiceMinutes: 30 },
  { key: "l", priceEur: 999, brands: 10, ideas: 250, videos: 80, voiceMinutes: 90 },
];

export function formatEur(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
