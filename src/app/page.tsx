import Link from "next/link";
import {
  Bot,
  Brain,
  CalendarPlus,
  Compass,
  Eye,
  FileText,
  Film,
  Heart,
  Rocket,
  Send,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getDefaultWorkspace } from "@/lib/workspace";
import {
  getWorkspaceStats,
  getWeeklyProduction,
  getBestPerformingContent,
} from "@/lib/agents/analyticsAgent";
import { getAllIntegrationStatuses } from "@/lib/integrations/registry";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { formatNumber, formatPercent, relativeTime, PLATFORM_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const workspace = await getDefaultWorkspace();
  const workspaceId = workspace.id;

  const [
    stats,
    weeklyProduction,
    brand,
    campaigns,
    upcomingItems,
    recentRuns,
    platformAccounts,
    integrationStatuses,
    bestPerforming,
    demoSetting,
  ] = await Promise.all([
    getWorkspaceStats(workspaceId),
    getWeeklyProduction(workspaceId),
    prisma.brand.findUnique({ where: { workspaceId } }),
    prisma.campaign.findMany({
      where: { workspaceId },
      include: { contentItems: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.contentItem.findMany({
      where: { workspaceId, status: { in: ["SCHEDULED", "PUBLISHED"] } },
      orderBy: { scheduledAt: "asc" },
      take: 4,
    }),
    prisma.agentRun.findMany({
      where: { workspaceId },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
    prisma.platformAccount.findMany({ where: { workspaceId } }),
    getAllIntegrationStatuses(),
    getBestPerformingContent(workspaceId, 3),
    prisma.setting.findUnique({
      where: { workspaceId_key: { workspaceId, key: "demoDataSeeded" } },
    }),
  ]);

  const connectedIntegrations = integrationStatuses.filter(
    (i) => i.status === "CONNECTED"
  ).length;

  return (
    <div className="space-y-5">
      {demoSetting && (
        <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-xs text-accent">
          Demo-Daten aktiv — Kampagnen, Content-Items und Analytics sind Beispieldaten aus{" "}
          <code>prisma/seed.ts</code>, keine echten Plattform-Zahlen.
        </div>
      )}

      {/* Hero */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="card relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-accent-2/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-accent-2">
              <Sparkles className="h-3.5 w-3.5" /> AI Social Command Center
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              SECRET 58
            </h1>
            <p className="mt-1 max-w-md text-sm text-muted">
              Eine Idee. Mehrere Plattformen. Maximale Reichweite.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/content-brain"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-3 px-3.5 py-2 text-sm font-medium text-white shadow-[0_0_25px_rgba(109,91,255,0.35)]"
              >
                <Brain className="h-4 w-4" /> Neue Kampagne
              </Link>
              <Link
                href="/content-factory"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-sm font-medium text-foreground hover:border-accent/40"
              >
                <FileText className="h-4 w-4" /> Content erstellen
              </Link>
              <Link
                href="/ideas"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-sm font-medium text-foreground hover:border-accent/40"
              >
                <Compass className="h-4 w-4" /> Ideen finden
              </Link>
              <Link
                href="/agents"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-sm font-medium text-foreground hover:border-accent/40"
              >
                <Bot className="h-4 w-4" /> KI-Agenten
              </Link>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Aktive Agenten</h2>
            <Link href="/agents" className="text-xs text-accent-2 hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <div className="space-y-2">
            {recentRuns.length === 0 && (
              <p className="text-xs text-muted">Noch keine Agent-Läufe.</p>
            )}
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground">{run.agentName}</div>
                  <div className="truncate text-xs text-muted">{run.task}</div>
                </div>
                <StatusBadge status={run.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={FileText} label="Content erstellt" value={String(stats.contentCreated)} accent="accent" />
        <StatCard icon={Film} label="Videos erstellt" value={String(stats.videosCreated)} accent="accent-3" />
        <StatCard icon={Send} label="Posts erstellt" value={String(stats.postsCreated)} accent="accent-2" />
        <StatCard icon={Rocket} label="Veröffentlichungen" value={String(stats.published)} accent="success" />
        <StatCard icon={Eye} label="Views" value={formatNumber(stats.totalViews)} accent="accent" />
        <StatCard icon={Heart} label="Ø Engagement" value={formatPercent(stats.avgEngagementRate)} accent="accent-3" />
      </div>

      {/* Production / Scheduled / Activity */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-4 xl:col-span-1">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Content Produktion</h2>
            <span className="text-xs text-muted">Diese Woche</span>
          </div>
          <ProductionChart data={weeklyProduction} />
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Geplante Beiträge</h2>
            <Link href="/calendar" className="text-xs text-accent-2 hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingItems.length === 0 && (
              <p className="text-xs text-muted">Keine geplanten Beiträge.</p>
            )}
            {upcomingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground">{item.title}</div>
                  <div className="text-xs text-muted">
                    {PLATFORM_LABELS[item.platform] ?? item.platform} ·{" "}
                    {item.scheduledAt
                      ? new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(item.scheduledAt)
                      : "—"}
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Letzte Aktivitäten</h2>
          </div>
          <div className="space-y-3">
            {recentRuns.length === 0 && (
              <p className="text-xs text-muted">Noch keine Aktivitäten.</p>
            )}
            {recentRuns.map((run) => (
              <div key={run.id} className="flex items-start gap-2.5">
                <span className="mt-1.5 status-dot bg-accent-2" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-foreground">{run.task}</div>
                  <div className="text-xs text-muted">{run.agentName}</div>
                </div>
                <span className="shrink-0 text-xs text-muted">{relativeTime(run.startedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Factory / Brand DNA / Campaigns */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card relative overflow-hidden p-5 xl:col-span-1">
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-accent/25 blur-2xl" />
          <h2 className="text-lg font-semibold text-foreground">Content Factory</h2>
          <p className="mt-1 text-sm text-muted">
            Erstelle mit nur einer Idee komplette Content-Kampagnen für alle Plattformen.
          </p>
          <Link
            href="/content-factory"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white"
          >
            Jetzt starten →
          </Link>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Brand DNA</h2>
            <div className="flex items-center gap-2">
              <StatusBadge status={brand ? "CONNECTED" : "NOT_CONFIGURED"} />
              <Link href="/brand-dna" className="text-xs text-accent-2 hover:underline">
                Bearbeiten
              </Link>
            </div>
          </div>
          {brand ? (
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Tonalität</dt>
                <dd className="text-right text-foreground">{brand.tonality}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Zielgruppe</dt>
                <dd className="text-right text-foreground">{brand.targetAudience}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Branche</dt>
                <dd className="text-right text-foreground">{brand.industry}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Sprache</dt>
                <dd className="text-right text-foreground">{brand.language}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-muted">Noch keine Brand DNA hinterlegt.</p>
          )}
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Aktuelle Kampagnen</h2>
            <Link href="/content-brain" className="text-xs text-accent-2 hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <div className="space-y-3">
            {campaigns.length === 0 && <p className="text-xs text-muted">Noch keine Kampagnen.</p>}
            {campaigns.map((c) => {
              const total = c.contentItems.length || 1;
              const done = c.contentItems.filter((i) => i.status === "PUBLISHED").length;
              const pct = Math.round((done / total) * 100);
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate text-foreground">{c.title}</span>
                    <span className="text-xs text-muted">{done}/{c.contentItems.length}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platforms / Integrations / Top performer */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Plattformen</h2>
            <Link href="/social-media" className="text-xs text-accent-2 hover:underline">
              Verwalten
            </Link>
          </div>
          <div className="space-y-2">
            {platformAccounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{PLATFORM_LABELS[acc.platform] ?? acc.platform}</span>
                <StatusBadge status={acc.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Integrationen</h2>
            <Link href="/integrations" className="text-xs text-accent-2 hover:underline">
              {connectedIntegrations}/{integrationStatuses.length} verbunden
            </Link>
          </div>
          <div className="space-y-2">
            {integrationStatuses.slice(0, 5).map((integ) => (
              <div key={integ.key} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{integ.name}</span>
                <StatusBadge status={integ.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Top Performer</h2>
            <span className="text-xs text-muted">Letzte 7 Tage</span>
          </div>
          <div className="space-y-3">
            {bestPerforming.length === 0 && (
              <p className="text-xs text-muted">Noch keine Performance-Daten.</p>
            )}
            {bestPerforming.map((a) => (
              <div key={a.id}>
                <div className="truncate text-sm text-foreground">{a.contentItem.title}</div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted">
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
      </div>

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Content Kalender</h2>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-1.5 text-xs text-accent-2 hover:underline"
          >
            <CalendarPlus className="h-3.5 w-3.5" /> Kalender öffnen
          </Link>
        </div>
        <div className="grid grid-cols-7 gap-2 text-xs">
          {weeklyProduction.map((d) => (
            <div key={d.day} className="rounded-lg border border-border bg-surface-2 p-2 text-center">
              <div className="text-muted">{d.day}</div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {Object.entries(d)
                  .filter(([k]) => k !== "day")
                  .reduce((sum, [, v]) => sum + Number(v), 0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pb-2 text-xs text-muted">
        <Users className="h-3.5 w-3.5" /> Mehr als Content. Eine komplette Content-Maschine. — SECRET 58
      </div>
    </div>
  );
}
