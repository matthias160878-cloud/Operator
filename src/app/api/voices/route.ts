import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";

const createSchema = z.object({
  name: z.string().min(1),
  providerVoiceId: z.string().min(1),
  language: z.string().default("de"),
  style: z.string().default(""),
  description: z.string().default(""),
});

export async function GET() {
  const workspaceId = await getCurrentWorkspaceId();
  const voices = await prisma.voice.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ voices });
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
  const voice = await prisma.voice.create({ data: { workspaceId, ...parsed.data } });
  return NextResponse.json({ voice });
}
