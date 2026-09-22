import crypto from "node:crypto";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";

export const ACCESS_COOKIE_NAME = "s58_access";

export function generateUnlockToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * Legt aus einer abgeschlossenen Stripe-Checkout-Session einen License-
 * Datensatz an (oder aktualisiert ihn) — idempotent, damit Webhook und
 * Success-Redirect sich nicht in die Quere kommen, egal welcher zuerst
 * ankommt.
 */
export async function activateLicenseFromSession(session: Stripe.Checkout.Session) {
  const existing = await prisma.license.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  });
  const unlockToken = existing?.unlockToken ?? generateUnlockToken();
  const status = session.payment_status === "paid" ? "ACTIVE" : "PENDING";

  const data = {
    status,
    customerEmail: session.customer_details?.email ?? "",
    stripeCustomerId: typeof session.customer === "string" ? session.customer : "",
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : "",
    amountTotal: session.amount_total ?? 0,
    currency: session.currency ?? "eur",
  } as const;

  return prisma.license.upsert({
    where: { stripeCheckoutSessionId: session.id },
    update: data,
    create: { unlockToken, stripeCheckoutSessionId: session.id, ...data },
  });
}
