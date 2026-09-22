import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getBrandDNA } from "@/lib/brand";
import { runAgent } from "@/lib/agents/runner";
import { generateIdeas } from "@/lib/agents/ideaAgent";

const bodySchema = z.object({
  topic: z.string().min(3),
  count: z.number().int().min(1).max(10).default(5),
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

  try {
    const { ideas, provider } = await runAgent(
      "idea",
      workspaceId,
      `Ideen zu "${parsed.data.topic}"`,
      () => generateIdeas({ topic: parsed.data.topic, count: parsed.data.count, brand })
    );

    const created = await prisma.$transaction(
      ideas.map((idea) =>
        prisma.contentIdea.create({
          data: {
            workspaceId,
            source: "IDEA_AGENT",
            title: idea.title,
            hook: idea.hook,
            targetAudience: idea.targetAudience,
            platform: idea.platform,
            format: idea.format,
            goal: idea.goal,
            priority: idea.priority,
            estimatedMinutes: idea.estimatedMinutes,
          },
        })
      )
    );

    return NextResponse.json({ ideas: created, provider });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler." },
      { status: 500 }
    );
  }
}
