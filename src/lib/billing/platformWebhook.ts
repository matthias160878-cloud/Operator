import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { planForStripePrice } from "@/lib/plans";

type Tx = Prisma.TransactionClient;

/**
 * Verarbeitet ein signaturgeprüftes Stripe-Event des Betreiberkontos.
 *
 * Wiederholungssicher: Die Event-ID wird in derselben Transaktion wie die
 * Änderungen gespeichert. Ein zweites Zustellen desselben Events scheitert
 * am eindeutigen Schlüssel und ändert nichts; scheitert die Verarbeitung,
 * wird alles zurückgerollt und Stripe darf erneut zustellen.
 *
 * Freischaltung erfolgt NUR über eine serverseitig angelegte PlanCheckout-
 * Zeile, deren Preis/Betrag/Währung zur bezahlten Session passt.
 */
export async function processPlatformEvent(event: Stripe.Event): Promise<"processed" | "duplicate"> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.stripeEvent.create({ data: { id: event.id, type: event.type } });
      await apply(tx, event);
    });
    return "processed";
  } catch (err) {
    if (isUniqueViolation(err) && (await prisma.stripeEvent.findUnique({ where: { id: event.id } }))) {
      return "duplicate";
    }
    throw err;
  }
}

export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

async function apply(tx: Tx, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return onCheckoutPaidOrPending(tx, event.data.object, event.livemode);
    case "checkout.session.async_payment_failed":
      return onCheckoutFailed(tx, event.data.object);
    case "checkout.session.expired":
      await tx.planCheckout.updateMany({ where: { id: event.data.object.id, status: "OPEN" }, data: { status: "EXPIRED" } });
      return;
    case "invoice.paid":
      return onInvoicePaid(tx, event.data.object, event.livemode);
    case "invoice.payment_failed":
      return onInvoiceFailed(tx, event.data.object);
    case "customer.subscription.updated":
    case "customer.subscription.created":
    case "customer.subscription.deleted":
      return onSubscriptionChanged(tx, event.data.object, event.type === "customer.subscription.deleted");
    case "charge.refunded":
      return onChargeRefunded(tx, event.data.object, event.livemode);
    default:
      return; // nicht benötigte Events werden nur protokolliert
  }
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function onCheckoutPaidOrPending(tx: Tx, session: Stripe.Checkout.Session, livemode: boolean) {
  const checkout = await tx.planCheckout.findUnique({ where: { id: session.id } });
  if (!checkout) return; // nicht von uns angelegt -> nichts freischalten
  if (checkout.status === "COMPLETED") return; // Ereignisse ohne feste Reihenfolge: bereits freigeschaltet

  const amountMatches =
    session.amount_subtotal === checkout.expectedAmount && (session.currency ?? "") === checkout.currency;
  if (!amountMatches || session.mode !== checkout.mode) {
    await tx.planCheckout.update({ where: { id: checkout.id }, data: { status: "FAILED" } });
    await tx.auditLog.create({
      data: {
        workspaceId: checkout.workspaceId,
        action: "billing.checkout_mismatch",
        detail: `Session ${session.id}: Betrag/Währung/Modus passen nicht zur Bestellung — nicht freigeschaltet.`,
      },
    });
    return;
  }

  const customerId = idOf(session.customer);
  const subscriptionId = idOf(session.subscription);

  // "no_payment_required": vollständig rabattiert (Aktionscode) — gilt als bezahlt,
  // der Betrag wurde oben gegen die Bestellung geprüft.
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    // Asynchrone Zahlarten (z. B. Lastschrift): erst nach Zahlungseingang freischalten.
    // Ein bereits aktives Paket bleibt bis dahin unverändert aktiv.
    const existing = await tx.workspacePlan.findUnique({ where: { workspaceId: checkout.workspaceId } });
    if (!existing) {
      await tx.workspacePlan.create({
        data: {
          workspaceId: checkout.workspaceId,
          plan: checkout.plan,
          status: "PENDING",
          billingMode: checkout.mode,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: checkout.stripePriceId,
        },
      });
    } else if (existing.status !== "ACTIVE" && checkout.status === "OPEN") {
      await tx.workspacePlan.update({
        where: { id: existing.id },
        data: {
          plan: checkout.plan,
          status: "PENDING",
          billingMode: checkout.mode,
          stripeCustomerId: customerId ?? undefined,
          stripeSubscriptionId: subscriptionId ?? undefined,
          stripePriceId: checkout.stripePriceId,
        },
      });
    }
    return;
  }

  await tx.workspacePlan.upsert({
    where: { workspaceId: checkout.workspaceId },
    create: {
      workspaceId: checkout.workspaceId,
      plan: checkout.plan,
      status: "ACTIVE",
      source: "STRIPE",
      billingMode: checkout.mode,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: checkout.stripePriceId,
      activatedAt: new Date(),
    },
    update: {
      plan: checkout.plan,
      status: "ACTIVE",
      source: "STRIPE",
      billingMode: checkout.mode,
      stripeCustomerId: customerId ?? undefined,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: checkout.stripePriceId,
      activatedAt: new Date(),
      cancelAtPeriodEnd: false,
    },
  });
  await tx.planCheckout.update({ where: { id: checkout.id }, data: { status: "COMPLETED" } });

  // Einmalzahlungen hier verbuchen; Abo-Zahlungen kommen über invoice.paid (keine Doppelzählung).
  if (checkout.mode === "payment") {
    const objectId = idOf(session.payment_intent) ?? session.id;
    await tx.operatorPayment.upsert({
      where: { stripeObjectId: objectId },
      create: {
        stripeObjectId: objectId,
        kind: "PAYMENT",
        workspaceId: checkout.workspaceId,
        plan: checkout.plan,
        amount: session.amount_total ?? 0,
        taxAmount: session.total_details?.amount_tax ?? 0,
        currency: session.currency ?? checkout.currency,
        status: "succeeded",
        livemode,
      },
      update: {},
    });
  }
  await tx.auditLog.create({
    data: { workspaceId: checkout.workspaceId, action: "billing.plan_activated", detail: `${checkout.plan} über Session ${session.id}` },
  });
}

