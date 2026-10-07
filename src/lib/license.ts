import type Stripe from "stripe";
import { prisma } from "@/lib/db";

export const ACCESS_COOKIE_NAME = "s58_access";

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
