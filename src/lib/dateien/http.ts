import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { ansichtTyp, DateiError } from "@/lib/dateien/service";

function fehler(e: unknown): Response {
  if (e instanceof DateiError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ZodError) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  console.error("[dateien]", e instanceof Error ? e.message : e);
  return NextResponse.json({ error: "Die Anfrage konnte nicht verarbeitet werden." }, { status: 500 });
}

/** Kundenzugriff: Workspace immer aus der Sitzung, nie aus der Anfrage. */
export async function withKunde(fn: (u: SessionUser) => Promise<Response>): Promise<Response> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  try {
    return await fn(user);
  } catch (e) {
    return fehler(e);
  }
}

/** Betreiberzugriff; andere Konten sehen die Schnittstelle nicht (404). */
export async function withBetreiber(fn: (u: SessionUser) => Promise<Response>): Promise<Response> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Bitte anmelden." }, { status: 401 });
  if (!user.isOperator) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  try {
    return await fn(user);
  } catch (e) {
    return fehler(e);
  }
}

export async function ohneSitzung(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    return fehler(e);
  }
}

export async function jsonBody(req: Request): Promise<unknown> {
  if (Number(req.headers.get("content-length") || 0) > 20_000) throw new DateiError(413, "Anfrage zu groß.");
  const t = await req.text();
  if (t.length > 20_000) throw new DateiError(413, "Anfrage zu groß.");
  try {
    return t ? JSON.parse(t) : {};
  } catch {
    throw new DateiError(400, "Ungültiges JSON.");
  }
}

/** Liest genau eine Datei aus einem multipart-Formular (Feld „datei“) plus Textfelder. */
export async function formDatei(req: Request, maxBytes: number) {
  if (Number(req.headers.get("content-length") || 0) > maxBytes + 64_000)
    throw new DateiError(413, `Die Datei ist zu groß (höchstens ${Math.round(maxBytes / 1048576)} MB).`);
  let fd: FormData;
  try {
    fd = await req.formData();
  } catch {
    throw new DateiError(400, "Bitte eine Datei senden.");
  }
  const f = fd.get("datei");
  if (!f || typeof f === "string") throw new DateiError(400, "Bitte eine Datei senden.");
  const daten = Buffer.from(await f.arrayBuffer());
  const feld = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : "";
  };
  return { name: f.name, mime: f.type, daten, feld };
}

function dispositionName(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/**
 * Auslieferung: standardmäßig als Download (application/octet-stream). Ansehen im Browser nur
 * für PDF, Bilder und Text — mit Sandbox, damit nichts auf der eigenen Seite ausgeführt wird.
 */
export function dateiAntwort(name: string, daten: Buffer, ansehen = false): Response {
  const typ = ansehen ? ansichtTyp(name) : null;
  return new Response(new Uint8Array(daten), {
    headers: {
      "content-type": typ ?? "application/octet-stream",
      "content-disposition": `${typ ? "inline" : "attachment"}; ${dispositionName(name)}`,
      "content-length": String(daten.length),
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
      "referrer-policy": "no-referrer",
    },
  });
}
