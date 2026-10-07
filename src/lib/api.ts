import { NextResponse } from "next/server";
import { AuthRequiredError } from "@/lib/auth/session";
import { QuotaError } from "@/lib/entitlements";

/**
 * Einheitliche Fehlerantwort für Route Handler. Interne Details (Stacktraces,
 * Anbieter-Antworten mit möglichen Schlüsselfragmenten) gehen nur ins
 * Server-Log, nie an den Browser.
 */
export function errorResponse(err: unknown, fallback = "Die Anfrage konnte nicht verarbeitet werden.") {
  if (err instanceof AuthRequiredError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof QuotaError) {
    return NextResponse.json({ error: err.message, code: err.code, metric: err.metric }, { status: err.status });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }
  console.error("[api]", err instanceof Error ? err.message : err);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

export class NotFoundError extends Error {
  constructor() {
    super("Nicht gefunden.");
  }
}

/** Fehler, die als eigener HTTP-Status beim Browser ankommen sollen. */
export function isHttpError(err: unknown): boolean {
  return err instanceof AuthRequiredError || err instanceof QuotaError || err instanceof NotFoundError;
}

/**
 * Hülle für Route Handler: wandelt Anmelde-, Kontingent- und
 * Nicht-gefunden-Fehler in die passenden Antworten um und verhindert, dass
 * unerwartete Fehler mit internen Details beim Browser ankommen.
 */
export function route<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
