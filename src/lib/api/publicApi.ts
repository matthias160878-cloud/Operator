import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Externe API (/api/v1/**) für Zapier, eigene Websites, Skripte usw.
 *
 * - Aktiv nur, wenn `PUBLIC_API_KEYS` gesetzt ist (kommagetrennt, mehrere
 *   Schlüssel möglich) — sonst antwortet jede Route mit 503.
 * - Authentifizierung: `Authorization: Bearer <key>` oder `X-API-Key: <key>`,
 *   Vergleich in konstanter Zeit.
 * - Limit: `PUBLIC_API_RATE_LIMIT` Anfragen pro Minute und Schlüssel
 *   (Standard 30, im Speicher dieses Server-Prozesses).
 * - CORS nur für die Origins in `PUBLIC_API_CORS_ORIGINS` (kommagetrennt
 *   oder `*`). Achtung: Ein Schlüssel im Browser-JavaScript ist öffentlich —
 *   die API besser aus einem Backend (z. B. Zapier, Server der Website) aufrufen.
 */

const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function configuredKeys(): string[] {
  return (process.env.PUBLIC_API_KEYS ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function corsHeaders(request: Request): Record<string, string> {
  const allowed = (process.env.PUBLIC_API_CORS_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = request.headers.get("origin");
  if (!origin || allowed.length === 0) return {};
  if (!allowed.includes("*") && !allowed.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": allowed.includes("*") ? "*" : origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function apiError(request: Request, status: number, error: string, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json({ error }, { status, headers: { ...corsHeaders(request), ...extraHeaders } });
}

export function apiJson(request: Request, data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders(request) });
}

export function apiPreflight(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

/** Prüft Schlüssel und Limit. Gibt bei Erfolg `null`, sonst die fertige Fehlerantwort zurück. */
export function authenticate(request: Request): NextResponse | null {
  const keys = configuredKeys();
  if (keys.length === 0) {
    return apiError(request, 503, "Die externe API ist nicht aktiviert (PUBLIC_API_KEYS ist nicht gesetzt).");
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : (request.headers.get("x-api-key") ?? "").trim();
  if (!provided) {
    return apiError(request, 401, "API-Schlüssel fehlt (Authorization: Bearer <key> oder X-API-Key).", {
      "WWW-Authenticate": "Bearer",
    });
  }

  const providedDigest = digest(provided);
  const matched = keys.find((key) => timingSafeEqual(digest(key), providedDigest));
  if (!matched) {
    return apiError(request, 401, "Ungültiger API-Schlüssel.", { "WWW-Authenticate": "Bearer" });
  }

  const limit = Math.max(1, Number(process.env.PUBLIC_API_RATE_LIMIT) || 30);
  const bucketKey = providedDigest.toString("hex");
  const now = Date.now();
  const bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + WINDOW_MS });
  } else if (bucket.count >= limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return apiError(request, 429, `Zu viele Anfragen — höchstens ${limit} pro Minute.`, {
      "Retry-After": String(retryAfter),
    });
  } else {
    bucket.count++;
  }
  return null;
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}
