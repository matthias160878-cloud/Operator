import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/auth/session";
import { route } from "@/lib/api";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { PromoError, redeemPromoCode } from "@/lib/promoCodes";

/** Promocode einlösen — für den eigenen Arbeitsbereich (Sitzung), begrenzt gegen Durchprobieren. */
const schema = z.object({ code: z.string().min(1).max(60) });

async function handlePOST(request: Request) {
  const user = await requireSessionUser();
  if (!(await hitRateLimit(`promo:${clientIp(request)}`, 10, 3600)) || !(await hitRateLimit(`promo:ws:${user.workspaceId}`, 10, 3600))) {
    return NextResponse.json({ error: "Zu viele Versuche. Bitte später erneut versuchen." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte einen Promocode eingeben." }, { status: 400 });
  try {
    const result = await redeemPromoCode({ code: parsed.data.code, workspaceId: user.workspaceId, userId: user.userId });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof PromoError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export const POST = route(handlePOST);
