import { Eye, Heart, MessageCircle, Share2, TrendingUp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import {
  getWorkspaceStats,
  getBestPerformingContent,
  getPerformanceOverTime,
} from "@/lib/agents/analyticsAgent";
import { getRecommendations } from "@/lib/agents/learningAgent";
import { StatCard } from "@/components/ui/StatCard";
import { PerformanceChart } from "@/components/analytics/PerformanceChart";
import { formatNumber, formatPercent, PLATFORM_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const t = await getTranslations("analytics");
  const workspaceId = await getCurrentWorkspaceId();
  const [stats, best, series, recommendations] = await Promise.all([
    getWorkspaceStats(workspaceId),
    getBestPerformingContent(workspaceId, 8),
    getPerformanceOverTime(workspaceId),
    getRecommendations(workspaceId),
  ]);

  const chartData = series.map((s) => ({
    date: new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(s.recordedAt),
    views: s.views,
    engagementRate: s.engagementRate,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Eye} label={t("statViewsTotal")} value={formatNumber(stats.totalViews)} accent="accent" />
        <StatCard icon={Heart} label={t("statLikesTotal")} value={formatNumber(stats.totalLikes)} accent="accent-3" />
        <StatCard icon={MessageCircle} label={t("statComments")} value={formatNumber(stats.totalComments)} accent="accent-2" />
        <StatCard icon={Share2} label={t("statShares")} value={formatNumber(stats.totalShares)} accent="success" />
      </div>

      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{t("chartTitle")}</h2>
          <span className="text-xs text-muted">{t("chartLegend")}</span>
        </div>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted">{t("chartEmpty")}</p>
        ) : (
          <PerformanceChart data={chartData} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t("bestPerformingTitle")}</h2>
          <div className="space-y-2">
            {best.length === 0 && <p className="text-xs text-muted">{t("bestPerformingEmpty")}</p>}
            {best.map((a) => (
              <div key={a.id} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="truncate text-sm text-foreground">{a.contentItem.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span>{PLATFORM_LABELS[a.platform] ?? a.platform}</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {formatNumber(a.views)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {formatNumber(a.likes)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {formatPercent(a.engagementRate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t("learningAgentTitle")}</h2>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="text-sm font-medium text-foreground">{r.title}</div>
                <div className="mt-1 text-xs text-muted">{r.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
