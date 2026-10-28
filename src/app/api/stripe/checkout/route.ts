import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/auth/session";
import { CheckoutRefused, createPlanCheckout } from "@/lib/stripe";
import { parseBillingInterval, parsePlanKey } from "@/lib/plans";
import { route } from "@/lib/api";

const schema = z.object({
  plan: z.string(),
  interval: z.string().optional(),
  // Der Kunde muss den Kauf selbst bestätigen — Genesis/Sprachsteuerung setzt das nie.
  confirmed: z.literal(true),
});

async function handlePOST(request: Request) {
  const user = await requireSessionUser();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  const plan = parsePlanKey(parsed.success ? parsed.data.plan : null);
  const interval = parseBillingInterval(parsed.success ? parsed.data.interval : null);
  if (!parsed.success || !plan || !interval) {
    return NextResponse.json({ error: "Bitte Paket wählen und den Kauf ausdrücklich bestätigen." }, { status: 400 });
  }
  try {
    const url = await createPlanCheckout({
      workspaceId: user.workspaceId,
      userId: user.userId,
      email: user.email,
      plan,
      interval,
      origin: new URL(request.url).origin,
    });
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof CheckoutRefused) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export const POST = route(handlePOST);
