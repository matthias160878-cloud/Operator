import { NextResponse } from "next/server";

/**
 * Retired zusammen mit /api/stripe/checkout (siehe dort) --- kein Pfad
 * führt hierher mehr, ein Aufruf mit altem/erfundenem session_id landet
 * einfach zurück bei /buy, ohne irgendeine Lizenz zu berühren.
 */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/buy", request.url));
}
