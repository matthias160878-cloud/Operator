import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession, isPackagePriceConfigured } from "@/lib/stripe";
import { getSessionUser } from "@/lib/auth";
import { PACKAGE_IDS } from "@/lib/packages";

const bodySchema = z.object({
  packageId: z.enum(PACKAGE_IDS as [string, ...string[]]),
  includeSetupService: z.boolean().optional(),
});

export async function POST(request: Request) {
  // Ein Kauf muss einem Konto zugeordnet werden können, damit genau der
  // richtige (private) Workspace freigeschaltet wird — deshalb hier eine
  // echte Session verlangen, statt anonym zu kaufen. Die /buy-Seite selbst
  // bleibt ohne Anmeldung sichtbar.
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Bitte zuerst anmelden oder registrieren.", code: "LOGIN_REQUIRED" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiges Paket." }, { status: 400 });
  }
  const packageId = parsed.data.packageId as "pro" | "maxi";

  if (!isPackagePriceConfigured(packageId)) {
    return NextResponse.json(
      { error: `Stripe ist für dieses Paket noch nicht konfiguriert.` },
      { status: 503 },
    );
  }

  try {
    const origin = new URL(request.url).origin;
    const url = await createCheckoutSession({
      packageId,
      successUrl: `${origin}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/buy`,
      includeSetupService: parsed.data.includeSetupService === true,
      userId: user.id,
    });
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout fehlgeschlagen." },
      { status: 500 },
    );
  }
}
