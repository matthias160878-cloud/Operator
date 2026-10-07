import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { PLANS, packageTermsConfirmed, stripePriceIdFor, type PlanKey } from "@/lib/plans";

/**
 * Stripe-Adapter für die Paketabrechnung des Betreibers.
 * Ausschließlich env-basiert, nie Schlüssel im Code. Ohne Konfiguration
 * startet die App trotzdem; Kauf-Schaltflächen melden dann ehrlich, dass die
 * Zahlung noch nicht eingerichtet ist.
 */
let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

export function stripeMode(): "live" | "test" | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return key.startsWith("sk_live_") || key.startsWith("rk_live_") ? "live" : "test";
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe ist noch nicht konfiguriert (STRIPE_SECRET_KEY fehlt).");
  }
  if (!client) {
    // STRIPE_API_HOST nur für die lokale Stripe-Attrappe der Tests
    // (scripts/fake-stripe.mjs). In Produktion bleibt die Variable leer.
    const host = process.env.STRIPE_API_HOST;
    client = new Stripe(
      process.env.STRIPE_SECRET_KEY,
      host
        ? {
            host,
            port: Number(process.env.STRIPE_API_PORT) || 12111,
            protocol: (process.env.STRIPE_API_PROTOCOL as "http" | "https") || "http",
            maxNetworkRetries: 0,
          }
        : { maxNetworkRetries: 2, timeout: 20_000 }
    );
  }
  return client;
}

export interface PlanPrice {
  plan: PlanKey;
  priceId: string;
  unitAmount: number;
  currency: string;
  /** null = einmalige Zahlung; sonst Intervall laut Stripe-Preis. */
  recurring: { interval: string; intervalCount: number } | null;
  productName: string;
}

const priceCache = new Map<string, { at: number; value: PlanPrice }>();

/** Liest den echten, in Stripe hinterlegten Preis — Betrag, Währung und Intervall kommen von dort. */
export async function getPlanPrice(plan: PlanKey): Promise<PlanPrice | null> {
  const priceId = stripePriceIdFor(plan);
  if (!isStripeConfigured() || !priceId) return null;
  const cached = priceCache.get(priceId);
  if (cached && Date.now() - cached.at < 5 * 60_000) return cached.value;
  const price = await getStripe().prices.retrieve(priceId, { expand: ["product"] });
  if (!price.active || price.unit_amount == null) return null;
  const product = price.product;
  const value: PlanPrice = {
    plan,
    priceId,
    unitAmount: price.unit_amount,
    currency: price.currency,
    recurring: price.recurring
      ? { interval: price.recurring.interval, intervalCount: price.recurring.interval_count }
      : null,
    productName: typeof product === "object" && product && "name" in product ? product.name : PLANS[plan].name,
  };
  priceCache.set(priceId, { at: Date.now(), value });
  return value;
}

export class CheckoutRefused extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
  }
}

/**
 * Legt eine Checkout-Session für den angemeldeten Kunden an. Die Zuordnung
 * Session -> Workspace/Paket/Preis wird serverseitig gespeichert
 * (PlanCheckout); der Webhook verlässt sich ausschließlich darauf.
 */
export async function createPlanCheckout(input: {
  workspaceId: string;
  userId: string;
  email: string;
  plan: PlanKey;
  origin: string;
}): Promise<string> {
  if (!packageTermsConfirmed()) {
    throw new CheckoutRefused(
      "Der Verkauf ist noch nicht freigegeben: Die Paketkonditionen sind vom Betreiber noch nicht bestätigt.",
      503
    );
  }
  if (!isStripeConfigured() || !isStripeWebhookConfigured()) {
    throw new CheckoutRefused("Die Zahlung ist noch nicht eingerichtet.", 503);
  }
  const price = await getPlanPrice(input.plan);
  if (!price) throw new CheckoutRefused("Für dieses Paket ist in Stripe kein aktiver Preis hinterlegt.", 503);

  const current = await prisma.workspacePlan.findUnique({ where: { workspaceId: input.workspaceId } });
  if (current && ["ACTIVE", "PAST_DUE", "PENDING"].includes(current.status)) {
    if (current.billingMode === "subscription") {
      throw new CheckoutRefused(
        "Du hast bereits ein laufendes Abo. Einen Paketwechsel nimmst du über „Abo verwalten“ vor."
      );
    }
    if (current.plan === input.plan) {
      throw new CheckoutRefused("Dieses Paket ist bereits aktiv oder die Zahlung wird noch verarbeitet.");
    }
  }

  const mode: "payment" | "subscription" = price.recurring ? "subscription" : "payment";
  const metadata = { workspaceId: input.workspaceId, plan: input.plan, userId: input.userId };
  const session = await getStripe().checkout.sessions.create({
    mode,
    line_items: [{ price: price.priceId, quantity: 1 }],
    client_reference_id: input.workspaceId,
    metadata,
    ...(current?.stripeCustomerId
      ? { customer: current.stripeCustomerId }
      : mode === "payment"
        ? { customer_email: input.email, customer_creation: "always" as const }
        : { customer_email: input.email }),
    ...(mode === "payment" ? { payment_intent_data: { metadata } } : { subscription_data: { metadata } }),
    // Rabatte nur über in Stripe angelegte Aktionscodes — kein selbst erfundener Rabatt.
    allow_promotion_codes: true,
    success_url: `${input.origin}/billing?checkout={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/billing?plan=${input.plan.toLowerCase()}&abgebrochen=1`,
  });
  if (!session.url) throw new Error("Stripe hat keine Checkout-URL zurückgegeben.");

  await prisma.planCheckout.create({
    data: {
      id: session.id,
      workspaceId: input.workspaceId,
      userId: input.userId,
      plan: input.plan,
      stripePriceId: price.priceId,
      expectedAmount: price.unitAmount,
      currency: price.currency,
      mode,
    },
  });
  return session.url;
}

export async function createPortalSession(workspaceId: string, returnUrl: string): Promise<string> {
  const plan = await prisma.workspacePlan.findUnique({ where: { workspaceId } });
  if (!plan?.stripeCustomerId) throw new CheckoutRefused("Für diesen Arbeitsbereich gibt es noch kein Kundenkonto bei Stripe.", 404);
  const session = await getStripe().billingPortal.sessions.create({
    customer: plan.stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}

export function constructWebhookEvent(rawBody: string, signature: string, secret: string | undefined): Stripe.Event {
  if (!secret) throw new Error("Webhook-Signaturschlüssel fehlt.");
  // Prüfen erfordert keinen API-Aufruf; ein Platzhalter-Schlüssel genügt, falls nur der Webhook konfiguriert ist.
  const verifier = client ?? new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
  return verifier.webhooks.constructEvent(rawBody, signature, secret);
}
