import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getBrandDNA } from "@/lib/brand";
import { runAgent } from "@/lib/agents/runner";
import { generateHooks } from "@/lib/agents/hookAgent";
import { generateScript } from "@/lib/agents/scriptAgent";

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
  topic: z.string().min(3),
  platform: z.enum(PLATFORM_VALUES),
});

export async function POST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }

  const brand = await getBrandDNA(workspaceId);
  const { topic, platform } = parsed.data;

  const result = await runAgent("script", workspaceId, `Script + Hooks für "${topic}"`, async () => {
    const { hooks } = await generateHooks({ topic, platform, brand });
    const { script, provider } = await generateScript({
      topic,
      platform,
      hook: hooks[0]?.text,
      brand,
    });
    return { hooks, script, provider };
  });

  return NextResponse.json(result);
}
