import { Banknote, Coins, HandCoins, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getRevenueSummary } from "@/lib/revenue";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RevenueBoard } from "@/components/revenue/RevenueBoard";
import { formatCurrency, PLATFORM_LABELS } from "@/lib/format";
import { checkIntegration } from "@/lib/integrations/registry";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  AD_REVENUE: "Werbeeinnahmen",
  SPONSORSHIP: "Sponsoring",
  AFFILIATE: "Affiliate",
  DONATION: "Spende",
  OTHER: "Sonstiges",
};

export default async function RevenuePage() {
  const workspaceId = await getCurrentWorkspaceId();

  const [entries, campaigns, summary, youtubeIntegration] = await Promise.all([
    prisma.revenueEntry.findMany({
      where: { workspaceId },
      include: { campaign: { select: { title: true } } },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.campaign.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
    getRevenueSummary(workspaceId),
    checkIntegration({
      key: "youtube-revenue",
      name: "YouTube Analytics (Umsatz)",
      category: "PLATFORM",
      requiredEnv: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"],
    }),
  ]);

  const primaryTotal = summary.totals[0];
  const primaryMonth = summary.totalsThisMonth.find((t) => t.currency === primaryTotal?.currency);
  const primaryPrevMonth = summary.totalsPrevMonth.find((t) => t.currency === primaryTotal?.currency);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Einnahmen</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Zusammengefasste Einnahmen über alle Plattformen und Kampagnen — manuell erfasst,
          optional mit Plattform/Kampagne verknüpft. Keine erfundenen Zahlen: Beträge erscheinen
          erst, wenn du sie einträgst.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-xs text-muted">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong className="text-foreground">YouTube-Analytics-Anbindung:</strong>{" "}
            {youtubeIntegration.message}
          </span>
          <StatusBadge status={youtubeIntegration.status} />
        </div>
        <p className="mt-1">
          TikTok und Meta (Instagram/Facebook) bieten für normale Creator-Accounts keine
          öffentliche API für Einnahmen an — dort bleibt die manuelle Erfassung der Weg. YouTube
          böte über die YouTube-Analytics-API mit Partnerprogramm-Zugang echte Umsatzdaten; diese
          Anbindung ist vorbereitet, aber noch nicht implementiert.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Wallet}
          label="Gesamt"
          value={primaryTotal ? formatCurrency(primaryTotal.amount, primaryTotal.currency) : formatCurrency(0)}
          accent="accent"
        />
        <StatCard
          icon={Coins}
          label="Diesen Monat"
          value={primaryMonth ? formatCurrency(primaryMonth.amount, primaryMonth.currency) : formatCurrency(0)}
          accent="success"
        />
        <StatCard
          icon={Banknote}
          label="Vormonat"
          value={
            primaryPrevMonth ? formatCurrency(primaryPrevMonth.amount, primaryPrevMonth.currency) : formatCurrency(0)
          }
          accent="accent-3"
        />
      </div>

      {summary.totals.length > 1 && (
        <p className="text-xs text-muted">
          Weitere Währungen:{" "}
          {summary.totals
            .slice(1)
            .map((t) => formatCurrency(t.amount, t.currency))
            .join(", ")}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <HandCoins className="h-4 w-4" /> Nach Plattform
          </h2>
          <div className="space-y-2">
            {summary.byPlatform.length === 0 && <p className="text-xs text-muted">Noch keine Daten.</p>}
            {summary.byPlatform.map((g) => (
              <div key={`${g.key}-${g.currency}`} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {g.key === "OHNE_PLATTFORM" ? "Ohne Plattform" : PLATFORM_LABELS[g.key] ?? g.key}
                </span>
                <span className="text-muted">{formatCurrency(g.amount, g.currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Nach Typ</h2>
          <div className="space-y-2">
            {summary.byType.length === 0 && <p className="text-xs text-muted">Noch keine Daten.</p>}
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
