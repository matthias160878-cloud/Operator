import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { route } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(1),
  providerVoiceId: z.string().min(1),
  language: z.string().default("de"),
  style: z.string().default(""),
  description: z.string().default(""),
});

async function handleGET() {
  const workspaceId = await getCurrentWorkspaceId();
  const voices = await prisma.voice.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ voices });
}

async function handlePOST(request: Request) {
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

export const GET = route(handleGET);
export const POST = route(handlePOST);
