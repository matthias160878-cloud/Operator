import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/auth/session";
import { route } from "@/lib/api";
import { prisma } from "@/lib/db";

/**
 * Kündigung als bearbeitet markieren (oder zurücksetzen) — nur Betreiber
 * (Proxy sperrt /api/operator zusätzlich). Ändert nichts in Stripe.
 */
const schema = z.object({ id: z.string().min(1).max(40), bearbeitet: z.boolean() });

async function handlePATCH(request: Request) {
  const user = await requireSessionUser();
  if (!user.isOperator) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  const r = await prisma.kuendigung.updateMany({
    where: { id: parsed.data.id },
    data: { bearbeitetAm: parsed.data.bearbeitet ? new Date() : null },
  });
  if (r.count === 0) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export const PATCH = route(handlePATCH);
