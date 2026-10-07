import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { NotFoundError, route } from "@/lib/api";

const schema = z.object({ active: z.boolean() });

async function owned(id: string) {
  const workspaceId = await getCurrentWorkspaceId();
  const product = await prisma.merchantProduct.findFirst({ where: { id, workspaceId } });
  if (!product) throw new NotFoundError();
  return product;
}

async function handlePATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await owned(id);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  const product = await prisma.merchantProduct.update({ where: { id }, data: { active: parsed.data.active } });
  return NextResponse.json({ product });
}

async function handleDELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await owned(id);
  await prisma.merchantProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const PATCH = route(handlePATCH);
export const DELETE = route(handleDELETE);
