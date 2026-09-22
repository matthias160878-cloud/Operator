import Link from "next/link";
import clsx from "clsx";
import { Clock3, Hash, Layers, ShieldAlert } from "lucide-react";
import type { Platform } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getGrowthRecommendations } from "@/lib/agents/growthAgent";
import { formatPercent, PLATFORM_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

const PLATFORM_VALUES = Object.keys(PLATFORM_LABELS) as Platform[];

export default async function GrowthPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string }>;
}) {
  const { platform } = await searchParams;
  const t = await getTranslations("growth");
  const workspaceId = await getCurrentWorkspaceId();
  const selected = PLATFORM_VALUES.includes(platform as Platform) ? (platform as Platform) : undefined;

  const recommendations = await getGrowthRecommendations(workspaceId, selected);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {t.rich("warning", { strong: (chunks) => <strong>{chunks}</strong> })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/growth"
          className={clsx(
            "rounded-full border px-3 py-1 text-xs",
            !selected ? "border-accent bg-accent/15 text-foreground" : "border-border bg-surface-2 text-muted"
          )}
        >
          {t("filterAll")}
        </Link>
        {PLATFORM_VALUES.map((p) => (
          <Link
            key={p}
            href={`/growth?platform=${p}`}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs",
              selected === p ? "border-accent bg-accent/15 text-foreground" : "border-border bg-surface-2 text-muted"
            )}
          >
            {PLATFORM_LABELS[p]}
          </Link>
        ))}
      </div>

      {recommendations.sampleSize === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          {t("emptyState", {
            platform: selected ? PLATFORM_LABELS[selected] : t("emptyStateDefaultScope"),
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock3 className="h-4 w-4" /> {t("bestPostingTimesTitle")}
            </h2>
            <div className="space-y-2">
              {recommendations.bestPostingTimes.map((pt, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                  <span className="text-foreground">
                    {t("postingTime", { day: pt.dayOfWeek, hour: `${String(pt.hour).padStart(2, "0")}:00` })}
                  </span>
                  <span className="text-xs text-muted">
                    {t("avgLabel", { percent: formatPercent(pt.avgEngagement), count: pt.sampleSize })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Hash className="h-4 w-4" /> {t("topHashtagsTitle")}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {recommendations.topHashtags.length === 0 && (
                <p className="text-xs text-muted">{t("topHashtagsEmpty")}</p>
              )}
              {recommendations.topHashtags.map((h) => (
                <span
                  key={h.tag}
                  title={t("hashtagTooltip", { percent: formatPercent(h.avgEngagement), count: h.count })}
                  className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs text-accent-2"
                >
                  {h.tag}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Layers className="h-4 w-4" /> {t("topFormatsTitle")}
            </h2>
            <div className="space-y-2">
              {recommendations.topFormats.map((f) => (
                <div key={f.format} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{f.format}</span>
                  <span className="text-xs text-muted">
                    {t("avgLabel", { percent: formatPercent(f.avgEngagement), count: f.sampleSize })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
