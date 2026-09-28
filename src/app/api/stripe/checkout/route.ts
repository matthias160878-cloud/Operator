import { NextResponse } from "next/server";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe ist noch nicht konfiguriert (STRIPE_SECRET_KEY/STRIPE_PRICE_ID fehlt)." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { includeSetupService?: unknown };
    const origin = new URL(request.url).origin;
    const url = await createCheckoutSession({
      successUrl: `${origin}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/buy`,
      includeSetupService: body.includeSetupService === true,
    });
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout fehlgeschlagen." },
      { status: 500 },
    );
  }
}
