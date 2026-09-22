import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { createCampaignFromIdea } from "@/lib/agents/contentBrainAgent";

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
  topic: z.string().min(3, "Bitte gib ein Thema mit mindestens 3 Zeichen ein."),
  targetAudience: z.string().default(""),
  goal: z.string().default(""),
  platforms: z.array(z.enum(PLATFORM_VALUES)).min(1, "Wähle mindestens eine Plattform."),
  language: z.string().default("Deutsch"),
  itemsPerPlatform: z.number().int().min(1).max(5).default(1),
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

  const input = parsed.data;

  try {
    const result = await runAgent(
      "content-brain",
      workspaceId,
      `Content-Plan für "${input.topic}"`,
      () => createCampaignFromIdea({ workspaceId, ...input })
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler." },
      { status: 500 }
    );
  }
}
