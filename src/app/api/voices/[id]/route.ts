import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ownedVoice } from "@/lib/ownership";
import { route } from "@/lib/api";

const patchSchema = z.object({
  active: z.boolean().optional(),
  name: z.string().optional(),
  style: z.string().optional(),
  description: z.string().optional(),
});

async function handlePATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  await ownedVoice(id);
  const voice = await prisma.voice.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ voice });
}

async function handleDELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await ownedVoice(id);
  await prisma.voice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const PATCH = route(handlePATCH);
export const DELETE = route(handleDELETE);
