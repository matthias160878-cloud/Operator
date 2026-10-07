import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ownedIdea } from "@/lib/ownership";
import { route } from "@/lib/api";

const patchSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "USED", "ARCHIVED"]),
});

async function handlePATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  await ownedIdea(id);
  const idea = await prisma.contentIdea.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ idea });
}

async function handleDELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await ownedIdea(id);
  await prisma.contentIdea.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const PATCH = route(handlePATCH);
export const DELETE = route(handleDELETE);
