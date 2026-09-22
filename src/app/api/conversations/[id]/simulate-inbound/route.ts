import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const bodySchema = z.object({ body: z.string().min(1) });

/**
 * Fügt eine eingehende Nachricht manuell hinzu — es existiert keine echte
 * Plattform-Anbindung, über die Nachrichten tatsächlich eintreffen könnten.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { conversationId: id, direction: "INBOUND", body: parsed.data.body, status: "RECEIVED" },
  });

  await prisma.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date(), status: "OPEN" },
  });

  return NextResponse.json({ message });
}
