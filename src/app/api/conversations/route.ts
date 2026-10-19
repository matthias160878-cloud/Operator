import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";

const PLATFORM_VALUES = [
  "YOUTUBE",
  "TIKTOK",
  "INSTAGRAM",
  "LINKEDIN",
  "FACEBOOK",
] as const;

const createSchema = z.object({
  platform: z.enum(PLATFORM_VALUES),
  participantName: z.string().min(1),
  participantHandle: z.string().default(""),
  channel: z.enum(["COMMENT", "DIRECT_MESSAGE"]).default("COMMENT"),
  externalThreadId: z.string().trim().max(500).optional(),
  initialMessage: z.string().min(1),
});

export async function GET() {
  const workspaceId = await getCurrentWorkspaceId();
  const conversations = await prisma.conversation.findMany({
    where: { workspaceId },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { lastMessageAt: "desc" },
  });
  return NextResponse.json({ conversations });
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

  const conversation = await prisma.conversation.create({
    data: {
      workspaceId,
      platform: parsed.data.platform,
      participantName: parsed.data.participantName,
      participantHandle: parsed.data.participantHandle,
      channel: parsed.data.channel,
      externalThreadId: parsed.data.externalThreadId || null,
      messages: {
        create: {
          direction: "INBOUND",
          body: parsed.data.initialMessage,
          status: "RECEIVED",
        },
      },
    },
    include: { messages: true },
  });

  return NextResponse.json({ conversation });
}
