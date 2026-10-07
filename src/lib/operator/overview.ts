import { prisma } from "@/lib/db";
import { getStripe, isStripeConfigured, stripeMode } from "@/lib/stripe";

export interface MoneyByCurrency {
  currency: string;
  amount: number;
}

function sumBy(rows: { currency: string; amount: number }[]): MoneyByCurrency[] {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.currency, (map.get(r.currency) ?? 0) + r.amount);
  return [...map.entries()].map(([currency, amount]) => ({ currency, amount })).sort((a, b) => a.currency.localeCompare(b.currency));
}

/**
 * Betreiber-Übersicht: ausschließlich Paketzahlungen und Betriebszahlen.
 * Enthält bewusst KEINE Kundeninhalte (Ideen, Skripte, Nachrichten, Dateien,
 * Kunden-Verkäufe) — diese bleiben im jeweiligen privaten Arbeitsbereich.
 */
export async function getOperatorOverview() {
  const live = stripeMode() === "live";
  const payments = await prisma.operatorPayment.findMany({ where: { livemode: live }, orderBy: { createdAt: "desc" } });
  const gross = sumBy(payments.filter((p) => p.kind === "PAYMENT"));
  const refunds = sumBy(payments.filter((p) => p.kind === "REFUND"));
  // Enthaltene Umsatzsteuer — gehört ans Finanzamt, nicht zum Umsatz.
  const tax = sumBy(payments.filter((p) => p.kind === "PAYMENT").map((p) => ({ currency: p.currency, amount: p.taxAmount })));
  const net = gross.map((g) => ({
    currency: g.currency,
    amount: g.amount - (refunds.find((r) => r.currency === g.currency)?.amount ?? 0),
  }));

  const plans = await prisma.workspacePlan.groupBy({ by: ["plan", "status", "source"], _count: { _all: true } });
  const workspaceCount = await prisma.workspace.count();
  const openCheckouts = await prisma.planCheckout.count({ where: { status: "OPEN" } });

  let stripe: {
    available: MoneyByCurrency[];
    pending: MoneyByCurrency[];
    payouts: { id: string; amount: number; currency: string; status: string; arrivalDate: Date }[];
    error?: string;
  } | null = null;
  if (isStripeConfigured()) {
    try {
      const s = getStripe();
      const [balance, payouts] = await Promise.all([s.balance.retrieve(), s.payouts.list({ limit: 10 })]);
      stripe = {
        available: balance.available.map((b) => ({ currency: b.currency, amount: b.amount })),
        pending: balance.pending.map((b) => ({ currency: b.currency, amount: b.amount })),
        payouts: payouts.data.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          arrivalDate: new Date(p.arrival_date * 1000),
        })),
      };
    } catch (err) {
      stripe = { available: [], pending: [], payouts: [], error: err instanceof Error ? "Stripe-Daten konnten nicht geladen werden." : "Fehler" };
    }
  }

  return {
    mode: stripeMode(),
    gross,
    tax,
    refunds,
    net,
    recentPayments: payments.slice(0, 20).map((p) => ({
      id: p.id,
      kind: p.kind,
      plan: p.plan,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.createdAt,
    })),
    plans: plans.map((p) => ({ plan: p.plan, status: p.status, source: p.source, count: p._count._all })),
    workspaceCount,
    openCheckouts,
    stripe,
  };
}
