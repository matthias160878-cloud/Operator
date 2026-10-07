import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/session";
import { createOnboardingLink, isConnectConfigured } from "@/lib/connect/merchant";
import { route } from "@/lib/api";

/** Startet/fortsetzt das Händler-Onboarding bei Stripe — nur für das eigene Konto des Workspaces. */
async function handlePOST(request: Request) {
  const user = await requireSessionUser();
  if (!isConnectConfigured()) {
    return NextResponse.json({ error: "Der Verkaufsbereich ist vom Betreiber noch nicht eingerichtet." }, { status: 503 });
  }
  const url = await createOnboardingLink(user.workspaceId, user.email, new URL(request.url).origin);
  return NextResponse.json({ url });
}

export const POST = route(handlePOST);
