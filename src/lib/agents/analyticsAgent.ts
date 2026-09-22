import { prisma } from "@/lib/db";

export interface WorkspaceStats {
  contentCreated: number;
  videosCreated: number;
  postsCreated: number;
  published: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
}

export async function getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
  const [contentCreated, videosCreated, postsCreated, published, analyticsAgg] =
    await Promise.all([
      prisma.contentItem.count({ where: { workspaceId } }),
      prisma.mediaAsset.count({ where: { workspaceId, type: "VIDEO" } }),
      prisma.contentItem.count({
        where: { workspaceId, platform: { in: ["INSTAGRAM", "LINKEDIN", "FACEBOOK"] } },
      }),
      prisma.contentItem.count({ where: { workspaceId, status: "PUBLISHED" } }),
      prisma.analytics.aggregate({
        where: { contentItem: { workspaceId } },
        _sum: { views: true, likes: true, comments: true, shares: true },
        _avg: { engagementRate: true },
      }),
    ]);

  return {
    contentCreated,
    videosCreated,
    postsCreated,
    published,
    totalViews: analyticsAgg._sum.views ?? 0,
    totalLikes: analyticsAgg._sum.likes ?? 0,
    totalComments: analyticsAgg._sum.comments ?? 0,
    totalShares: analyticsAgg._sum.shares ?? 0,
    avgEngagementRate: analyticsAgg._avg.engagementRate ?? 0,
  };
}

export interface WeekOverWeekStats {
  contentCreated: number | null;
  videosCreated: number | null;
  postsCreated: number | null;
  published: number | null;
  totalViews: number | null;
  avgEngagementRate: number | null;
}

function percentDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Echte Woche-über-Woche-Veränderung je KPI. Gibt `null` zurück, wenn keine
 * Vorwoche als Vergleichsbasis existiert (z.B. bei einem frisch installierten
 * Workspace) — es wird nie eine erfundene Prozentzahl angezeigt.
 */
export async function getWeekOverWeekStats(workspaceId: string): Promise<WeekOverWeekStats> {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 86400000);
  const prevWeekStart = new Date(now.getTime() - 14 * 86400000);

  const [thisWeek, prevWeek] = await Promise.all([
    prisma.contentItem.findMany({
      where: { workspaceId, createdAt: { gte: weekStart, lte: now } },
      select: { platform: true, status: true },
    }),
    prisma.contentItem.findMany({
      where: { workspaceId, createdAt: { gte: prevWeekStart, lt: weekStart } },
      select: { platform: true, status: true },
    }),
  ]);

  const [videosThisWeek, videosPrevWeek, viewsThisWeek, viewsPrevWeek, engThisWeek, engPrevWeek] =
    await Promise.all([
      prisma.mediaAsset.count({
        where: { workspaceId, type: "VIDEO", createdAt: { gte: weekStart, lte: now } },
      }),
      prisma.mediaAsset.count({
        where: { workspaceId, type: "VIDEO", createdAt: { gte: prevWeekStart, lt: weekStart } },
      }),
      prisma.analytics.aggregate({
        where: { contentItem: { workspaceId }, recordedAt: { gte: weekStart, lte: now } },
        _sum: { views: true },
      }),
      prisma.analytics.aggregate({
        where: { contentItem: { workspaceId }, recordedAt: { gte: prevWeekStart, lt: weekStart } },
        _sum: { views: true },
      }),
      prisma.analytics.aggregate({
        where: { contentItem: { workspaceId }, recordedAt: { gte: weekStart, lte: now } },
        _avg: { engagementRate: true },
      }),
      prisma.analytics.aggregate({
        where: { contentItem: { workspaceId }, recordedAt: { gte: prevWeekStart, lt: weekStart } },
        _avg: { engagementRate: true },
      }),
    ]);

  const postsFilter = (items: { platform: string }[]) =>
    items.filter((i) => ["INSTAGRAM", "LINKEDIN", "FACEBOOK"].includes(i.platform)).length;
  const publishedFilter = (items: { status: string }[]) =>
    items.filter((i) => i.status === "PUBLISHED").length;

  return {
    contentCreated: percentDelta(thisWeek.length, prevWeek.length),
    videosCreated: percentDelta(videosThisWeek, videosPrevWeek),
    postsCreated: percentDelta(postsFilter(thisWeek), postsFilter(prevWeek)),
    published: percentDelta(publishedFilter(thisWeek), publishedFilter(prevWeek)),
    totalViews: percentDelta(viewsThisWeek._sum.views ?? 0, viewsPrevWeek._sum.views ?? 0),
    avgEngagementRate: percentDelta(
      engThisWeek._avg.engagementRate ?? 0,
      engPrevWeek._avg.engagementRate ?? 0
    ),
  };
}

export async function getBestPerformingContent(workspaceId: string, limit = 5) {
  const analytics = await prisma.analytics.findMany({
    where: { contentItem: { workspaceId } },
    include: { contentItem: true },
    orderBy: { views: "desc" },
    take: limit,
  });
  return analytics;
}

export async function getPerformanceOverTime(workspaceId: string) {
  const analytics = await prisma.analytics.findMany({
    where: { contentItem: { workspaceId } },
    orderBy: { recordedAt: "asc" },
  });
  return analytics;
}

export async function getWeeklyProduction(workspaceId: string) {
  const items = await prisma.contentItem.findMany({
    where: { workspaceId },
    select: { platform: true, createdAt: true },
  });

  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const buckets: Record<string, Record<string, number>> = {};
  for (const day of days) {
    buckets[day] = {};
  }

  for (const item of items) {
    const jsDay = item.createdAt.getDay(); // 0 = Sonntag
    const label = days[(jsDay + 6) % 7];
    buckets[label][item.platform] = (buckets[label][item.platform] ?? 0) + 1;
  }

  return days.map((day) => ({ day, ...buckets[day] }));
}
