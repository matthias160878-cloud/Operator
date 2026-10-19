import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json({ conversation });
}

const patchSchema = z.object({
  channel: z.enum(["COMMENT", "DIRECT_MESSAGE"]).optional(),
  externalThreadId: z.string().trim().max(500).nullable().optional(),
  externalObjectId: z.string().trim().max(500).nullable().optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
});

/** Plattform-ID/Kanal nachtragen (z. B. LinkedIn-Kommentar-URN) oder Konversation schließen. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  const existing = await prisma.conversation.findFirst({ where: { id, workspaceId } });
  if (!existing) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const { externalThreadId, externalObjectId, ...rest } = parsed.data;
  const conversation = await prisma.conversation.update({
    where: { id },
    data: {
      ...rest,
      ...(externalThreadId !== undefined ? { externalThreadId: externalThreadId || null } : {}),
      ...(externalObjectId !== undefined ? { externalObjectId: externalObjectId || null } : {}),
    },
  });
  return NextResponse.json({ conversation });
}
