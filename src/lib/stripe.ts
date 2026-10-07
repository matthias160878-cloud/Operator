import Stripe from "stripe";

/**
 * Stripe-Adapter — nur noch für den Refund-Webhook (Abschnitt "Lizenzierung").
 * Pro/Maxi werden ausschließlich über die Zentrale (secret58.com) als Abo
 * verkauft; der frühere Operator-eigene Checkout ist retired (siehe
 * src/app/api/stripe/checkout/route.ts, HTTP 410). Wie jede andere
 * Integration in dieser App: ausschließlich env-basiert, niemals Keys im
 * Code.
 */
let client: Stripe | null = null;

export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

function getClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe ist noch nicht konfiguriert (STRIPE_SECRET_KEY fehlt).");
  }
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe-Webhook ist noch nicht konfiguriert (STRIPE_WEBHOOK_SECRET fehlt).");
  }
  return getClient().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
