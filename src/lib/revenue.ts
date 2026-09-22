import { prisma } from "@/lib/db";

export interface CurrencyTotal {
  currency: string;
  amount: number;
}

export interface GroupedTotal {
  key: string;
  currency: string;
  amount: number;
}

function sumByCurrency(entries: { currency: string; amount: number }[]): CurrencyTotal[] {
  const totals = new Map<string, number>();
  for (const e of entries) {
    totals.set(e.currency, (totals.get(e.currency) ?? 0) + e.amount);
  }
  return Array.from(totals.entries()).map(([currency, amount]) => ({ currency, amount }));
}

function groupBy<T extends { currency: string; amount: number }>(
  entries: T[],
  keyOf: (e: T) => string
): GroupedTotal[] {
  const totals = new Map<string, { currency: string; amount: number }>();
  for (const e of entries) {
    const key = keyOf(e);
    const mapKey = `${key}::${e.currency}`;
    const existing = totals.get(mapKey);
    totals.set(mapKey, { currency: e.currency, amount: (existing?.amount ?? 0) + e.amount });
  }
  return Array.from(totals.entries()).map(([mapKey, v]) => ({
    key: mapKey.split("::")[0],
    currency: v.currency,
    amount: v.amount,
  }));
}

/**
 * Aggregiert Einnahmen sauber getrennt nach Währung (kein Vermischen
 * unterschiedlicher Währungen zu einer falschen Summe). In der Praxis
 * dominiert für einen einzelnen Workspace i.d.R. eine Währung.
 */
export async function getRevenueSummary(workspaceId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [all, thisMonth, prevMonth] = await Promise.all([
    prisma.revenueEntry.findMany({ where: { workspaceId } }),
    prisma.revenueEntry.findMany({
      where: { workspaceId, recordedAt: { gte: monthStart } },
    }),
    prisma.revenueEntry.findMany({
      where: { workspaceId, recordedAt: { gte: prevMonthStart, lt: monthStart } },
    }),
  ]);

  return {
    totals: sumByCurrency(all),
    totalsThisMonth: sumByCurrency(thisMonth),
    totalsPrevMonth: sumByCurrency(prevMonth),
    byPlatform: groupBy(all, (e) => e.platform ?? "OHNE_PLATTFORM"),
    byType: groupBy(all, (e) => e.type),
    entryCount: all.length,
  };
}
