import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "USED", "ARCHIVED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  const idea = await prisma.contentIdea.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ idea });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.contentIdea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
