import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth/session";
import { CheckoutRefused, createPortalSession } from "@/lib/stripe";
import { route } from "@/lib/api";

async function handlePOST(request: Request) {
  const user = await requireSessionUser();
  try {
    const url = await createPortalSession(user.workspaceId, `${new URL(request.url).origin}/billing`);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof CheckoutRefused) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

export const POST = route(handlePOST);
