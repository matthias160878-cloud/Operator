import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME } from "@/lib/license";

/**
 * Betreiber-Zugang: /unlock?key=<OWNER_ACCESS_KEY> setzt einen dauerhaften
 * Freischalt-Cookie, unabhängig von einem Stripe-Kauf. Ohne gesetztes
 * OWNER_ACCESS_KEY (oder falschen Key) passiert nichts.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const target = new URL("/", request.url);

  if (!process.env.OWNER_ACCESS_KEY || key !== process.env.OWNER_ACCESS_KEY) {
    return NextResponse.redirect(new URL("/buy", request.url));
  }

  const response = NextResponse.redirect(target);
  response.cookies.set(ACCESS_COOKIE_NAME, `owner:${process.env.OWNER_ACCESS_KEY}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
