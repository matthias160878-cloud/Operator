import { Banknote, Coins, HandCoins, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getRevenueSummary } from "@/lib/revenue";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RevenueBoard } from "@/components/revenue/RevenueBoard";
import { formatCurrency, PLATFORM_LABELS } from "@/lib/format";
import { checkIntegration } from "@/lib/integrations/registry";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const t = await getTranslations("revenue");
  const ti = await getTranslations("common.integrationStatus");
  const workspaceId = await getCurrentWorkspaceId();
  const TYPE_LABELS: Record<string, string> = {
    AD_REVENUE: t("types.AD_REVENUE"),
    SPONSORSHIP: t("types.SPONSORSHIP"),
    AFFILIATE: t("types.AFFILIATE"),
    DONATION: t("types.DONATION"),
    OTHER: t("types.OTHER"),
  };

  const [entries, campaigns, summary, youtubeIntegration] = await Promise.all([
    prisma.revenueEntry.findMany({
      where: { workspaceId },
      include: { campaign: { select: { title: true } } },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.campaign.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
    getRevenueSummary(workspaceId),
    checkIntegration(
      {
        key: "youtube-revenue",
        name: "YouTube Analytics (Umsatz)",
        category: "PLATFORM",
        requiredEnv: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"],
      },
      ti
    ),
  ]);

  const primaryTotal = summary.totals[0];
  const primaryMonth = summary.totalsThisMonth.find((entry) => entry.currency === primaryTotal?.currency);
  const primaryPrevMonth = summary.totalsPrevMonth.find((entry) => entry.currency === primaryTotal?.currency);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-xs text-muted">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong className="text-foreground">{t("youtubeIntegrationLabel")}</strong>{" "}
            {youtubeIntegration.message}
          </span>
          <StatusBadge status={youtubeIntegration.status} />
        </div>
        <p className="mt-1">{t("youtubeIntegrationDisclaimer")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Wallet}
          label={t("statTotal")}
          value={primaryTotal ? formatCurrency(primaryTotal.amount, primaryTotal.currency) : formatCurrency(0)}
          accent="accent"
        />
        <StatCard
          icon={Coins}
          label={t("statThisMonth")}
          value={primaryMonth ? formatCurrency(primaryMonth.amount, primaryMonth.currency) : formatCurrency(0)}
          accent="success"
        />
        <StatCard
          icon={Banknote}
          label={t("statPrevMonth")}
          value={
            primaryPrevMonth ? formatCurrency(primaryPrevMonth.amount, primaryPrevMonth.currency) : formatCurrency(0)
          }
          accent="accent-3"
        />
      </div>

      {summary.totals.length > 1 && (
        <p className="text-xs text-muted">
          {t("otherCurrencies")}{" "}
          {summary.totals
            .slice(1)
            .map((entry) => formatCurrency(entry.amount, entry.currency))
            .join(", ")}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <HandCoins className="h-4 w-4" /> {t("byPlatformTitle")}
          </h2>
          <div className="space-y-2">
            {summary.byPlatform.length === 0 && <p className="text-xs text-muted">{t("byPlatformEmpty")}</p>}
            {summary.byPlatform.map((g) => (
              <div key={`${g.key}-${g.currency}`} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {g.key === "OHNE_PLATTFORM" ? t("noPlatform") : PLATFORM_LABELS[g.key] ?? g.key}
                </span>
                <span className="text-muted">{formatCurrency(g.amount, g.currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t("byTypeTitle")}</h2>
          <div className="space-y-2">
            {summary.byType.length === 0 && <p className="text-xs text-muted">{t("byTypeEmpty")}</p>}
            {summary.byType.map((g) => (
              <div key={`${g.key}-${g.currency}`} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{TYPE_LABELS[g.key] ?? g.key}</span>
                <span className="text-muted">{formatCurrency(g.amount, g.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RevenueBoard entries={entries} campaigns={campaigns} />
    </div>
  );
}
