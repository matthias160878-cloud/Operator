import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { PilotError, type Actor } from "@/lib/pilotstudio/service";

/**
 * Serverseitiger Betreiberschutz für alle Pilotstudio-Schnittstellen (zusätzlich zu src/proxy.ts).
 * Nicht-Betreiber bekommen 404, damit die Schnittstelle nicht sichtbar wird.
 */
export async function withOperator(fn: (u: SessionUser, actor: Actor) => Promise<Response>): Promise<Response> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  if (!user.isOperator) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  try {
    return await fn(user, { id: user.userId, name: user.name || user.email });
  } catch (e) {
    if (e instanceof PilotError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[pilotstudio]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Die Anfrage konnte nicht verarbeitet werden." }, { status: 500 });
  }
}

export async function readJson(req: Request, maxBytes = 2_000_000): Promise<unknown> {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > maxBytes) throw new PilotError(413, "Datei zu groß.");
  const txt = await req.text();
  if (txt.length > maxBytes) throw new PilotError(413, "Datei zu groß.");
  try {
    return JSON.parse(txt);
  } catch {
    throw new PilotError(400, "Ungültiges JSON.");
  }
}
