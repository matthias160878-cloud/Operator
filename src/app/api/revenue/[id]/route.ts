import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ownedRevenueEntry } from "@/lib/ownership";
import { route } from "@/lib/api";

const patchSchema = z.object({
  status: z.enum(["PENDING", "RECEIVED"]).optional(),
  amount: z.number().optional(),
  source: z.string().optional(),
  note: z.string().optional(),
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
  await ownedRevenueEntry(id);
  const entry = await prisma.revenueEntry.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ entry });
}

async function handleDELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await ownedRevenueEntry(id);
  await prisma.revenueEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const PATCH = route(handlePATCH);
export const DELETE = route(handleDELETE);
