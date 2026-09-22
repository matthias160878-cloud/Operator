import { NextResponse } from "next/server";
import { z } from "zod";
import type { Platform } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getBrandDNA } from "@/lib/brand";
import { runAgent } from "@/lib/agents/runner";
import { generateHooks } from "@/lib/agents/hookAgent";
import { generateScript } from "@/lib/agents/scriptAgent";
import { generateHashtags } from "@/lib/agents/hashtagAgent";

const PLATFORM_VALUES = [
  "YOUTUBE",
  "TIKTOK",
  "INSTAGRAM",
  "LINKEDIN",
  "FACEBOOK",
  "BLOG",
  "NEWSLETTER",
] as const;

const bodySchema = z.object({
  targets: z.array(z.enum(PLATFORM_VALUES)).min(1),
});

const PLATFORM_FORMAT: Partial<Record<Platform, string>> = {
  YOUTUBE: "Short",
  TIKTOK: "Short",
  INSTAGRAM: "Reel",
  LINKEDIN: "Post",
  FACEBOOK: "Post",
  BLOG: "Artikel",
  NEWSLETTER: "Newsletter",
};

/**
 * Content Repurposing (Abschnitt 33): aus einem bestehenden Content-Item
 * (z.B. einem YouTube-Video) werden für die gewählten Zielplattformen neue,
 * plattformgerechte Entwürfe erzeugt — nicht derselbe Text kopiert.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  const source = await prisma.contentItem.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const brand = await getBrandDNA(workspaceId);
  const topic = source.title;

  const created = await runAgent(
    "content-brain",
    workspaceId,
    `Repurpose "${source.title}" für ${parsed.data.targets.length} Plattform(en)`,
    async () => {
      const items = [];
      for (const platform of parsed.data.targets) {
        const [{ hooks }, { result: hashtagResult }] = await Promise.all([
          generateHooks({ topic, platform, brand }),
          generateHashtags({ topic, platform, brand }),
        ]);
        const { script } = await generateScript({
          topic,
          platform,
          hook: hooks[0]?.text,
          brand,
        });

        const item = await prisma.contentItem.create({
          data: {
            workspaceId,
            campaignId: source.campaignId,
            title: `${source.title} — ${PLATFORM_FORMAT[platform] ?? "Repurposed"}`,
            platform,
            format: PLATFORM_FORMAT[platform] ?? "Content",
            status: "DRAFT",
            hook: hooks[0]?.text ?? "",
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
            language: source.language,
          },
        });
        items.push(item);
      }
      return items;
    }
  );

  return NextResponse.json({ items: created });
}
