import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/auth/session";
import { route } from "@/lib/api";
import { createPromoCodes, listPromoCodes, PromoError } from "@/lib/promoCodes";

/** Promocodes anlegen und auflisten — nur Betreiber (Proxy sperrt /api/operator zusätzlich). */
const schema = z.object({
  plan: z.string().min(1).max(10),
  anzahl: z.number().int().min(1).max(20).default(1),
  label: z.string().max(80).default(""),
});

async function handleGET() {
  const user = await requireSessionUser();
  if (!user.isOperator) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json({ codes: await listPromoCodes() });
}

async function handlePOST(request: Request) {
  const user = await requireSessionUser();
  if (!user.isOperator) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  try {
    const result = await createPromoCodes({ ...parsed.data, createdById: user.userId });
    // Klartext nur in dieser Antwort — danach nur noch Hash + Endung.
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof PromoError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export const GET = route(handleGET);
export const POST = route(handlePOST);
