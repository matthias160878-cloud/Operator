import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ACCESS_COOKIE_NAME } from "@/lib/license";
import { SESSION_COOKIE_NAME, resolveSessionToken } from "@/lib/auth";

/**
 * Zugriffsschutz für die komplette Anwendung, zweistufig:
 *
 * 1. Authentifizierung (immer aktiv, unabhängig von OWNER_ACCESS_KEY):
 *    Jede Seite/API außer den unten gelisteten öffentlichen Pfaden verlangt
 *    eine gültige Session (`s58_session`-Cookie -> `Session`-Zeile in der
 *    DB -> `User.workspaceId`). Es gibt keinen Fallback auf einen geteilten
 *    Default-Workspace mehr — ohne Session gibt es keinen Zugriff auf private
 *    Kundendaten (Abschnitt 2 des Auftrags: Berechtigung aus der
 *    authentifizierten Sitzung ableiten, nie aus einer Client-Workspace-ID).
 *
 * 2. Bezahlschranke (nur aktiv, wenn OWNER_ACCESS_KEY gesetzt ist, wie
 *    bisher): zusätzlich zur Session muss entweder das Betreiber-Cookie
 *    gesetzt sein oder eine ACTIVE License für genau den Workspace der
 *    aktuellen Session existieren.
 *
 * `/operator/**` ist ein komplett getrennter Bereich: nur per
 * OWNER_ACCESS_KEY erreichbar, unabhängig vom Kunden-Session-System — dort
 * dürfen niemals private Kundeninhalte erscheinen (Abschnitt 2 des
 * Auftrags), nur aggregierte Paketumsätze.
 */
const ALWAYS_PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/buy",
  "/unlock",
  "/api/auth",
  "/api/stripe",
  "/api/locale",
  "/_next",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons",
  "/brand/",
  "/media",
  "/robots.txt",
];

function isOwnerRequest(request: NextRequest): boolean {
  if (!process.env.OWNER_ACCESS_KEY) return false;
  const cookie = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  return cookie === `owner:${process.env.OWNER_ACCESS_KEY}`;
}

function denied(request: NextRequest, redirectTo: string) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = redirectTo;
  url.search =
    redirectTo === "/login"
      ? `?next=${encodeURIComponent(request.nextUrl.pathname)}`
      : "";
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ALWAYS_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/operator")) {
    return isOwnerRequest(request) ? NextResponse.next() : denied(request, "/unlock");
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionUser = token ? await resolveSessionToken(token) : null;
  if (!sessionUser) {
    return denied(request, "/login");
  }

  if (process.env.OWNER_ACCESS_KEY && !isOwnerRequest(request)) {
    // Bei einem Paketwechsel (z.B. Pro -> Maxi) können mehrere ACTIVE-
    // Lizenzen für denselben Workspace existieren — die neueste zählt.
    const license = await prisma.license.findFirst({
      where: { workspaceId: sessionUser.workspaceId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    if (!license) {
      return denied(request, "/buy");
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
