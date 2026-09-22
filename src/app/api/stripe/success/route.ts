import { NextResponse } from "next/server";
import { retrieveCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { activateLicenseFromSession, ACCESS_COOKIE_NAME } from "@/lib/license";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!isStripeConfigured() || !sessionId) {
    return NextResponse.redirect(new URL("/buy", request.url));
  }

  try {
    const session = await retrieveCheckoutSession(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.redirect(new URL("/buy", request.url));
    }

    const license = await activateLicenseFromSession(session);

    const response = NextResponse.redirect(new URL("/schulung?willkommen=1", request.url));
    response.cookies.set(ACCESS_COOKIE_NAME, license.unlockToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/buy", request.url));
  }
}
