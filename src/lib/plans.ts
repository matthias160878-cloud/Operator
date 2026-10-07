/**
 * Zentrale Paketdefinition — die einzige Quelle für Verkaufsseite, Checkout,
 * Berechtigungen und Nutzungskontingente.
 *
 * WICHTIG — was hier verbindlich ist und was nicht:
 *  - Der tatsächliche Preis, die Währung und das Abrechnungsintervall kommen
 *    IMMER aus dem Stripe-Preisobjekt (STRIPE_PRICE_ID_PRO / _MAXI). Der Code
 *    erfindet kein Intervall: ein wiederkehrender Stripe-Preis führt zu einem
 *    Abo, ein einmaliger zu einer Einmalzahlung.
 *  - displayAmountCents sind nur Anzeige-Platzhalter für die Verkaufsseite,
 *    solange Stripe nicht konfiguriert ist. Sie stammen aus dem Gespräch
 *    (590 € / 797 € nach 15 % Rabatt) und sind NICHT bestätigt. Im Repository
 *    war bisher nur ein Einzelpaket zu 797 € einmalig hinterlegt.
 *  - Die Kontingente sind VORLÄUFIG. Pro übernimmt die Mengen der bisherigen
 *    Autopilot-Stufe S, Maxi die der Stufe M (src/lib/pricing.ts,
 *    docs/preisanalyse.html). Werte ohne Vorlage dort sind als solche markiert.
 *  - Solange PACKAGE_TERMS_CONFIRMED nicht "true" ist, verweigert der
 *    Checkout den Verkauf (siehe packageTermsConfirmed()).
 */

export type PlanKey = "PRO" | "MAXI";

export type Metric = "AI_TEXT" | "IDEAS" | "VOICEOVER" | "VIDEO" | "WIDGET_CHAT" | "BRANDS" | "WEBSITES";

export const METRIC_LABELS: Record<Metric, string> = {
  AI_TEXT: "KI-Textaufträge (Skripte, Hashtags, Antworten, Chat)",
  IDEAS: "Ideen-Generierungen",
  VOICEOVER: "Voiceovers",
  VIDEO: "Videos",
  WIDGET_CHAT: "Antworten des Webseiten-Assistenten",
  BRANDS: "Marken",
  WEBSITES: "Verbundene Webseiten",
};

/** Monatlich zurückgesetzte Kennzahlen; BRANDS/WEBSITES sind Bestandsgrenzen. */
export const MONTHLY_METRICS: Metric[] = ["AI_TEXT", "IDEAS", "VOICEOVER", "VIDEO", "WIDGET_CHAT"];

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  /** Nur Anzeige ohne Stripe — unbestätigt, siehe Kopfkommentar. */
  displayAmountCents: number;
  displayCurrency: "eur";
  priceEnvVar: string;
  quotas: Record<Metric, number>;
  /** Kennzahlen ohne Vorlage im Repository — ausdrücklich vom Betreiber festzulegen. */
  unsourcedQuotas: Metric[];
  features: string[];
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  PRO: {
    key: "PRO",
    name: "Pro",
    displayAmountCents: 59000,
    displayCurrency: "eur",
    priceEnvVar: "STRIPE_PRICE_ID_PRO",
    quotas: { BRANDS: 1, IDEAS: 30, VIDEO: 10, VOICEOVER: 10, AI_TEXT: 300, WIDGET_CHAT: 500, WEBSITES: 1 },
    unsourcedQuotas: ["AI_TEXT", "WIDGET_CHAT", "WEBSITES"],
    features: [
      "Eigener privater Arbeitsbereich",
      "KI-Funktionen über Betreiber-Zugänge — kein eigenes KI-Abo nötig",
      "Social Media AI, Marken-DNA, Schulung, Wachstum, Posteingang",
      "Webseiten-Assistent für 1 Webseite",
    ],
  },
  MAXI: {
    key: "MAXI",
    name: "Maxi",
    displayAmountCents: 79700,
    displayCurrency: "eur",
    priceEnvVar: "STRIPE_PRICE_ID_MAXI",
    quotas: { BRANDS: 3, IDEAS: 90, VIDEO: 30, VOICEOVER: 30, AI_TEXT: 900, WIDGET_CHAT: 1500, WEBSITES: 3 },
    unsourcedQuotas: ["AI_TEXT", "WIDGET_CHAT", "WEBSITES"],
    features: [
      "Alles aus Pro",
      "Dreifache Kontingente",
      "Bis zu 3 Marken",
      "Webseiten-Assistent für bis zu 3 Webseiten",
    ],
  },
};

export const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === "string" && value in PLANS;
}

/** Aus Sprache/URL ("pro", "Maxi") — gibt null für Unbekanntes. */
export function parsePlanKey(value: unknown): PlanKey | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  return isPlanKey(upper) ? upper : null;
}

export function stripePriceIdFor(plan: PlanKey): string | null {
  return process.env[PLANS[plan].priceEnvVar] || null;
}

export function planForStripePrice(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  for (const key of PLAN_KEYS) if (stripePriceIdFor(key) === priceId) return key;
  return null;
}

export function packageTermsConfirmed(): boolean {
  return process.env.PACKAGE_TERMS_CONFIRMED === "true";
}

/** Anzeigebetrag für Cent-Werte. */
export function formatCents(cents: number, currency: string, locale = "de-DE"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

/** Abrechnungszeitraum für monatliche Kontingente (UTC-Kalendermonat). */
export function currentPeriod(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
