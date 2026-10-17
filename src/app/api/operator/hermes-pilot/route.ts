import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { pilotState } from "@/lib/hermes/config";
import { hermesChat, HermesError } from "@/lib/hermes/client";
import { publicHermesStatus } from "@/lib/hermes/publicSafety";

export const dynamic = "force-dynamic";

/**
 * Interner Hermes-Pilot — nur für Betreiberkonten. Schickt ausschließlich den vom Betreiber getippten
 * Text; es werden keine Kundendaten, Beiträge oder Konten der App mitgegeben, und die App führt nichts
 * aus, was Hermes vorschlägt (keine Veröffentlichung, kein Nachrichtenversand).
 * Hinweis: Der Hermes-Server selbst kann eigene Werkzeuge haben (Terminal, Dateien …) — er gehört dem Betreiber.
 */
async function operatorOnly() {
  const user = await getSessionUser();
  return user?.isOperator ? user : null;
}

export async function GET() {
  if (!(await operatorOnly())) return NextResponse.json({ error: "Nur für Betreiber." }, { status: 403 });
  const pilot = pilotState();
  const pub = await publicHermesStatus();
  return NextResponse.json({
    pilot: pilot.ok ? { available: true } : { available: false, missing: pilot.missing },
    publicChat: { available: pub.available, reasons: pub.reasons },
  });
}

export async function POST(request: Request) {
  if (!(await operatorOnly())) return NextResponse.json({ error: "Nur für Betreiber." }, { status: 403 });
  const pilot = pilotState();
  if (!pilot.ok) return NextResponse.json({ error: "Hermes-Pilot ist nicht eingerichtet.", missing: pilot.missing }, { status: 503 });
  const body = (await request.json().catch(() => null)) as { messages?: unknown } | null;
  const raw = Array.isArray(body?.messages) ? body.messages.slice(-12) : null;
  const messages = (raw ?? [])
    .filter((m): m is { role: "user" | "assistant"; content: string } => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages[messages.length - 1].role !== "user") return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  try {
    const { text } = await hermesChat(pilot.profile, messages, { maxTokens: 1500, timeoutMs: 60_000 });
    return NextResponse.json({ reply: text.slice(0, 8000) });
  } catch (err) {
    const code = err instanceof HermesError ? err.code : "nicht_erreichbar";
    return NextResponse.json({ error: `Hermes hat nicht geantwortet (${code}).` }, { status: 502 });
  }
}
