import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ownedMessage } from "@/lib/ownership";
import { route } from "@/lib/api";

const patchSchema = z.object({ body: z.string().min(1) });

async function handlePATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  await ownedMessage(id);
  const message = await prisma.message.update({ where: { id }, data: { body: parsed.data.body } });
  return NextResponse.json({ message });
}

async function handleDELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await ownedMessage(id);
  await prisma.message.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const PATCH = route(handlePATCH);
export const DELETE = route(handleDELETE);
