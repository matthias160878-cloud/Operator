import { prisma } from "@/lib/db";
import { MONTHLY_METRICS, PLANS, currentPeriod, isPlanKey, type Metric, type PlanKey } from "@/lib/plans";

/** Zustände, in denen die gebuchten Leistungen nutzbar sind. */
const USABLE_STATUSES = new Set(["ACTIVE"]);

export interface ActivePlan {
  plan: PlanKey;
  status: string;
  source: string;
}

export async function getActivePlan(workspaceId: string): Promise<ActivePlan | null> {
  const row = await prisma.workspacePlan.findUnique({ where: { workspaceId } });
  if (!row || !USABLE_STATUSES.has(row.status) || !isPlanKey(row.plan)) return null;
  // Abo mit abgelaufenem Zeitraum ohne Verlängerungs-Webhook: nicht mehr nutzbar.
  if (row.billingMode === "subscription" && row.currentPeriodEnd && row.currentPeriodEnd.getTime() < Date.now()) {
    return null;
  }
  return { plan: row.plan, status: row.status, source: row.source };
}

export class QuotaError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: "NO_PLAN" | "QUOTA_EXCEEDED",
    readonly metric: Metric,
  ) {
    super(message);
  }
}

/**
 * Reserviert eine Einheit eines Kontingents — atomar. Die Erhöhung ist ein
 * einziges bedingtes UPDATE ("used < limit"); parallele Anfragen können das
 * Limit daher nicht gemeinsam überschreiten. Gibt eine Funktion zurück, mit
 * der die Reservierung bei Fehlschlag (z. B. Anbieter nicht erreichbar)
 * wieder freigegeben wird.
 *
 * Es gibt KEINE kostenpflichtige Überschreitung: ist das Kontingent
 * ausgeschöpft, wird die Anfrage abgelehnt.
 */
export async function reserveQuota(workspaceId: string, metric: Metric, amount = 1): Promise<() => Promise<void>> {
  const active = await getActivePlan(workspaceId);
  if (!active) {
    throw new QuotaError(
      "Für diese Funktion ist ein aktives Paket nötig. Unter „Paket & Abrechnung“ kannst du Pro oder Maxi wählen.",
      402,
      "NO_PLAN",
      metric,
    );
  }
  const limit = PLANS[active.plan].quotas[metric];
  const period = MONTHLY_METRICS.includes(metric) ? currentPeriod() : "total";

  await prisma.usageCounter.upsert({
    where: { workspaceId_metric_period: { workspaceId, metric, period } },
    create: { workspaceId, metric, period, used: 0 },
    update: {},
  });
  if (amount === 0) return async () => undefined;
  const reserved = await prisma.usageCounter.updateMany({
    where: { workspaceId, metric, period, used: { lte: limit - amount } },
    data: { used: { increment: amount } },
  });
  if (reserved.count !== 1) {
    const upgrade = active.plan === "PRO" ? " Ein Wechsel auf Maxi ist unter „Paket & Abrechnung“ möglich — nur nach deiner ausdrücklichen Bestätigung." : "";
    throw new QuotaError(
      `Das Kontingent für ${metric === "AI_TEXT" ? "KI-Textaufträge" : metric} ist für diesen Zeitraum ausgeschöpft (${limit}).${upgrade}`,
      429,
      "QUOTA_EXCEEDED",
      metric,
    );
  }
  let released = false;
  return async () => {
    if (released) return;
    released = true;
    await prisma.usageCounter.updateMany({
      where: { workspaceId, metric, period, used: { gte: amount } },
      data: { used: { decrement: amount } },
    });
  };
}

export async function getUsage(workspaceId: string): Promise<Record<Metric, number>> {
  const period = currentPeriod();
  const rows = await prisma.usageCounter.findMany({
    where: { workspaceId, OR: [{ period }, { period: "total" }] },
  });
  const usage = { AI_TEXT: 0, IDEAS: 0, VOICEOVER: 0, VIDEO: 0, WIDGET_CHAT: 0, BRANDS: 0, WEBSITES: 0 } as Record<Metric, number>;
  for (const row of rows) usage[row.metric as Metric] = row.used;
  return usage;
}
