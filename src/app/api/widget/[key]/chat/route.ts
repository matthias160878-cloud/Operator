import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentTextProvider, generateText } from "@/lib/ai/textGenerator";
import { QuotaError, reserveQuota } from "@/lib/entitlements";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";

/**
 * Öffentlicher Endpunkt des Webseiten-Assistenten.
 *  - Funktioniert nur für bestätigte, nicht widerrufene Einbindungen.
 *  - Antwortet nur auf Anfragen vom bestätigten Ursprung (Origin-Prüfung + CORS).
 *    Hinweis: Nicht-Browser-Clients können einen Origin-Header fälschen; deshalb
 *    greifen zusätzlich Ratenbegrenzung und das Paket-Kontingent des Kunden.
 *  - Der Assistent kennt nur öffentliche Markenangaben — keine privaten Inhalte.
 */
const schema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1000) }))
    .min(1)
    .max(10),
});

async function connectionFor(key: string, origin: string | null) {
  if (!origin) return null;
  const site = await prisma.websiteConnection.findUnique({ where: { publicKey: key } });
  if (!site || site.revokedAt || !site.verifiedAt || site.origin !== origin) return null;
  return site;
}

function cors(origin: string) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

export async function OPTIONS(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const origin = request.headers.get("origin");
  const site = await connectionFor(key, origin);
  if (!site) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: cors(site.origin) });
}

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const origin = request.headers.get("origin");
  const site = await connectionFor(key, origin);
  if (!site) return NextResponse.json({ error: "Diese Einbindung ist nicht freigegeben." }, { status: 403 });
  const headers = cors(site.origin);

  const ip = clientIp(request);
  const allowed = (await hitRateLimit(`widget-ip:${key}:${ip}`, 20, 600)) && (await hitRateLimit(`widget-key:${key}`, 300, 3600));
  if (!allowed) return NextResponse.json({ error: "Zu viele Anfragen. Bitte später erneut." }, { status: 429, headers });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400, headers });

  if (currentTextProvider() === "template") {
    return NextResponse.json({ error: "Der Assistent ist gerade nicht verfügbar." }, { status: 503, headers });
  }

  let release: () => Promise<void>;
  try {
    release = await reserveQuota(site.workspaceId, "WIDGET_CHAT");
  } catch (err) {
    if (err instanceof QuotaError) {
      return NextResponse.json({ error: "Der Assistent ist gerade nicht verfügbar." }, { status: 503, headers });
    }
    throw err;
  }

  const brand = await prisma.brand.findUnique({
    where: { workspaceId: site.workspaceId },
    select: { name: true, description: true, industry: true, language: true, tonality: true },
  });
  const system = [
    `Du bist der Webseiten-Assistent von „${brand?.name ?? "diesem Unternehmen"}“.`,
    brand?.description ? `Über das Unternehmen: ${brand.description}` : "",
    brand?.industry ? `Branche: ${brand.industry}` : "",
    `Tonalität: ${brand?.tonality ?? "freundlich"}. Sprache: ${brand?.language ?? "Deutsch"}.`,
    "Beantworte nur allgemeine Fragen zum Unternehmen auf Grundlage dieser Angaben. Erfinde keine Preise, Termine,",
    "Zusagen oder Kontaktdaten. Wenn du etwas nicht weißt, sage das und verweise auf die Kontaktmöglichkeiten der Webseite.",
    "Gib dich als KI-Assistent zu erkennen, wenn danach gefragt wird.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { text } = await generateText({ system, messages: parsed.data.messages, maxTokens: 400 });
    return NextResponse.json({ reply: text }, { headers });
  } catch {
    await release();
    return NextResponse.json({ error: "Der Assistent ist gerade nicht verfügbar." }, { status: 502, headers });
  }
}
