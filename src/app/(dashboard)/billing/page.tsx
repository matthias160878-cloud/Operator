import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getUsage } from "@/lib/entitlements";
import {
  METRIC_LABELS,
  PLANS,
  PLAN_KEYS,
  VAT_NOTE,
  YEARLY_DISCOUNT_PERCENT,
  formatCents,
  lookupStripePrice,
  netAmountFor,
  packageTermsConfirmed,
  parseBillingInterval,
  parsePlanKey,
  yearlyMonthlyEquivalent,
  type Metric,
} from "@/lib/plans";
import { getPlanPrice, isStripeConfigured, isStripeWebhookConfigured, type PlanPrice } from "@/lib/stripe";
import { BillingClient, type PlanCard } from "@/components/billing/BillingClient";
import { legalInfoComplete } from "@/lib/legal";

export const dynamic = "force-dynamic";

const STATUS_TEXT: Record<string, string> = {
  NONE: "Kein Paket",
  PENDING: "Zahlung wird verarbeitet — noch nicht freigeschaltet",
  ACTIVE: "Aktiv",
  PAST_DUE: "Zahlung überfällig — Leistungen pausiert, bis die Zahlung eingeht",
  CANCELED: "Beendet",
  REFUNDED: "Erstattet — Leistungen deaktiviert",
  PAYMENT_FAILED: "Zahlung fehlgeschlagen — nicht freigeschaltet",
};

function intervalText(price: PlanPrice | null): string {
  if (!price) return "Preis noch nicht in Stripe hinterlegt";
  if (!price.recurring) return "einmalig";
  const n = price.recurring.intervalCount;
  const unit = { day: "Tag", week: "Woche", month: "Monat", year: "Jahr" }[price.recurring.interval] ?? price.recurring.interval;
  return n === 1 ? `pro ${unit}` : `alle ${n} ${unit}e`;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; checkout?: string; intervall?: string }>;
}) {
  const { plan: planParam, checkout, intervall } = await searchParams;
  const workspaceId = await getCurrentWorkspaceId();
  const [current, usage] = await Promise.all([prisma.workspacePlan.findUnique({ where: { workspaceId } }), getUsage(workspaceId)]);

  const safePrice = async (key: (typeof PLAN_KEYS)[number], interval: "month" | "year") => {
    try {
      return await getPlanPrice(key, interval);
    } catch {
      return null;
    }
  };
  const prices = await Promise.all(PLAN_KEYS.map((key) => safePrice(key, "month")));
  const yearPrices = await Promise.all(PLAN_KEYS.map((key) => safePrice(key, "year")));
  const cards: PlanCard[] = PLAN_KEYS.map((key, i) => {
    const def = PLANS[key];
    const price = prices[i];
    return {
      key,
      name: def.name,
      priceText: formatCents(def.netAmountCents, def.displayCurrency),
      priceIsLive: Boolean(price),
      intervalText: `${VAT_NOTE} · ${price ? intervalText(price) : "monatlich"}`,
      yearPriceText: formatCents(netAmountFor(key, "year"), def.displayCurrency),
      yearIntervalText: `${VAT_NOTE} · ${yearPrices[i] ? intervalText(yearPrices[i]) : "jährlich"} · entspricht ${formatCents(
        yearlyMonthlyEquivalent(key),
        def.displayCurrency
      )} / Monat (${YEARLY_DISCOUNT_PERCENT} % günstiger als 12 Monatszahlungen)`,
      yearAvailable: Boolean(yearPrices[i]),
      features: def.features,
      quotas: (Object.keys(def.quotas) as Metric[]).map((m) => ({
        label: METRIC_LABELS[m],
        value: def.quotas[m],
        provisional: false,
      })),
    };
  });

  const activePlanKey = current?.status === "ACTIVE" ? current.plan : null;
  const quotaRows = activePlanKey
    ? (Object.keys(PLANS[activePlanKey as keyof typeof PLANS].quotas) as Metric[]).map((m) => ({
        label: METRIC_LABELS[m],
        used: usage[m],
        limit: PLANS[activePlanKey as keyof typeof PLANS].quotas[m],
      }))
    : [];

  const salesOpen = packageTermsConfirmed() && legalInfoComplete() && isStripeConfigured() && isStripeWebhookConfigured();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Paket &amp; Abrechnung</h1>
        <p className="mt-1 text-sm text-muted">
          Die KI-Funktionen laufen über die Zugänge des Betreibers — du brauchst kein eigenes ChatGPT-, Claude- oder
          Gemini-Abo. Bestehende eigene Abos bei diesen Anbietern werden dadurch weder übernommen noch gekündigt.
        </p>
      </div>
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-foreground">Aktueller Status</h2>
        <p className="mt-1 text-sm text-foreground">
          {current ? `${PLANS[current.plan as keyof typeof PLANS]?.name ?? current.plan}: ${STATUS_TEXT[current.status] ?? current.status}` : STATUS_TEXT.NONE}
          {current?.source === "TEST" ? " (Testdaten)" : ""}
        </p>
        {current?.cancelAtPeriodEnd && current.currentPeriodEnd && (
          <p className="mt-1 text-xs text-muted">Endet am {current.currentPeriodEnd.toLocaleDateString("de-DE")}.</p>
        )}
        {quotaRows.length > 0 && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {quotaRows.map((q) => (
              <li key={q.label} className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs">
                <div className="text-muted">{q.label}</div>
                <div className="text-sm text-foreground">
                  {q.used} / {q.limit}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <BillingClient
        cards={cards}
        preselected={parsePlanKey(planParam)}
        preselectedInterval={parseBillingInterval(intervall) ?? "month"}
        activeInterval={current?.status === "ACTIVE" ? (lookupStripePrice(current.stripePriceId)?.interval ?? null) : null}
        checkoutId={checkout ?? null}
        salesOpen={salesOpen}
        hasSubscription={current?.billingMode === "subscription" && Boolean(current.stripeCustomerId)}
        hasCustomer={Boolean(current?.stripeCustomerId)}
        activePlan={activePlanKey}
      />
      <p className="text-xs text-muted">
        Kontingente sind feste Obergrenzen je Kalendermonat (Marken und Webseiten: gleichzeitig). Es gibt keine
        automatische kostenpflichtige Überschreitung, auch nicht beim Jahresabo. Das Abo verlängert sich je nach Wahl
        monatlich oder jährlich und ist über „Abo &amp; Rechnungen verwalten“ zum Ende der Laufzeit kündbar.
      </p>
    </div>
  );
}
