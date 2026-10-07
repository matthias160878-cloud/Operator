import { NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { isConnectConfigured, refreshMerchantStatus } from "@/lib/connect/merchant";
import { route } from "@/lib/api";

async function handlePOST() {
  const workspaceId = await getCurrentWorkspaceId();
  if (!isConnectConfigured()) return NextResponse.json({ error: "Nicht eingerichtet." }, { status: 503 });
  const merchant = await refreshMerchantStatus(workspaceId);
  return NextResponse.json({
    merchant: merchant && {
      chargesEnabled: merchant.chargesEnabled,
      payoutsEnabled: merchant.payoutsEnabled,
      detailsSubmitted: merchant.detailsSubmitted,
    },
  });
}

export const POST = route(handlePOST);
