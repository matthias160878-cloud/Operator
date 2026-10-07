/**
 * Zentrale Paketdefinition — die einzige Quelle für Verkaufsseite, Checkout,
 * Berechtigungen und Nutzungskontingente.
 *
 * WICHTIG — was hier verbindlich ist und was nicht:
 *  - Der tatsächliche Preis, die Währung und das Abrechnungsintervall kommen
 *    IMMER aus dem Stripe-Preisobjekt (STRIPE_PRICE_ID_PRO / _MAXI). Der Code
 *    erfindet kein Intervall: ein wiederkehrender Stripe-Preis führt zu einem
 *    Abo, ein einmaliger zu einer Einmalzahlung.
 *  - netAmountCents: vom Betreiber bestätigte NETTO-Preise (7. Oktober 2026):
 *    Pro 590 €, Maxi 797 € — bereits nach 15 % Rabatt. Die Umsatzsteuer kommt
 *    je nach Land des Kunden hinzu (Stripe Tax, automatische Berechnung).
 *    Der Stripe-Preis muss genau diesen Nettobetrag mit tax_behavior
 *    "exclusive" haben, sonst verweigert der Checkout (src/lib/stripe.ts).
 *  - Ein durchgestrichener "Statt"-Preis wird bewusst NICHT angezeigt: Nach
 *    § 11 PAngV darf als Vergleich nur der niedrigste tatsächlich verlangte
 *    Preis der letzten 30 Tage dienen — ein solcher Preis existiert noch nicht.
 *  - Abrechnung: monatliches Abo (bestätigt am 7. Oktober 2026). Der Checkout
 *    verweigert Stripe-Preise, die nicht monatlich wiederkehren.
 *  - Kontingente je Monat (bestätigt am 7. Oktober 2026): Pro = bisherige
 *    Autopilot-Stufe S plus 300 KI-Texte, 500 Widget-Antworten, 1 Webseite;
 *    Maxi = dreifache Mengen.
 *  - PACKAGE_TERMS_CONFIRMED ist der Freigabeschalter des Betreibers für den
 *    Verkaufsstart (erst setzen, wenn Stripe, AGB und Pflichtangaben stehen).
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
  /** Bestätigter Nettopreis in Cent (ohne Umsatzsteuer), siehe Kopfkommentar. */
  netAmountCents: number;
  displayCurrency: "eur";
  priceEnvVar: string;
  quotas: Record<Metric, number>;
  features: string[];
}

export const PLANS: Record<PlanKey, PlanDefinition> = {
  PRO: {
    key: "PRO",
    name: "Pro",
    netAmountCents: 59000,
    displayCurrency: "eur",
    priceEnvVar: "STRIPE_PRICE_ID_PRO",
    quotas: { BRANDS: 1, IDEAS: 30, VIDEO: 10, VOICEOVER: 10, AI_TEXT: 300, WIDGET_CHAT: 500, WEBSITES: 1 },
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
    netAmountCents: 79700,
    displayCurrency: "eur",
    priceEnvVar: "STRIPE_PRICE_ID_MAXI",
    quotas: { BRANDS: 3, IDEAS: 90, VIDEO: 30, VOICEOVER: 30, AI_TEXT: 900, WIDGET_CHAT: 1500, WEBSITES: 3 },
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

export const VAT_NOTE = "netto zzgl. Umsatzsteuer (je nach Land)";

/** Anzeigebetrag für Cent-Werte. */
export function formatCents(cents: number, currency: string, locale = "de-DE"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

/** Abrechnungszeitraum für monatliche Kontingente (UTC-Kalendermonat). */
export function currentPeriod(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
