import { hitRateLimit } from "@/lib/rateLimit";
import { currentTextProvider } from "@/lib/ai/textGenerator";

/**
 * KI auf der öffentlichen Startseite (Chat, Skill-Anfrage) kostet bei jedem
 * Besucher Geld. Deshalb nur mit ausdrücklicher Freigabe des Betreibers
 * (WEBSITE_KI=true) und mit einem Tageslimit über alle Besucher
 * (WEBSITE_KI_TAGESLIMIT, Standard 200 Antworten/Tag).
 */
export function websiteAiEnabled(): boolean {
  return process.env.WEBSITE_KI === "true" && currentTextProvider() !== "template";
}

export async function websiteAiBudgetAvailable(): Promise<boolean> {
  const limit = Number(process.env.WEBSITE_KI_TAGESLIMIT ?? 200);
  return hitRateLimit("website-ki:tag", Number.isFinite(limit) && limit > 0 ? limit : 200, 86400);
}
