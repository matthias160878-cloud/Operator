import { prisma } from "@/lib/db";

export interface LearningRecommendation {
  title: string;
  detail: string;
}

/**
 * LearningAgent — leitet Empfehlungen ausschließlich aus tatsächlich
 * vorhandenen Analytics-Daten ab (Abschnitt 19). Erzeugt NUR Empfehlungen,
 * verändert nie automatisch Account-Einstellungen.
 */
export async function getRecommendations(
  workspaceId: string
): Promise<LearningRecommendation[]> {
  const analytics = await prisma.analytics.findMany({
    where: { contentItem: { workspaceId } },
    include: { contentItem: true },
  });

  if (analytics.length === 0) {
    return [
      {
        title: "Noch keine Empfehlungen möglich",
        detail:
          "Sobald veröffentlichte Inhalte Analytics-Daten sammeln, leitet der LearningAgent hier Empfehlungen ab.",
      },
    ];
  }

  const byPlatform = new Map<string, { count: number; engagementSum: number }>();
  for (const a of analytics) {
    const entry = byPlatform.get(a.platform) ?? { count: 0, engagementSum: 0 };
    entry.count += 1;
    entry.engagementSum += a.engagementRate;
    byPlatform.set(a.platform, entry);
  }

  const overallAvg =
    analytics.reduce((sum, a) => sum + a.engagementRate, 0) / analytics.length;

  const recommendations: LearningRecommendation[] = [];

  for (const [platform, stats] of byPlatform.entries()) {
    const avg = stats.engagementSum / stats.count;
    if (avg > overallAvg * 1.15) {
      recommendations.push({
        title: `${platform}: überdurchschnittliches Engagement`,
        detail: `Content auf ${platform} erzielt im Schnitt ${avg.toFixed(1)}% Engagement (Workspace-Schnitt: ${overallAvg.toFixed(1)}%). Produktion auf ${platform} priorisieren.`,
      });
    } else if (avg < overallAvg * 0.85) {
      recommendations.push({
        title: `${platform}: unterdurchschnittliches Engagement`,
        detail: `Content auf ${platform} liegt mit ${avg.toFixed(1)}% Engagement unter dem Workspace-Schnitt von ${overallAvg.toFixed(1)}%. Format oder Hook-Strategie überprüfen.`,
      });
    }
  }

  const topContent = [...analytics].sort((a, b) => b.views - a.views)[0];
  if (topContent) {
    recommendations.push({
      title: `Bestperformer: "${topContent.contentItem.title}"`,
      detail: `${topContent.views.toLocaleString("de-DE")} Views auf ${topContent.platform} — Format und Hook als Vorlage für kommende Inhalte nutzen.`,
    });
  }

  return recommendations.length > 0
    ? recommendations
    : [
        {
          title: "Ausgewogene Performance",
          detail: "Keine Plattform sticht aktuell signifikant heraus — weiter breit testen.",
        },
      ];
}
