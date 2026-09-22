import { generateText, type TextGenProvider } from "@/lib/ai/textGenerator";

export interface GenerateJsonInput<T> {
  system: string;
  prompt: string;
  maxTokens?: number;
  fallback: () => T;
}

export interface GenerateJsonResult<T> {
  data: T;
  provider: TextGenProvider;
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{") === -1
    ? candidate.indexOf("[")
    : candidate.indexOf("{");
  const endBrace = candidate.lastIndexOf("}");
  const endBracket = candidate.lastIndexOf("]");
  const end = Math.max(endBrace, endBracket);
  if (start === -1 || end === -1) return candidate.trim();
  return candidate.slice(start, end + 1);
}

/**
 * Fordert strukturierte JSON-Antworten beim konfigurierten KI-Provider an.
 * Ohne Provider (oder bei Parse-Fehlern) greift ein deterministischer
 * Fallback, damit Content Brain, Idea-, Script- und Hook-Engine auch ohne
 * KI-Zugang lauffähig bleiben (siehe Abschnitt 42 des Master-Prompts).
 */
export async function generateJson<T>(
  input: GenerateJsonInput<T>
): Promise<GenerateJsonResult<T>> {
  const { text, provider } = await generateText({
    system: `${input.system}\n\nAntworte AUSSCHLIESSLICH mit validem JSON, ohne Kommentare oder Markdown-Codefences.`,
    prompt: input.prompt,
    maxTokens: input.maxTokens,
  });

  if (provider === "template" || !text.trim()) {
    return { data: input.fallback(), provider: "template" };
  }

  try {
    const parsed = JSON.parse(extractJson(text)) as T;
    return { data: parsed, provider };
  } catch {
    return { data: input.fallback(), provider: "template" };
  }
}
