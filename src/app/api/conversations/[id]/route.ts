import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ownedConversation } from "@/lib/ownership";
import { route } from "@/lib/api";

async function handleGET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await ownedConversation(id);
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json({ conversation });
}

export const GET = route(handleGET);
