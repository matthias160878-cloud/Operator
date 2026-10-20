/**
 * Wo bekommt man den API-Schlüssel für jede Integration? Reine Navigations-
 * Links zu den offiziellen Entwickler-/Account-Seiten der Anbieter — es wird
 * niemals ein Schlüssel über die App selbst entgegengenommen (Secrets landen
 * ausschließlich als Environment-Variable, nie im Frontend/Formular).
 */
/**
 * Offizielle Seiten, auf denen man den jeweiligen Schlüssel bzw. die Kennung
 * erstellt. Einzige Quelle für diese Adressen: genutzt von den Integrationen,
 * „Eigene Zugänge“ (Kunde) und dem Betreiberbereich „Zugänge“.
 */
export const SCHLUESSEL_SEITEN = {
  anthropic: "https://console.anthropic.com/settings/keys",
  openai: "https://platform.openai.com/api-keys",
  gemini: "https://aistudio.google.com/apikey",
  resend: "https://resend.com/api-keys",
  composio: "https://platform.composio.dev/",
  stripeSchluessel: "https://dashboard.stripe.com/apikeys",
  stripeWebhooks: "https://dashboard.stripe.com/webhooks",
  stripeProdukte: "https://dashboard.stripe.com/products",
} as const;

export const API_KEY_SIGNUP_LINKS: Partial<Record<string, string>> = {
  anthropic: SCHLUESSEL_SEITEN.anthropic,
  openai: SCHLUESSEL_SEITEN.openai,
  gemini: SCHLUESSEL_SEITEN.gemini,
  elevenlabs: "https://elevenlabs.io/app/settings/api-keys",
  youtube: "https://console.cloud.google.com/apis/credentials",
  instagram: "https://developers.facebook.com/apps/",
  tiktok: "https://developers.tiktok.com/",
  linkedin: "https://www.linkedin.com/developers/apps",
  facebook: "https://developers.facebook.com/apps/",
  composio: SCHLUESSEL_SEITEN.composio,
  canva: "https://www.canva.com/developers/",
};

/**
 * Wo trägt man den Schlüssel danach ein? Direktlink auf die Environment-
 * Variablen dieses Render-Diensts — es gibt bewusst kein Eingabeformular
 * innerhalb der App dafür (siehe README-SOCIAL-MEDIA.md, Abschnitt
 * "Kauf-Freischaltung"/Environment Variables).
 */
export const RENDER_ENV_DASHBOARD_URL =
  "https://dashboard.render.com/web/srv-dap4u46gekts73fq80q0/env";

/**
 * Kostenmodell jeder Integration beim jeweiligen Drittanbieter — UNABHÄNGIG
 * vom einmaligen SECRET-58-Kaufpreis. SECRET 58 selbst stellt keine
 * zusätzliche Rechnung für die Nutzung eines Anbieters; was der Anbieter
 * selbst verlangt (falls überhaupt), zahlt die Kundin/der Kunde direkt an
 * ihn, nutzungsbasiert und ohne feste Laufzeit, sofern nicht anders
 * angegeben. Bewusst keine konkreten Beträge hier — die ändern sich, die
 * Wahrheit steht nur beim Anbieter selbst (pricingUrl).
 */
export type PricingModel = "free" | "payAsYouGo" | "subscription" | "unknown";

export interface IntegrationPricing {
  model: PricingModel;
  pricingUrl?: string;
}

export const INTEGRATION_PRICING: Partial<Record<string, IntegrationPricing>> = {
  anthropic: {
    model: "payAsYouGo",
    pricingUrl: "https://www.anthropic.com/pricing#api",
  },
  openai: {
    model: "payAsYouGo",
    pricingUrl: "https://openai.com/api/pricing/",
  },
  elevenlabs: {
    model: "subscription",
    pricingUrl: "https://elevenlabs.io/pricing",
  },
  youtube: {
    model: "free",
    pricingUrl: "https://developers.google.com/youtube/v3/getting-started#quota",
  },
  instagram: {
    model: "free",
    pricingUrl: "https://developers.facebook.com/docs/graph-api/overview/rate-limiting",
  },
  composio: {
    model: "subscription",
    pricingUrl: "https://composio.dev/pricing",
  },
  facebook: {
    model: "free",
    pricingUrl: "https://developers.facebook.com/docs/graph-api/overview/rate-limiting",
  },
  tiktok: {
    model: "free",
    pricingUrl: "https://developers.tiktok.com/doc/login-kit-web",
  },
  linkedin: {
    model: "free",
    pricingUrl: "https://www.linkedin.com/developers/",
  },
  canva: {
    model: "unknown",
    pricingUrl: "https://www.canva.com/developers/",
  },
  capcut: {
    model: "unknown",
  },
  trend: {
    model: "unknown",
  },
};
