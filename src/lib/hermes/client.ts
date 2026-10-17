import type { HermesProfile } from "@/lib/hermes/config";

/** Fehler ohne Schlüssel, ohne Antworttexte des Dienstes — nur ein Code. */
export class HermesError extends Error {
  constructor(
    readonly code: "nicht_erreichbar" | "zeitueberschreitung" | "abgelehnt" | "ungueltige_antwort" | "zu_gross",
  ) {
    super(code);
  }
}

const MAX_RESPONSE_BYTES = 200_000;

export async function hermesRequest(
  profile: HermesProfile,
  path: string,
  opts: { method?: "GET" | "POST"; body?: unknown; timeoutMs: number },
): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs);
  try {
    const res = await fetch(`${profile.baseUrl}${path}`, {
      method: opts.method ?? "GET",
      headers: {
        authorization: `Bearer ${profile.key}`,
        accept: "application/json",
        ...(opts.body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      redirect: "error",
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new HermesError("abgelehnt");
    const text = await res.text();
    if (text.length > MAX_RESPONSE_BYTES) throw new HermesError("zu_gross");
    try {
      return JSON.parse(text);
    } catch {
      throw new HermesError("ungueltige_antwort");
    }
  } catch (err) {
    if (err instanceof HermesError) throw err;
    if (err instanceof Error && err.name === "AbortError") throw new HermesError("zeitueberschreitung");
    throw new HermesError("nicht_erreichbar");
  } finally {
    clearTimeout(timer);
  }
}

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Ergebnis eines Chat-Aufrufs; `toolSignal` = Antwort deutet auf Werkzeugnutzung hin. */
export async function hermesChat(
  profile: HermesProfile,
  messages: ChatTurn[],
  opts: { maxTokens: number; timeoutMs: number },
): Promise<{ text: string; toolSignal: boolean }> {
  const data = (await hermesRequest(profile, "/v1/chat/completions", {
    method: "POST",
    timeoutMs: opts.timeoutMs,
    body: { model: profile.model, messages, max_tokens: opts.maxTokens, stream: false },
  })) as { choices?: Array<{ message?: { content?: unknown; tool_calls?: unknown }; finish_reason?: unknown }> };
  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  const toolSignal = Boolean(choice?.message?.tool_calls) || choice?.finish_reason === "tool_calls";
  if (typeof content !== "string") {
    if (toolSignal) return { text: "", toolSignal };
    throw new HermesError("ungueltige_antwort");
  }
  return { text: content, toolSignal };
}