async function onCheckoutFailed(tx: Tx, session: Stripe.Checkout.Session) {
  const checkout = await tx.planCheckout.findUnique({ where: { id: session.id } });
  if (!checkout) return;
  await tx.planCheckout.update({ where: { id: checkout.id }, data: { status: "FAILED" } });
  // Nur das aus dieser Bestellung stammende ausstehende Paket — ein aktives bleibt unberührt.
  await tx.workspacePlan.updateMany({
    where: { workspaceId: checkout.workspaceId, status: "PENDING", stripePriceId: checkout.stripePriceId },
    data: { status: "PAYMENT_FAILED" },
  });
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent;
  if (parent?.type === "subscription_details") return idOf(parent.subscription_details?.subscription ?? null);
  return null;
}

async function onInvoicePaid(tx: Tx, invoice: Stripe.Invoice, livemode: boolean) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  const plan = subscriptionId ? await tx.workspacePlan.findUnique({ where: { stripeSubscriptionId: subscriptionId } }) : null;
  const customerId = idOf(invoice.customer);
  const byCustomer = !plan && customerId ? await tx.workspacePlan.findFirst({ where: { stripeCustomerId: customerId } }) : null;
  const target = plan ?? byCustomer;

  if (invoice.amount_paid > 0 && invoice.id) {
    await tx.operatorPayment.upsert({
      where: { stripeObjectId: invoice.id },
      create: {
        stripeObjectId: invoice.id,
        kind: "PAYMENT",
        workspaceId: target?.workspaceId ?? null,
        plan: target?.plan ?? null,
        amount: invoice.amount_paid,
        taxAmount: (invoice.total_taxes ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0),
        currency: invoice.currency,
        status: "succeeded",
        livemode,
      },
      update: {},
    });
  }
  if (plan) {
    const periodEnd = invoice.lines?.data?.[0]?.period?.end;
    await tx.workspacePlan.update({
      where: { id: plan.id },
      data: { status: "ACTIVE", ...(periodEnd ? { currentPeriodEnd: new Date(periodEnd * 1000) } : {}) },
    });
  }
}

