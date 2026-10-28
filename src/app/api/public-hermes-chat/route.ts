import { NextResponse } from "next/server";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { publicState } from "@/lib/hermes/config";
import { publicHermesAvailable, visitorKey } from "@/lib/hermes/publicSafety";
import { hermesPublicAnswer, LIMITS, sanitizeHistory } from "@/lib/hermes/publicChat";
// Unverändert aus der Zentrale übernommen (src/lib/zentrale/README.md).
import { pruefe as gatePruefe, zustaendig } from "@/lib/zentrale/agenten/gate.js";

export const dynamic = "force-dynamic";

/**
 * Öffentlicher Besucherchat über Hermes (getrenntes Profil). Standardmäßig AUS.
 * GET  → { available } — ohne Gründe (die sieht nur der Betreiber unter /operator/hermes-pilot).
 * POST → Antwort, nur wenn alle Bedingungen und die Sicherheitsprüfung erfüllt sind; sonst 503.
 * Vor jedem Modellaufruf gelten dieselben Regeln wie beim Webseiten-Chat (gesperrte Themen,
 * „bitte ein Mensch“, Terminwünsche) — diese Fälle gehen nie an Hermes.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  const own = request.headers.get("host");
  let app: string | null = null;
  try {
    app = process.env.PUBLIC_APP_URL ? new URL(process.env.PUBLIC_APP_URL).host : null;
  } catch {
    /* ignorieren */
  }
  return host === own || host === app;
}

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  return NextResponse.json({ available: await publicHermesAvailable() }, { headers: noStore });
}

export async function POST(request: Request) {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "ungueltige_anfrage" }, { status: 415, headers: noStore });
  }
  if (!sameOrigin(request)) return NextResponse.json({ error: "herkunft" }, { status: 403, headers: noStore });

  const state = publicState();
  // Ohne vollständige Einrichtung kein Limit-Speicher, keine Prüfung, nichts: einfach nicht verfügbar.
  if (!state.ok) return NextResponse.json({ error: "nicht_verfuegbar" }, { status: 503, headers: noStore });

  const raw = await request.text();
  if (raw.length > LIMITS.maxBodyChars) return NextResponse.json({ error: "zu_gross" }, { status: 413, headers: noStore });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "ungueltige_anfrage" }, { status: 400, headers: noStore });
  }
  const parsed = sanitizeHistory((body as { messages?: unknown } | null)?.messages);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400, headers: noStore });

  const vk = visitorKey(clientIp(request), state.rateSecret);
  if (!(await hitRateLimit(`hermespub:10m:${vk}`, 12, 600)) || !(await hitRateLimit(`hermespub:tag:${vk}`, 60, 86400))) {
    return NextResponse.json({ error: "zu_viele_anfragen" }, { status: 429, headers: noStore });
  }

  const nachricht = parsed.history[parsed.history.length - 1].content;
  const wer = zustaendig(nachricht);
  if (wer === "gesperrt") {
    return NextResponse.json({ reply: gatePruefe({ stufe: 0, nachricht }).grund, entscheidung: "abgelehnt" }, { headers: noStore });
  }
  if (wer === "mensch") {
    return NextResponse.json(
      { reply: "Das gebe ich an einen Menschen weiter. Bitte schreiben Sie uns über das Kontaktformular oder an info@secret58.com.", entscheidung: "eskaliert" },
      { headers: noStore },
    );
  }
  if (wer === "terminplaner") {
    return NextResponse.json(
      { reply: "Einen Termin für ein Erstgespräch wählen Sie direkt hier auf der Seite unter „Termin anfragen“ im Kontaktbereich.", entscheidung: "verwiesen" },
      { headers: noStore },
    );
  }

  if (!(await publicHermesAvailable())) return NextResponse.json({ error: "nicht_verfuegbar" }, { status: 503, headers: noStore });
  if (!(await hitRateLimit("hermespub:global", state.dailyLimit, 86400))) {
    return NextResponse.json({ error: "ausgelastet" }, { status: 429, headers: noStore });
  }
  try {
    return NextResponse.json({ reply: await hermesPublicAnswer(parsed.history) }, { headers: noStore });
  } catch (err) {
    if (err instanceof Error && err.message === "belegt") return NextResponse.json({ error: "ausgelastet" }, { status: 429, headers: noStore });
    console.error("[hermes-public] Aufruf fehlgeschlagen:", err instanceof Error ? err.message : "unbekannt");
    return NextResponse.json({ error: "agent_nicht_erreichbar" }, { status: 502, headers: noStore });
  }
}
