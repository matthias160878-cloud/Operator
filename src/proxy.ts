import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ACCESS_COOKIE_NAME } from "@/lib/license";
import { SESSION_COOKIE_NAME, resolveSessionToken } from "@/lib/auth";
import { PACKAGE_IDS } from "@/lib/packages";

/**
 * Zugriffsschutz für die komplette Anwendung, zweistufig:
 *
 * 1. Authentifizierung (immer aktiv): Jede Seite/API außer den unten
 *    gelisteten öffentlichen Pfaden verlangt eine gültige Session
 *    (`s58_session`-Cookie -> `Session`-Zeile in der DB ->
 *    `User.workspaceId`). Es gibt keinen Fallback auf einen geteilten
 *    Default-Workspace — ohne Session gibt es keinen Zugriff auf private
 *    Kundendaten (Abschnitt 2 des Auftrags: Berechtigung aus der
 *    authentifizierten Sitzung ableiten, nie aus einer Client-Workspace-ID).
 *
 * 2. Bezahlschranke (IMMER aktiv, unabhängig davon, ob OWNER_ACCESS_KEY
 *    gesetzt ist --- das war vorher nicht so: ohne gesetztes
 *    OWNER_ACCESS_KEY lief jede angemeldete Sitzung komplett ohne
 *    Bezahlschranke. OWNER_ACCESS_KEY ist jetzt ausschließlich ein
 *    Betreiber-Bypass, nie ein Schalter für "gibt es überhaupt eine
 *    Bezahlschranke"): zusätzlich zur Session muss entweder das
 *    Betreiber-Cookie gesetzt sein, oder eine ACTIVE License für genau den
 *    Workspace der aktuellen Session existieren, UND deren `packageId`
 *    muss ein echtes Paket sein (`pro`/`maxi`, siehe `PACKAGE_IDS`) ---
 *    eine Lizenz mit unbekanntem/fehlendem Paket (z.B. ein künftiger
 *    eigenständiger Einrichtungsservice-Kauf ohne Abo) gewährt bewusst
 *    KEINEN Plattformzugang, egal ob ihr Status ACTIVE ist.
 *
 * `/operator/**` ist ein komplett getrennter Bereich: nur per
 * OWNER_ACCESS_KEY erreichbar, unabhängig vom Kunden-Session-System — dort
 * dürfen niemals private Kundeninhalte erscheinen (Abschnitt 2 des
 * Auftrags), nur aggregierte Paketumsätze.
 *
 * 3. CSRF (Cookie-basierte Sitzung, also angreifbar durch eine fremde Seite,
 *    die im Browser der Kundin/des Kunden eine Anfrage an uns auslöst):
 *    jede mutierende Anfrage (POST/PUT/PATCH/DELETE) muss `Origin` (oder,
 *    falls der Browser das weglässt, `Referer`) auf genau diesen Host
 *    zeigen haben. Einzige Ausnahme: der Stripe-Webhook --- der hat gar
 *    keine Browser-Sitzung, wird stattdessen über die Stripe-Signatur
 *    geprüft (`constructWebhookEvent`), nicht über Herkunft/Cookie.
 */
const CSRF_AUSNAHMEN = ["/api/stripe/webhook", "/api/zentrale/abostatus"];
const MUTIERENDE_METHODEN = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function kommtVonFremderHerkunft(request: NextRequest): boolean {
  const herkunft = request.headers.get("origin") ?? request.headers.get("referer");
  if (!herkunft) return true; // keine Angabe: im Zweifel ablehnen, nicht durchlassen
  // `request.nextUrl.host` wird von Next intern normalisiert und entspricht
  // NICHT immer dem tatsächlich gesendeten `Host`-Kopf (z.B. im Dev-Server
  // "localhost:3000" statt der verbundenen Adresse) --- für einen
  // Herkunftsvergleich zählt nur der echte eingehende `Host`-Kopf.
  const eigenerHost = request.headers.get("host");
  if (!eigenerHost) return true;
  try {
    return new URL(herkunft).host !== eigenerHost;
  } catch {
    return true;
  }
}

const ALWAYS_PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/buy",
  "/unlock",
  "/entitlement",
  "/api/auth",
  "/api/stripe",
  "/api/zentrale",
  "/api/locale",
  "/_next",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons",
  "/brand/",
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

  if (
    MUTIERENDE_METHODEN.has(request.method) &&
    !CSRF_AUSNAHMEN.some((p) => pathname.startsWith(p)) &&
    kommtVonFremderHerkunft(request)
  ) {
    return NextResponse.json({ error: "Anfrage abgelehnt (Herkunft)." }, { status: 403 });
  }

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

  if (!isOwnerRequest(request)) {
    // Bei einem Paketwechsel (z.B. Pro -> Maxi) können mehrere ACTIVE-
    // Lizenzen für denselben Workspace existieren — die neueste zählt.
    // packageId muss eines der echten Pakete sein (siehe Kommentar oben).
    const license = await prisma.license.findFirst({
      where: { workspaceId: sessionUser.workspaceId, status: "ACTIVE", packageId: { in: PACKAGE_IDS } },
      orderBy: { createdAt: "desc" },
    });
    // Für origin="zentrale" gilt der Status nur bis `statusGueltigBis`
    // (laufend per Push aktualisiert, siehe src/lib/abostatus.ts) --- ohne
    // frischen Push bleibt ein früherer Login nicht unbegrenzt gültig.
    const istAbgelaufen =
      license?.statusGueltigBis != null && license.statusGueltigBis.getTime() < Date.now();
    if (!license || istAbgelaufen) {
      return denied(request, "/buy");
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
