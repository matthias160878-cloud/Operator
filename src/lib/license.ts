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
 *
 * `client_reference_id` wurde beim Checkout-Start aus der Server-Session
 * des eingeloggten Nutzers gesetzt (siehe `createCheckoutSession`,
 * `/api/stripe/checkout`) — niemals aus einem Client-Parameter dieser
 * Funktion selbst. Damit wird gezielt genau dessen Workspace freigeschaltet
 * statt einer global geteilten Instanz.
 */
export async function activateLicenseFromSession(session: Stripe.Checkout.Session) {
  const existing = await prisma.license.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  });
  const unlockToken = existing?.unlockToken ?? generateUnlockToken();
  const status = session.payment_status === "paid" ? "ACTIVE" : "PENDING";

  let userId: string | null = existing?.userId ?? null;
  let workspaceId: string | null = existing?.workspaceId ?? null;
  if (!userId && session.client_reference_id) {
    const user = await prisma.user.findUnique({
      where: { id: session.client_reference_id },
      select: { id: true, workspaceId: true },
    });
    if (user) {
      userId = user.id;
      workspaceId = user.workspaceId;
    }
  }

  const data = {
    status,
    customerEmail: session.customer_details?.email ?? "",
    stripeCustomerId: typeof session.customer === "string" ? session.customer : "",
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : "",
    amountTotal: session.amount_total ?? 0,
    currency: session.currency ?? "eur",
    userId,
    workspaceId,
  } as const;

  return prisma.license.upsert({
    where: { stripeCheckoutSessionId: session.id },
    update: data,
    create: { unlockToken, stripeCheckoutSessionId: session.id, ...data },
  });
}

/**
 * Markiert die passende License als erstattet (Abschnitt 4: "Erstattungs-
 * ... Zustände" müssen abgebildet sein). `updateMany` statt `update` macht
 * das idempotent — ein wiederholt zugestellter Webhook (z.B. nach einem
 * Retry) führt nicht zu einem Fehler, wenn die License schon REFUNDED ist
 * oder (noch) nicht existiert.
 */
export async function markLicenseRefunded(charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : "";
  if (!paymentIntentId) return;
  await prisma.license.updateMany({
    where: { stripePaymentIntentId: paymentIntentId },
    data: { status: "REFUNDED" },
  });
}
