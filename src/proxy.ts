import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ACCESS_COOKIE_NAME } from "@/lib/license";

/**
 * Zugriffsschutz für die komplette Anwendung (Abschnitt "Lizenzierung").
 *
 * Läuft NUR, wenn `OWNER_ACCESS_KEY` gesetzt ist — ohne diese Variable
 * bleibt die App wie bisher frei zugänglich (wichtig für lokale
 * Entwicklung und damit ein frischer Checkout ohne Setup startfähig
 * bleibt). Sobald `OWNER_ACCESS_KEY` gesetzt ist, wird jede Seite außer
 * der Verkaufsseite/den Stripe-Routen gesperrt, bis entweder
 *  - der Betreiber über /unlock?key=<OWNER_ACCESS_KEY> freigeschaltet hat, oder
 *  - ein Besucher über Stripe bezahlt hat (License-Datensatz mit Status ACTIVE).
 */
const PUBLIC_PREFIXES = [
  "/buy",
  "/unlock",
  "/api/stripe",
  "/api/locale",
  "/_next",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons",
  "/brand",
  "/media",
  "/robots.txt",
];

export async function proxy(request: NextRequest) {
  if (!process.env.OWNER_ACCESS_KEY) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (cookie) {
    if (cookie === `owner:${process.env.OWNER_ACCESS_KEY}`) {
      return NextResponse.next();
    }
    if (!cookie.startsWith("owner:")) {
      const license = await prisma.license.findUnique({ where: { unlockToken: cookie } });
      if (license && license.status === "ACTIVE") {
        return NextResponse.next();
      }
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = "/buy";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
