import Link from "next/link";
import {
  Bot,
  Brain,
  CalendarPlus,
  Clock,
  Compass,
  Eye,
  FileText,
  Film,
  Heart,
  MessageCircle,
  Play,
  Rocket,
  Send,
  Share2,
  Sparkles,
} from "lucide-react";
import { PlatformGlyph } from "@/components/dashboard/PlatformGlyph";
import { prisma } from "@/lib/db";
import { getDefaultWorkspace } from "@/lib/workspace";
import {
  getWorkspaceStats,
  getWeeklyProduction,
  getBestPerformingContent,
  getWeekOverWeekStats,
} from "@/lib/agents/analyticsAgent";
import { getAllIntegrationStatuses } from "@/lib/integrations/registry";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { BrainOrbit, type OrbitPlatform } from "@/components/dashboard/BrainOrbit";
import { formatNumber, formatPercent, formatDuration, relativeTime, PLATFORM_LABELS } from "@/lib/format";
import { isSameDay } from "@/lib/calendarGrid";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function currentWeekRange(): { start: Date; end: Date; days: Date[] } {
  const now = new Date();
  const offset = (now.getDay() + 6) % 7; // Montag = 0
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end, days };
}

export default async function DashboardPage() {
  const workspace = await getDefaultWorkspace();
  const workspaceId = workspace.id;
  const week = currentWeekRange();

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
    weekItems,
    weekOverWeek,
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
    prisma.contentItem.findMany({
      where: { workspaceId, scheduledAt: { gte: week.start, lt: week.end } },
      orderBy: { scheduledAt: "asc" },
    }),
    getWeekOverWeekStats(workspaceId),
  ]);

  const connectedIntegrations = integrationStatuses.filter(
    (i) => i.status === "CONNECTED"
  ).length;

  const platformConnected = new Map(
    platformAccounts.map((acc) => [acc.platform, acc.status === "CONNECTED"])
  );
  const orbitPlatforms: OrbitPlatform[] = [
    { key: "YOUTUBE", label: "YouTube", connected: platformConnected.get("YOUTUBE") ?? false },
    { key: "INSTAGRAM", label: "Instagram", connected: platformConnected.get("INSTAGRAM") ?? false },
    { key: "TIKTOK", label: "TikTok", connected: platformConnected.get("TIKTOK") ?? false },
    { key: "LINKEDIN", label: "LinkedIn", connected: platformConnected.get("LINKEDIN") ?? false },
    { key: "FACEBOOK", label: "Facebook", connected: platformConnected.get("FACEBOOK") ?? false },
    { key: "X", label: "X (nicht angebunden)", connected: false },
  ];

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
          <div className="relative flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="w-full md:max-w-sm">
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

            <BrainOrbit platforms={orbitPlatforms} />
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
        <StatCard
          icon={FileText}
          label="Content erstellt"
          value={String(stats.contentCreated)}
          accent="accent"
          delta={weekOverWeek.contentCreated != null ? `${weekOverWeek.contentCreated > 0 ? "+" : ""}${weekOverWeek.contentCreated}%` : undefined}
        />
        <StatCard
          icon={Film}
          label="Videos erstellt"
          value={String(stats.videosCreated)}
          accent="accent-3"
          delta={weekOverWeek.videosCreated != null ? `${weekOverWeek.videosCreated > 0 ? "+" : ""}${weekOverWeek.videosCreated}%` : undefined}
        />
        <StatCard
          icon={Send}
          label="Posts erstellt"
          value={String(stats.postsCreated)}
          accent="accent-2"
          delta={weekOverWeek.postsCreated != null ? `${weekOverWeek.postsCreated > 0 ? "+" : ""}${weekOverWeek.postsCreated}%` : undefined}
        />
        <StatCard
          icon={Rocket}
          label="Veröffentlichungen"
          value={String(stats.published)}
          accent="success"
          delta={weekOverWeek.published != null ? `${weekOverWeek.published > 0 ? "+" : ""}${weekOverWeek.published}%` : undefined}
        />
        <StatCard
          icon={Eye}
          label="Views"
          value={formatNumber(stats.totalViews)}
          accent="accent"
          delta={weekOverWeek.totalViews != null ? `${weekOverWeek.totalViews > 0 ? "+" : ""}${weekOverWeek.totalViews}%` : undefined}
        />
        <StatCard
          icon={Heart}
          label="Ø Engagement"
          value={formatPercent(stats.avgEngagementRate)}
          accent="accent-3"
          delta={weekOverWeek.avgEngagementRate != null ? `${weekOverWeek.avgEngagementRate > 0 ? "+" : ""}${weekOverWeek.avgEngagementRate}%` : undefined}
        />
      </div>
      {Object.values(weekOverWeek).every((v) => v == null) && (
        <p className="-mt-2 text-[11px] text-muted">
          Noch keine Vorwoche als Vergleichsbasis vorhanden — Veränderungsraten erscheinen, sobald Daten über mindestens zwei Wochen vorliegen.
        </p>
      )}

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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
        <div className="card flex flex-col gap-4 overflow-hidden p-5 sm:flex-row">
          <div className="relative flex min-w-0 flex-1 flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-accent-3/30 via-accent/20 to-transparent p-4">
            <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-full bg-accent-2/20 blur-2xl" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Sparkles className="h-5 w-5 text-accent-2" />
            </div>
            <div className="relative mt-4">
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
          </div>

          <div className="w-full shrink-0 sm:w-40">
            <div className="mb-2 text-xs font-medium text-muted">Beliebte Vorlagen</div>
            <div className="space-y-1.5">
              {[
                { key: "YOUTUBE" as const, label: "YouTube Video" },
                { key: "TIKTOK" as const, label: "TikTok Serie" },
                { key: "INSTAGRAM" as const, label: "Instagram Reel" },
                { key: "LINKEDIN" as const, label: "LinkedIn Post" },
              ].map((tpl) => (
                <Link
                  key={tpl.label}
                  href="/script-studio"
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-foreground"
                >
                  <PlatformGlyph platform={tpl.key} className="h-3.5 w-3.5" />
                  {tpl.label}
                </Link>
              ))}
              <Link
                href="/script-studio"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-foreground"
              >
                <FileText className="h-3.5 w-3.5" /> Blogartikel
              </Link>
            </div>
            <Link
              href="/content-factory"
              className="mt-1 block px-2 text-xs text-accent-2 hover:underline"
            >
              Alle Vorlagen →
            </Link>
          </div>
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
                <div key={c.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-3">
                    <Play className="h-4 w-4 text-white" fill="white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-foreground">{c.title}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right text-[11px] text-muted">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platforms / Integrations / Top performer */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
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
            <h2 className="text-sm font-semibold text-foreground">Agent Monitor</h2>
            <Link href="/agents" className="text-xs text-accent-2 hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <div className="space-y-2">
            {recentRuns.length === 0 && <p className="text-xs text-muted">Noch keine Läufe.</p>}
            {recentRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-foreground">{run.agentName}</div>
                  <div className="truncate text-xs text-muted">{run.task}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                    <Clock className="h-3 w-3" /> {formatDuration(run.startedAt, run.finishedAt)}
                  </span>
                  <StatusBadge status={run.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Top Performer</h2>
            <span className="text-xs text-muted">Letzte 7 Tage</span>
          </div>
          {bestPerforming.length === 0 ? (
            <p className="text-xs text-muted">Noch keine Performance-Daten.</p>
          ) : (
            (() => {
              const top = bestPerforming[0];
              return (
                <div>
                  <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-accent-3/40 via-accent/30 to-accent-2/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                      <Play className="h-4 w-4 text-white" fill="white" />
                    </div>
                  </div>
                  <div className="mt-2 truncate text-sm text-foreground">{top.contentItem.title}</div>
                  <div className="mt-2 grid grid-cols-4 gap-1 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-foreground">
                        <Eye className="h-3 w-3 text-muted" /> {formatNumber(top.views)}
                      </div>
                      <div className="text-[10px] text-muted">Views</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-foreground">
                        <Heart className="h-3 w-3 text-muted" /> {formatNumber(top.likes)}
                      </div>
                      <div className="text-[10px] text-muted">Likes</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-foreground">
                        <MessageCircle className="h-3 w-3 text-muted" /> {formatNumber(top.comments)}
                      </div>
                      <div className="text-[10px] text-muted">Kommentare</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-[11px] text-foreground">
                        <Share2 className="h-3 w-3 text-muted" /> {formatNumber(top.shares)}
                      </div>
                      <div className="text-[10px] text-muted">Shares</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-success/15 px-2.5 py-1.5 text-center text-xs font-medium text-success">
                    +Engagement Rate {formatPercent(top.engagementRate)}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Content Kalender</h2>
            <p className="text-xs text-muted">
              {new Intl.DateTimeFormat("de-DE", { day: "2-digit" }).format(week.days[0])}. –{" "}
              {new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(
                week.days[6]
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-border text-xs">
              {["Monat", "Woche", "Tag", "Kampagne"].map((label) => (
                <Link
                  key={label}
                  href="/calendar"
                  className={
                    "px-2.5 py-1 " +
                    (label === "Woche"
                      ? "bg-accent/20 text-foreground"
                      : "text-muted hover:bg-surface-2 hover:text-foreground")
                  }
                >
                  {label}
                </Link>
              ))}
            </div>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1.5 text-xs text-accent-2 hover:underline"
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Öffnen
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 text-xs">
          {week.days.map((day, i) => {
            const dayItems = weekItems.filter(
              (item) => item.scheduledAt && isSameDay(item.scheduledAt, day)
            );
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={
                  "min-h-[92px] rounded-lg border p-2 " +
                  (isToday ? "border-accent/40 bg-accent/5" : "border-border bg-surface-2")
                }
              >
                <div className={"text-[11px] " + (isToday ? "font-semibold text-accent-2" : "text-muted")}>
                  {WEEKDAY_LABELS[i]} {day.getDate()}
                </div>
                <div className="mt-1.5 space-y-1">
                  {dayItems.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      href={`/content-factory/${item.id}`}
                      className="flex items-center gap-1 truncate rounded border border-border bg-surface px-1 py-0.5 text-[10px] text-foreground hover:border-accent/40"
                      title={item.title}
                    >
                      {["YOUTUBE", "TIKTOK", "INSTAGRAM", "LINKEDIN", "FACEBOOK"].includes(item.platform) ? (
                        <PlatformGlyph
                          platform={item.platform as "YOUTUBE" | "TIKTOK" | "INSTAGRAM" | "LINKEDIN" | "FACEBOOK"}
                          className="h-2.5 w-2.5 shrink-0"
                        />
                      ) : (
                        <FileText className="h-2.5 w-2.5 shrink-0" />
                      )}
                      <span className="truncate">{item.title}</span>
                    </Link>
                  ))}
                  {dayItems.length > 2 && (
                    <div className="text-[10px] text-muted">+{dayItems.length - 2} weitere</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-2 border-t border-border pt-4 pb-2 text-xs text-muted sm:flex-row">
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-accent-2" />
          <span className="font-medium text-foreground">SECRET 58</span> · AI Social Command Center
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings" className="hover:text-foreground">
            Hilfe
          </Link>
          <Link href="/settings" className="hover:text-foreground">
            Datenschutz
          </Link>
          <Link href="/settings" className="hover:text-foreground">
            Impressum
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-success">
            <span className="status-dot bg-success" /> System online
          </span>
        </div>
      </div>
    </div>
  );
}
