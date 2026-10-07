import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveSessionToken, SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Zugriffsschutz für die gesamte Anwendung (Mehrkundenbetrieb).
 *
 *  - Öffentlich: Verkaufsseite, Anmeldung/Registrierung, Betreiber-Einrichtung,
 *    Stripe-Webhooks (signaturgeprüft), öffentliche Shop- und Widget-Endpunkte.
 *  - Alles andere verlangt eine gültige Sitzung. Seiten leiten zur Anmeldung,
 *    API-Aufrufe bekommen 401 — auch direkte Aufrufe ohne Browser.
 *  - /operator und /api/operator nur für Betreiberkonten.
 *  - Ändernde API-Aufrufe müssen vom eigenen Ursprung kommen (CSRF-Schutz),
 *    ausgenommen signaturgeprüfte Webhooks und das öffentliche Widget.
 *
 * Die Berechtigung auf einzelne Datensätze prüfen zusätzlich die Route
 * Handler selbst (src/lib/ownership.ts) — der Proxy ist nur die erste Linie.
 */
const PUBLIC_PREFIXES = [
  "/buy",
  "/login",
  "/signup",
  "/setup",
  "/impressum",
  "/shop/",
  "/api/auth/",
  "/api/stripe/webhook",
  "/api/stripe/connect-webhook",
  "/api/shop/",
  "/api/widget/",
  "/api/media-signed/",
  "/api/locale",
  "/widget.js",
  "/_next",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons",
  "/brand/",
  "/robots.txt",
];

/** Diese Endpunkte werden von fremden Ursprüngen aufgerufen und prüfen sich selbst. */
const CROSS_ORIGIN_ALLOWED = ["/api/stripe/webhook", "/api/stripe/connect-webhook", "/api/widget/"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix));
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === request.headers.get("host");
    } catch {
      return false;
    }
  }
  // Ohne Origin-Kopfzeile: Fetch-Metadaten heranziehen, sonst ablehnen.
  const site = request.headers.get("sec-fetch-site");
  return site === "same-origin" || site === "none";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (
    mutating &&
    pathname.startsWith("/api/") &&
    !CROSS_ORIGIN_ALLOWED.some((p) => pathname.startsWith(p)) &&
    !sameOrigin(request)
  ) {
    return NextResponse.json({ error: "Anfrage von fremdem Ursprung abgelehnt." }, { status: 403 });
  }

  if (isPublic(pathname)) return NextResponse.next();

  const user = await resolveSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Anmeldung erforderlich." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if ((pathname === "/operator" || pathname.startsWith("/operator/") || pathname.startsWith("/api/operator")) && !user.isOperator) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
