import { prisma } from "@/lib/db";
import type { Platform } from "@prisma/client";
import { getBrandDNA } from "@/lib/brand";
import { generateHooks } from "@/lib/agents/hookAgent";
import { generateScript } from "@/lib/agents/scriptAgent";
import { generateHashtags } from "@/lib/agents/hashtagAgent";
import { generateThumbnailConcept } from "@/lib/agents/thumbnailAgent";

export interface ContentBrainInput {
  workspaceId: string;
  topic: string;
  targetAudience: string;
  goal: string;
  platforms: Platform[];
  language: string;
  itemsPerPlatform?: number;
}

export interface ContentBrainOutput {
  campaignId: string;
  contentItemIds: string[];
  provider: string;
}

const PLATFORM_FORMAT: Partial<Record<Platform, string>> = {
  YOUTUBE: "Video",
  TIKTOK: "Short",
  INSTAGRAM: "Reel",
  LINKEDIN: "Post",
  FACEBOOK: "Post",
  BLOG: "Artikel",
  NEWSLETTER: "Newsletter",
};

/**
 * ContentBrainAgent — Herzstück von SECRET 58 (Abschnitt 4). Aus einer
 * einzigen Idee entsteht ein Kampagnenentwurf mit plattformgerechten
 * Content-Items (Hook, Script, Hashtags, Thumbnail-Konzept). Der Nutzer
 * behält die volle Kontrolle: alles landet zunächst als DRAFT und muss aktiv
 * durch den Review-/Approval-Workflow (Abschnitt 16/34).
 */
export async function createCampaignFromIdea(
  input: ContentBrainInput
): Promise<ContentBrainOutput> {
  const brand = await getBrandDNA(input.workspaceId);
  const itemsPerPlatform = Math.min(Math.max(input.itemsPerPlatform ?? 1, 1), 5);

  const campaign = await prisma.campaign.create({
    data: {
      workspaceId: input.workspaceId,
      title: input.topic,
      goal: input.goal,
      targetAudience: input.targetAudience,
      platforms: JSON.stringify(input.platforms),
      language: input.language,
      status: "DRAFT",
    },
  });

  const providers = new Set<string>();
  const contentItemIds: string[] = [];

  for (const platform of input.platforms) {
    for (let i = 0; i < itemsPerPlatform; i++) {
      const [{ hooks, provider: p1 }, { result: hashtagResult, provider: p2 }] =
        await Promise.all([
          generateHooks({ topic: input.topic, platform, brand }),
          generateHashtags({ topic: input.topic, platform, brand }),
        ]);
      const chosenHook = hooks[i % hooks.length]?.text ?? hooks[0]?.text ?? input.topic;

      const [{ script, provider: p3 }, { concept, provider: p4 }] = await Promise.all([
        generateScript({ topic: input.topic, platform, hook: chosenHook, brand }),
        generateThumbnailConcept({ topic: input.topic, brand }),
      ]);

      [p1, p2, p3, p4].forEach((p) => providers.add(p));

      const contentItem = await prisma.contentItem.create({
        data: {
          workspaceId: input.workspaceId,
          campaignId: campaign.id,
          title: `${input.topic} — ${PLATFORM_FORMAT[platform] ?? "Content"} ${itemsPerPlatform > 1 ? i + 1 : ""}`.trim(),
          platform,
          format: PLATFORM_FORMAT[platform] ?? "Content",
          status: "DRAFT",
          hook: chosenHook,
          script: [
            `HOOK: ${script.hook}`,
            `PROBLEM: ${script.problem}`,
            `VALUE: ${script.value}`,
            `EXAMPLE: ${script.example}`,
            `PAYOFF: ${script.payoff}`,
            `CTA: ${script.cta}`,
          ].join("\n\n"),
          hashtags: JSON.stringify(hashtagResult.hashtags),
          keywords: JSON.stringify(hashtagResult.keywords),
          language: input.language,
          thumbnailIdea: `${concept.title} — ${concept.visualIdea}`,
        },
      });

      await prisma.script.create({
        data: {
          contentItemId: contentItem.id,
          variantLabel: "A",
          hook: script.hook,
          problem: script.problem,
          value: script.value,
          example: script.example,
          payoff: script.payoff,
          cta: script.cta,
        },
      });

      contentItemIds.push(contentItem.id);
    }
  }

  return {
    campaignId: campaign.id,
    contentItemIds,
    provider: providers.has("anthropic")
      ? "anthropic"
      : providers.has("openai")
        ? "openai"
        : "template",
  };
}
