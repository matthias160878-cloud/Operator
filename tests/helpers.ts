import { vi } from "vitest";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";

/** Leert die Posteingangs-Tabellen der Test-Datenbank und liefert die Workspace-ID. */
export async function resetInbox(): Promise<string> {
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.platformAccount.deleteMany();
  return getCurrentWorkspaceId();
}

export interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

/**
 * Ersetzt das globale fetch: `handler` bekommt jede Anfrage und gibt die
 * Antwort zurück. Alle Aufrufe werden in `calls` mitgeschrieben.
 */
export function mockFetch(handler: (call: RecordedCall) => Response | Promise<Response>) {
  const calls: RecordedCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
      const headers: Record<string, string> = {};
      new Headers(init.headers).forEach((value, key) => {
        headers[key] = value;
      });
      const call: RecordedCall = {
        url: String(input instanceof Request ? input.url : input),
        method: init.method ?? "GET",
        headers,
        body: typeof init.body === "string" ? init.body : init.body ? String(init.body) : "",
      };
      calls.push(call);
      return handler(call);
    })
  );
  return calls;
}

export function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}