async function onInvoiceFailed(tx: Tx, invoice: Stripe.Invoice) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  await tx.workspacePlan.updateMany({
    where: { stripeSubscriptionId: subscriptionId, status: "ACTIVE" },
    data: { status: "PAST_DUE" },
  });
}

const SUBSCRIPTION_STATUS: Record<string, string> = {
  active: "ACTIVE",
  trialing: "ACTIVE",
  past_due: "PAST_DUE",
  unpaid: "PAYMENT_FAILED",
  canceled: "CANCELED",
  incomplete: "PENDING",
  incomplete_expired: "CANCELED",
  paused: "CANCELED",
};

async function onSubscriptionChanged(tx: Tx, sub: Stripe.Subscription, deleted: boolean) {
  const existing = await tx.workspacePlan.findUnique({ where: { stripeSubscriptionId: sub.id } });
  if (!existing) return; // Zuordnung entsteht über checkout.session.completed
  const item = sub.items.data[0];
  const newPlan = planForStripePrice(item?.price?.id) ?? existing.plan;
  await tx.workspacePlan.update({
    where: { id: existing.id },
    data: {
      plan: newPlan,
      status: deleted ? "CANCELED" : SUBSCRIPTION_STATUS[sub.status] ?? existing.status,
      stripePriceId: item?.price?.id ?? existing.stripePriceId,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      ...(item?.current_period_end ? { currentPeriodEnd: new Date(item.current_period_end * 1000) } : {}),
    },
  });
  if (newPlan !== existing.plan) {
    await tx.auditLog.create({
      data: { workspaceId: existing.workspaceId, action: "billing.plan_changed", detail: `${existing.plan} -> ${newPlan}` },
    });
  }
}

async function onChargeRefunded(tx: Tx, charge: Stripe.Charge, livemode: boolean) {
  const paymentIntentId = idOf(charge.payment_intent);
  const original = paymentIntentId ? await tx.operatorPayment.findUnique({ where: { stripeObjectId: paymentIntentId } }) : null;
  const customerId = idOf(charge.customer);
  const plan = original?.workspaceId
    ? await tx.workspacePlan.findUnique({ where: { workspaceId: original.workspaceId } })
    : customerId
      ? await tx.workspacePlan.findFirst({ where: { stripeCustomerId: customerId } })
      : null;

  // Kumulativer Erstattungsstand je Zahlung — mehrfache/Teil-Erstattungen bleiben korrekt.
  const refundKey = `refund:${charge.id}`;
  await tx.operatorPayment.upsert({
    where: { stripeObjectId: refundKey },
    create: {
      stripeObjectId: refundKey,
      kind: "REFUND",
      workspaceId: plan?.workspaceId ?? null,
      plan: plan?.plan ?? null,
      amount: charge.amount_refunded,
      currency: charge.currency,
      status: charge.refunded ? "full" : "partial",
      livemode,
    },
    update: { amount: charge.amount_refunded, status: charge.refunded ? "full" : "partial" },
  });

  // Vollständig erstattete Einmalzahlung: Paket deaktivieren. Abo-Erstattungen entscheidet der Betreiber.
  if (charge.refunded && original && plan && plan.billingMode === "payment" && original.plan === plan.plan) {
    await tx.workspacePlan.update({ where: { id: plan.id }, data: { status: "REFUNDED" } });
    await tx.auditLog.create({
      data: { workspaceId: plan.workspaceId, action: "billing.refunded", detail: `Zahlung ${paymentIntentId} vollständig erstattet` },
    });
  }
}
