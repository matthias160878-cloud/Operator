/**
 * Gemeinsamer Text-Generierungs-Adapter für Content Brain, Idea-, Script-,
 * Hook-, Hashtag-, Thumbnail- und Learning-Agent.
 *
 * Schlüssel: in Kunden-Workspaces nur die eigenen des Kunden (Kontext aus
 * `mitKiZugang`), sonst die des Servers/Betreibers.
 *
 * Priorität: AI_PROVIDER (wenn gesetzt und Schlüssel vorhanden) ->
 * ANTHROPIC_API_KEY -> OPENAI_API_KEY -> GEMINI_API_KEY -> deterministischer
 * Template-Fallback. Der Fallback sorgt dafür, dass die komplette Text-Pipeline
 * auch ganz ohne konfigurierten KI-Provider lauffähig bleibt (siehe
 * Master-Prompt Abschnitt 42) — er wird im UI immer klar als "Template-Modus"
 * gekennzeichnet und niemals als echte KI-Antwort ausgegeben.
 */

import { kiSpeicher } from "@/lib/ai/kiKontext";
import { aktivesModell } from "@/lib/ai/modelle";
import { kiLimitPruefen, kiVerbrauchBuchen } from "@/lib/ai/kiLimits";

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


// Google benennt Modelle häufig um; der Alias zeigt auf das aktuelle Flash-Modell
// und lässt sich über GEMINI_MODEL festnageln (z. B. "gemini-3.5-flash"). Bei
// jedem Aufruf gelesen, damit eine Änderung über „Zugänge“ sofort gilt.
const geminiModel = () => aktivesModell("gemini");

/** Zeitlimit je Anbieter-Aufruf — hängende Aufrufe blockieren sonst Kontingent und Server. */
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 60_000;
/** Obergrenze für Antwortlänge (Kostenkontrolle), unabhängig vom Aufrufer. */
const MAX_TOKENS_CAP = Number(process.env.AI_MAX_TOKENS_CAP) || 2048;

type Echt = Exclude<TextGenProvider, "template">;

/** Schlüssel für den Anbieter im aktuellen Kontext — nie an den Browser oder ins Log. */
function schluessel(p: Echt): string {
  const ctx = kiSpeicher.getStore();
  if (ctx?.quelle === "KUNDE") return ctx[p]?.trim() ?? "";
  return ({ anthropic: process.env.ANTHROPIC_API_KEY, openai: process.env.OPENAI_API_KEY, gemini: process.env.GEMINI_API_KEY }[p] ?? "").trim();
}

export function cappedTokens(requested: number | undefined): number {
  return Math.min(requested ?? 1024, MAX_TOKENS_CAP);
}

async function callAnthropic(input: GenerateTextInput): Promise<string> {
  const res = await fetch(`${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": schluessel("anthropic"),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: aktivesModell("anthropic"),
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
  const res = await fetch(`${(process.env.OPENAI_BASE_URL || "https://api.openai.com").replace(/\/+$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${schluessel("openai")}`,
    },
    body: JSON.stringify({
      model: aktivesModell("openai"),
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
      "x-goog-api-key": schluessel("gemini"),
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

function hasKey(p: Echt): boolean {
  return Boolean(schluessel(p));
}

export async function generateText(
  input: GenerateTextInput
): Promise<GenerateTextResult> {
  const provider = currentTextProvider();
  if (provider === "template") return { text: "", provider: "template" };
  const { call, name } = CALLERS[provider];
  // Kunden mit eigenem Schlüssel: konfigurierbares Verbrauchslimit vor dem Aufruf prüfen, danach buchen.
  const ctx = kiSpeicher.getStore();
  const eingabeZeichen = input.system.length + toChatMessages(input).reduce((n, m) => n + m.content.length, 0);
  if (ctx?.quelle === "KUNDE" && ctx.workspaceId) await kiLimitPruefen(ctx.workspaceId, provider, eingabeZeichen, cappedTokens(input.maxTokens));
  try {
    const text = await call(input);
    if (ctx?.quelle === "KUNDE" && ctx.workspaceId) await kiVerbrauchBuchen(ctx.workspaceId, provider, eingabeZeichen, text.length).catch(() => undefined);
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
  const kunde = kiSpeicher.getStore()?.quelle === "KUNDE";
  const wanted = kunde ? "" : (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  if ((wanted === "anthropic" || wanted === "openai" || wanted === "gemini") && hasKey(wanted)) return wanted;
  for (const p of ["anthropic", "openai", "gemini"] as const) if (hasKey(p)) return p;
  return "template";
}
