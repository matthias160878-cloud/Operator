import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";

const createSchema = z.object({
  title: z.string().min(1),
  hook: z.string().default(""),
  targetAudience: z.string().default(""),
  platform: z.string().default(""),
  format: z.string().default(""),
  goal: z.string().default(""),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  estimatedMinutes: z.number().int().min(1).default(30),
});

export async function GET() {
  const workspaceId = await getCurrentWorkspaceId();
  const ideas = await prisma.contentIdea.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ ideas });
}

export async function POST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }
  const idea = await prisma.contentIdea.create({
    data: { workspaceId, source: "MANUAL", ...parsed.data },
  });
  return NextResponse.json({ idea });
}
