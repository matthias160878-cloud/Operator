import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { VISITOR_HOME_FILE, ZENTRALE_PAGES } from "@/lib/zentralePages";

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
  "/social-media-ki",
  "/zentrale/",
  "/verlauf",
  "/hauptseite",
  "/zentrale-neu",
  "/login",
  "/signup",
  "/setup",
  "/impressum",
  "/kuendigen",
  "/shop/",
  "/api/auth/",
  "/api/stripe/webhook",
  "/api/stripe/connect-webhook",
  "/api/shop/",
  "/api/widget/",
  "/api/media-signed/",
  "/api/freigabe/",
  "/api/locale",
  "/api/health",
  "/api/kontakt",
  "/api/kuendigen",
  "/api/demo/plan",
  "/api/agenten",
  "/api/skill-agent",
  "/api/termine/",
  "/api/webseite/status",
  "/api/newsletter/",
  "/e/",
  "/api/empfehlung/",
  "/n/",
  "/api/nl/",
  "/widget.js",
  "/_next",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
  "/installieren.js",
  "/api/installieren/",
  "/icons",
  "/brand/",
  "/splash/",
  "/robots.txt",
];

/** Diese Endpunkte werden von fremden Ursprüngen aufgerufen und prüfen sich selbst. */
const CROSS_ORIGIN_ALLOWED = ["/api/stripe/webhook", "/api/stripe/connect-webhook", "/api/widget/", "/api/nl/abmelden"];

/** Nur exakt diese Pfade (ein Präfix würde z. B. /api/chatbot mit öffnen). */
const PUBLIC_EXACT = new Set(["/api/chat", "/api/public-hermes-chat", "/api/dateien/status"]);

/**
 * Die echte Domain (secret58.com) zeigt Besuchern ohne Sitzung die neue Zentrale als Startseite;
 * angemeldete Kunden kommen unter „/“ wie bisher in die App. Freigabe Matthias, 25.10.2026.
 */
const HAUPTDOMAIN = /^(www\.)?secret58\.com$/i;
const HAUPTSEITE = "/zentrale-neu/index.html";

function istHauptdomain(request: NextRequest): boolean {
  return HAUPTDOMAIN.test((request.headers.get("host") ?? "").split(":")[0]);
}

function isPublic(pathname: string): boolean {
  if (pathname in ZENTRALE_PAGES || PUBLIC_EXACT.has(pathname)) return true;
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
    // Rückkehr von Composio ohne Sitzung (auf dem Handy öffnet die
    // Plattform-App die Anmeldung oft in einem anderen Browser): erst
    // anmelden, dann denselben Rückkehr-Link abschließen.
    if (pathname === "/api/composio/callback" && method === "GET") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Anmeldung erforderlich." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    if (pathname === "/") {
      // Auf secret58.com: die neue Zentrale (Weiterleitung, damit ihre relativen Pfade stimmen).
      if (istHauptdomain(request)) {
        url.pathname = HAUPTSEITE;
        url.search = "";
        return NextResponse.redirect(url);
      }
      // Sonst sehen Besucher ohne Konto unter „/“ die Startseite der Zentrale.
      url.pathname = VISITOR_HOME_FILE;
      return NextResponse.rewrite(url);
    }
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
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
