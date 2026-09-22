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
