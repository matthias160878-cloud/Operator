import { NextResponse } from "next/server";
import { isLocale, LOCALE_COOKIE_NAME } from "@/i18n/config";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const locale = body?.locale;

  if (typeof locale !== "string" || !isLocale(locale)) {
    return NextResponse.json({ error: "Ungültige Sprache." }, { status: 400 });
  }

  const response = NextResponse.json({ locale });
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
