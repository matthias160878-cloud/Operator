import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/**
 * Stripe Connect für Kundenverkäufe (Weg B).
 *
 * Architektur (nach docs.stripe.com/connect/saas bzw. end-to-end-saas-platform):
 *  - Ein eigenes verbundenes Konto je Workspace. Der Kunde ist Händler
 *    (merchant of record): er trägt die Stripe-Gebühren, ist für Erstattungen
 *    und Streitfälle zuständig und erhält Auszahlungen direkt von Stripe auf
 *    sein eigenes Bankkonto.
 *  - Kontoeinstellungen über Controller-Eigenschaften (Accounts API v1):
 *    fees.payer=account, losses.payments=stripe, requirement_collection=stripe,
 *    stripe_dashboard.type=full. Das entspricht dem bisherigen "Standard"-Konto.
 *  - Zahlungen als Direct Charges auf dem verbundenen Konto (Stripe-Account-Header).
 *  - KEINE Plattformgebühr (application_fee) — es wurde keine vereinbart.
 *  - Stripe empfiehlt für neue Plattformen inzwischen Accounts v2; der Wechsel
 *    ist in docs/BETRIEB-UND-ZAHLUNGEN.md als offener Punkt vermerkt.
 */
export function isConnectConfigured(): boolean {
  return isStripeConfigured() && Boolean(process.env.STRIPE_CONNECT_WEBHOOK_SECRET);
}

export async function getMerchantAccount(workspaceId: string) {
  return prisma.merchantAccount.findUnique({ where: { workspaceId } });
}

export async function ensureMerchantAccount(workspaceId: string, email: string) {
  const existing = await getMerchantAccount(workspaceId);
  if (existing) return existing;
  const account = await getStripe().accounts.create({
    email,
    controller: {
      fees: { payer: "account" },
      losses: { payments: "stripe" },
      requirement_collection: "stripe",
      stripe_dashboard: { type: "full" },
    },
    metadata: { workspaceId },
  });
  try {
    return await prisma.merchantAccount.create({
      data: { workspaceId, stripeAccountId: account.id, ...flags(account) },
    });
  } catch {
    // Paralleler Aufruf hat bereits ein Konto gespeichert — das gespeicherte gilt.
    return prisma.merchantAccount.findUniqueOrThrow({ where: { workspaceId } });
  }
}

export function flags(account: Stripe.Account) {
  return {
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
    requirementsDue: JSON.stringify(account.requirements?.currently_due ?? []),
    defaultCurrency: account.default_currency ?? null,
  };
}

export async function createOnboardingLink(workspaceId: string, email: string, origin: string): Promise<string> {
  const merchant = await ensureMerchantAccount(workspaceId, email);
  const link = await getStripe().accountLinks.create({
    account: merchant.stripeAccountId,
    refresh_url: `${origin}/sales?onboarding=refresh`,
    return_url: `${origin}/sales?onboarding=return`,
    type: "account_onboarding",
  });
  return link.url;
}

export async function refreshMerchantStatus(workspaceId: string) {
  const merchant = await getMerchantAccount(workspaceId);
  if (!merchant) return null;
  const account = await getStripe().accounts.retrieve(merchant.stripeAccountId);
  return prisma.merchantAccount.update({ where: { id: merchant.id }, data: flags(account) });
}

/** Guthaben des eigenen Händlerkontos — direkt von Stripe, nichts geschätzt. */
export async function getMerchantBalance(stripeAccountId: string) {
  const balance = await getStripe().balance.retrieve(undefined, { stripeAccount: stripeAccountId });
  return {
    available: balance.available.map((b) => ({ currency: b.currency, amount: b.amount })),
    pending: balance.pending.map((b) => ({ currency: b.currency, amount: b.amount })),
  };
}
