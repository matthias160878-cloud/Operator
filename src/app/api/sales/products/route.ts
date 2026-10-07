import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { route } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).default(""),
  // Betrag in kleinster Währungseinheit (Cent), serverseitig gespeichert.
  amount: z.number().int().min(50).max(99_999_999),
  currency: z.enum(["eur", "usd", "chf", "gbp"]).default("eur"),
});

async function handleGET() {
  const workspaceId = await getCurrentWorkspaceId();
  const products = await prisma.merchantProduct.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ products });
}

async function handlePOST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Produktangaben." }, { status: 400 });
  const count = await prisma.merchantProduct.count({ where: { workspaceId } });
  if (count >= 200) return NextResponse.json({ error: "Maximal 200 Produkte." }, { status: 400 });
  const product = await prisma.merchantProduct.create({ data: { workspaceId, ...parsed.data } });
  return NextResponse.json({ product });
}

export const GET = route(handleGET);
export const POST = route(handlePOST);
