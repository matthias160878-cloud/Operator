/**
 * Gemeinsamer Text-Generierungs-Adapter für Content Brain, Idea-, Script-,
 * Hook-, Hashtag-, Thumbnail- und Learning-Agent.
 *
 * Priorität: AI_PROVIDER (wenn gesetzt und Schlüssel vorhanden) ->
 * ANTHROPIC_API_KEY -> OPENAI_API_KEY -> GEMINI_API_KEY -> deterministischer
 * Template-Fallback. Der Fallback sorgt dafür, dass die komplette Text-Pipeline
 * auch ganz ohne konfigurierten KI-Provider lauffähig bleibt (siehe
 * Master-Prompt Abschnitt 42) — er wird im UI immer klar als "Template-Modus"
 * gekennzeichnet und niemals als echte KI-Antwort ausgegeben.
 */

export type TextGenProvider = "anthropic" | "openai" | "gemini" | "template";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateTextInput {
  system: string;
  /** Einzelner Prompt für Single-Turn-Aufrufe (bestehende Agenten). */
  prompt?: string;
  /** Alternative für Multi-Turn-Konversationen (z. B. Chatbot). */
  messages?: ChatMessage[];
  maxTokens?: number;
}

function toChatMessages(input: GenerateTextInput): ChatMessage[] {
  return input.messages ?? [{ role: "user", content: input.prompt ?? "" }];
}

export interface GenerateTextResult {
  text: string;
  provider: TextGenProvider;
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
// Google benennt Modelle häufig um; der Alias zeigt auf das aktuelle Flash-Modell
// und lässt sich über GEMINI_MODEL festnageln (z. B. "gemini-3.5-flash"). Bei
// jedem Aufruf gelesen, damit eine Änderung über „Zugänge“ sofort gilt.
const geminiModel = () => process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";

/** Zeitlimit je Anbieter-Aufruf — hängende Aufrufe blockieren sonst Kontingent und Server. */
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 60_000;
/** Obergrenze für Antwortlänge (Kostenkontrolle), unabhängig vom Aufrufer. */
const MAX_TOKENS_CAP = Number(process.env.AI_MAX_TOKENS_CAP) || 2048;

function cappedTokens(requested: number | undefined): number {
  return Math.min(requested ?? 1024, MAX_TOKENS_CAP);
}

async function callAnthropic(input: GenerateTextInput): Promise<string> {
  const res = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: cappedTokens(input.maxTokens),
      system: input.system,
      messages: toChatMessages(input),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  if (!res.ok) {
    // Fehlertext des Anbieters (z. B. „credit balance too low“, „model not found“) mitgeben,
    // damit die Ursache im Log steht; er enthält keinen Schlüssel.
    const detail = await res
      .json()
      .then((b: { error?: { message?: string } }) => b?.error?.message?.slice(0, 200))
      .catch(() => undefined);
    throw new Error(`Anthropic API antwortete mit Status ${res.status}.${detail ? ` ${detail}` : ""}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((block) => block.type === "text")?.text;
  if (!text) throw new Error("Anthropic-Antwort enthielt keinen Text.");
  return text;
}

async function callOpenAI(input: GenerateTextInput): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: cappedTokens(input.maxTokens),
      messages: [{ role: "system", content: input.system }, ...toChatMessages(input)],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API antwortete mit Status ${res.status}.`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI-Antwort enthielt keinen Text.");
  return text;
}

async function callGemini(input: GenerateTextInput): Promise<string> {
  const base = (process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/+$/, "");
  const res = await fetch(`${base}/v1beta/models/${encodeURIComponent(geminiModel())}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: input.system }] },
      contents: toChatMessages(input).map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: cappedTokens(input.maxTokens) },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Gemini API antwortete mit Status ${res.status}.`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini-Antwort enthielt keinen Text.");
  return text;
}

const CALLERS: Record<Exclude<TextGenProvider, "template">, { call: (i: GenerateTextInput) => Promise<string>; name: string }> = {
  anthropic: { call: callAnthropic, name: "Anthropic" },
  openai: { call: callOpenAI, name: "OpenAI" },
  gemini: { call: callGemini, name: "Gemini" },
};

function hasKey(p: Exclude<TextGenProvider, "template">): boolean {
  return Boolean(
    { anthropic: process.env.ANTHROPIC_API_KEY, openai: process.env.OPENAI_API_KEY, gemini: process.env.GEMINI_API_KEY }[p]?.trim()
  );
}

export async function generateText(
  input: GenerateTextInput
): Promise<GenerateTextResult> {
  const provider = currentTextProvider();
  if (provider === "template") return { text: "", provider: "template" };
  const { call, name } = CALLERS[provider];
  try {
    const text = await call(input);
    return { text, provider };
  } catch (error) {
    throw new Error(`${name} konnte nicht erreicht werden: ${error instanceof Error ? error.message : "unbekannter Fehler"}`);
  }
}

/**
 * Aktiver Anbieter: AI_PROVIDER (anthropic|openai|gemini), falls dessen
 * Schlüssel gesetzt ist; sonst der erste Anbieter mit Schlüssel in der
 * Reihenfolge Anthropic, OpenAI, Gemini; sonst Template-Modus.
 */
export function currentTextProvider(): TextGenProvider {
  const wanted = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  if ((wanted === "anthropic" || wanted === "openai" || wanted === "gemini") && hasKey(wanted)) return wanted;
  for (const p of ["anthropic", "openai", "gemini"] as const) if (hasKey(p)) return p;
  return "template";
}
