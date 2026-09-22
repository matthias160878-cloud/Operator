import Stripe from "stripe";

/**
 * Stripe-Adapter für den Kauf-Freischalt-Flow (Abschnitt "Lizenzierung").
 * Wie jede andere Integration in dieser App: ausschließlich env-basiert,
 * niemals Keys im Code, App bleibt ohne diese Variablen startfähig — die
 * Verkaufsseite zeigt dann ehrlich "Zahlung noch nicht konfiguriert".
 */
let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

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

export async function createCheckoutSession(input: {
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe ist noch nicht konfiguriert (STRIPE_SECRET_KEY/STRIPE_PRICE_ID fehlt).");
  }

  const session = await getClient().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });

  if (!session.url) {
    throw new Error("Stripe hat keine Checkout-URL zurückgegeben.");
  }
  return session.url;
}

export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe-Webhook ist noch nicht konfiguriert (STRIPE_WEBHOOK_SECRET fehlt).");
  }
  return getClient().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

export async function retrieveCheckoutSession(sessionId: string) {
  return getClient().checkout.sessions.retrieve(sessionId);
}

export async function getConfiguredPrice(locale = "de"): Promise<{
  formatted: string;
  productName: string;
} | null> {
  if (!isStripeConfigured()) return null;
  try {
    const price = await getClient().prices.retrieve(process.env.STRIPE_PRICE_ID!, {
      expand: ["product"],
    });
    const amount = (price.unit_amount ?? 0) / 100;
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: price.currency,
    }).format(amount);
    const product = price.product;
    const productName =
      typeof product === "object" && product && "name" in product ? product.name : "SECRET 58";
    return { formatted, productName };
  } catch {
    return null;
  }
}
