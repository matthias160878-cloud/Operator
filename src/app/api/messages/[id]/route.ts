import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const patchSchema = z.object({ body: z.string().min(1) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  const message = await prisma.message.update({ where: { id }, data: { body: parsed.data.body } });
  return NextResponse.json({ message });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.message.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
