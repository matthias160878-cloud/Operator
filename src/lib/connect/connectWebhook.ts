import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isUniqueViolation } from "@/lib/billing/platformWebhook";
import { flags } from "@/lib/connect/merchant";

type Tx = Prisma.TransactionClient;

/**
 * Events der verbundenen Händlerkonten (Connect-Endpunkt mit eigenem
 * Signaturschlüssel). event.account bestimmt den Workspace — nie Metadaten
 * allein. Kundenverkäufe landen ausschließlich in CustomerSale, getrennt von
 * den Paketumsätzen des Betreibers.
 */
export async function processConnectEvent(event: Stripe.Event): Promise<"processed" | "duplicate" | "ignored"> {
  if (!event.account) return "ignored";
  const merchant = await prisma.merchantAccount.findUnique({ where: { stripeAccountId: event.account } });
  if (!merchant) return "ignored";
  try {
    await prisma.$transaction(async (tx) => {
      await tx.stripeEvent.create({ data: { id: event.id, type: event.type, account: event.account } });
      await apply(tx, event, merchant.workspaceId, merchant.id);
    });
    return "processed";
  } catch (err) {
    if (isUniqueViolation(err) && (await prisma.stripeEvent.findUnique({ where: { id: event.id } }))) return "duplicate";
    throw err;
  }
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function apply(tx: Tx, event: Stripe.Event, workspaceId: string, merchantId: string) {
  switch (event.type) {
    case "account.updated":
      await tx.merchantAccount.update({ where: { id: merchantId }, data: flags(event.data.object) });
      return;
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      // Nur Verkäufe aus unserem Shop-Checkout, der den Workspace selbst gesetzt hat.
      if (session.metadata?.workspaceId !== workspaceId || session.mode !== "payment") return;
      const externalId = idOf(session.payment_intent) ?? session.id;
      const status = session.payment_status === "paid" ? "PAID" : "PENDING";
      await tx.customerSale.upsert({
        where: { workspaceId_externalId: { workspaceId, externalId } },
        create: {
          workspaceId,
          source: "SECRET58_CHECKOUT",
          externalId,
          productName: session.metadata?.productName ?? "",
          amount: session.amount_total ?? 0,
          currency: session.currency ?? "eur",
          status,
          isTestData: !event.livemode,
          occurredAt: new Date(session.created * 1000),
        },
        update: { status },
      });
      return;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      const externalId = idOf(session.payment_intent) ?? session.id;
      await tx.customerSale.updateMany({ where: { workspaceId, externalId }, data: { status: "FAILED" } });
      return;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const externalId = idOf(charge.payment_intent);
      if (!externalId) return;
      await tx.customerSale.updateMany({
        where: { workspaceId, externalId },
        data: { refundedAmount: charge.amount_refunded, status: charge.refunded ? "REFUNDED" : "PARTIALLY_REFUNDED" },
      });
      return;
    }
    default:
      return;
  }
}
