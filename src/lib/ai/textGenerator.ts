/**
 * Gemeinsamer Text-Generierungs-Adapter für Content Brain, Idea-, Script-,
 * Hook-, Hashtag-, Thumbnail- und Learning-Agent.
 *
 * Priorität: ANTHROPIC_API_KEY -> OPENAI_API_KEY -> deterministischer
 * Template-Fallback. Der Fallback sorgt dafür, dass die komplette Text-Pipeline
 * auch ganz ohne konfigurierten KI-Provider lauffähig bleibt (siehe
 * Master-Prompt Abschnitt 42) — er wird im UI immer klar als "Template-Modus"
 * gekennzeichnet und niemals als echte KI-Antwort ausgegeben.
 */

export type TextGenProvider = "anthropic" | "openai" | "template";

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
    throw new Error(`Anthropic API antwortete mit Status ${res.status}.`);
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

export async function generateText(
  input: GenerateTextInput
): Promise<GenerateTextResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const text = await callAnthropic(input);
      return { text, provider: "anthropic" };
    } catch (error) {
      throw new Error(
        `Anthropic konnte nicht erreicht werden: ${
          error instanceof Error ? error.message : "unbekannter Fehler"
        }`
      );
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const text = await callOpenAI(input);
      return { text, provider: "openai" };
    } catch (error) {
      throw new Error(
        `OpenAI konnte nicht erreicht werden: ${
          error instanceof Error ? error.message : "unbekannter Fehler"
        }`
      );
    }
  }

  return { text: "", provider: "template" };
}

export function currentTextProvider(): TextGenProvider {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "template";
}
