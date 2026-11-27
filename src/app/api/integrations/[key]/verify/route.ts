import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { hitRateLimit } from "@/lib/api/rateLimit";
import { getIntegrationDefinition, verifyIntegration } from "@/lib/integrations/setup";

export const dynamic = "force-dynamic";

/**
 * „Verbindung prüfen“ auf der Integrationen-Seite. Prüft Variablen und
 * macht, wo möglich, einen leichten Aufruf beim Anbieter. Antwortet nur mit
 * Status und Meldung — niemals mit Schlüsseln oder Anbieter-Antworten.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const def = getIntegrationDefinition(key);
  if (!def) {
    return NextResponse.json({ error: "unknown_integration" }, { status: 404 });
  }

  // Schützt die Anbieter-APIs vor Klick-Serien (je Integration 6 Prüfungen pro Minute).
  const retryAfter = hitRateLimit(`integration-verify:${key}`, 6, 60_000);
  if (retryAfter !== null) {
    return NextResponse.json(
      { error: "rate_limited", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const t = await getTranslations("common.integrationStatus");
  const result = await verifyIntegration(def, t);
  return NextResponse.json(result);
}
