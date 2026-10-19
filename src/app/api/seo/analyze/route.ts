import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { analyzeWebsite } from "@/lib/agents/seoAgent";

const bodySchema = z.object({
  url: z.string().trim().url("Bitte eine vollständige URL mit https:// angeben."),
  focusKeyword: z.string().trim().max(100).optional(),
  includePageSpeed: z.boolean().default(false),
  strategy: z.enum(["mobile", "desktop"]).default("mobile"),
});

export const maxDuration = 120;

/** SEO-, Technik-, Performance- und Social-Vorschau-Analyse einer URL (SeoAgent). */
export async function POST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }
  const { focusKeyword, ...rest } = parsed.data;

  try {
    const report = await runAgent("seo", workspaceId, `SEO-Analyse ${rest.url}`, () =>
      analyzeWebsite({ ...rest, focusKeyword: focusKeyword || undefined })
    );
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analyse fehlgeschlagen." },
      { status: 422 }
    );
  }
}
