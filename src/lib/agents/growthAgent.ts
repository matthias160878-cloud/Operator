import { prisma } from "@/lib/db";
import type { Platform } from "@prisma/client";

export interface PostingTimeStat {
  dayOfWeek: string;
  hour: number;
  avgEngagement: number;
  sampleSize: number;
}

export interface HashtagStat {
  tag: string;
  count: number;
  avgEngagement: number;
}

export interface FormatStat {
  format: string;
  avgEngagement: number;
  sampleSize: number;
}

export interface GrowthRecommendations {
  platform: Platform | "ALLE";
  bestPostingTimes: PostingTimeStat[];
  topHashtags: HashtagStat[];
  topFormats: FormatStat[];
  sampleSize: number;
}

const WEEKDAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function parseHashtags(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * GrowthAgent — leitet Wachstumsempfehlungen ausschließlich aus tatsächlich
 * vorhandenen Analytics-Daten des eigenen Contents ab (beste Posting-Zeit,
 * erfolgreichste Hashtags/Formate). Er automatisiert NICHTS auf den
 * Plattformen selbst (kein Auto-Follow/-Like/-Comment) — solche Bots
 * verstoßen bei allen gängigen Plattformen gegen die Nutzungsbedingungen
 * und würden das Konto gefährden statt es wachsen zu lassen.
 */
export async function getGrowthRecommendations(
  workspaceId: string,
  platform?: Platform
): Promise<GrowthRecommendations> {
  const analytics = await prisma.analytics.findMany({
    where: {
      contentItem: { workspaceId },
      ...(platform ? { platform } : {}),
    },
    include: { contentItem: true },
  });

  if (analytics.length === 0) {
    return {
      platform: platform ?? "ALLE",
      bestPostingTimes: [],
      topHashtags: [],
      topFormats: [],
      sampleSize: 0,
    };
  }

  // Beste Posting-Zeit: gruppiert nach Wochentag + Stunde des Veröffentlichungsdatums.
  const timeBuckets = new Map<string, { sum: number; count: number; dayOfWeek: string; hour: number }>();
  for (const a of analytics) {
    const postedAt = a.contentItem.publishedAt ?? a.contentItem.scheduledAt ?? a.contentItem.createdAt;
    const dayOfWeek = WEEKDAY_LABELS[postedAt.getDay()];
    const hour = postedAt.getHours();
    const key = `${dayOfWeek}-${hour}`;
    const entry = timeBuckets.get(key) ?? { sum: 0, count: 0, dayOfWeek, hour };
    entry.sum += a.engagementRate;
    entry.count += 1;
    timeBuckets.set(key, entry);
  }
  const bestPostingTimes = Array.from(timeBuckets.values())
    .map((e) => ({ dayOfWeek: e.dayOfWeek, hour: e.hour, avgEngagement: e.sum / e.count, sampleSize: e.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 5);

  // Top-Hashtags: gewichtet nach Engagement der Content-Items, die sie nutzen.
  const hashtagBuckets = new Map<string, { sum: number; count: number }>();
  for (const a of analytics) {
    const tags = parseHashtags(a.contentItem.hashtags);
    for (const tag of tags) {
      const entry = hashtagBuckets.get(tag) ?? { sum: 0, count: 0 };
      entry.sum += a.engagementRate;
      entry.count += 1;
      hashtagBuckets.set(tag, entry);
    }
  }
  const topHashtags = Array.from(hashtagBuckets.entries())
    .map(([tag, e]) => ({ tag, count: e.count, avgEngagement: e.sum / e.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 10);

  // Top-Formate.
  const formatBuckets = new Map<string, { sum: number; count: number }>();
  for (const a of analytics) {
    const format = a.contentItem.format || "Unbekannt";
    const entry = formatBuckets.get(format) ?? { sum: 0, count: 0 };
    entry.sum += a.engagementRate;
    entry.count += 1;
    formatBuckets.set(format, entry);
  }
  const topFormats = Array.from(formatBuckets.entries())
    .map(([format, e]) => ({ format, avgEngagement: e.sum / e.count, sampleSize: e.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  return {
    platform: platform ?? "ALLE",
    bestPostingTimes,
    topHashtags,
    topFormats,
    sampleSize: analytics.length,
  };
}
