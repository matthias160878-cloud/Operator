import { generateJson } from "@/lib/ai/generateJson";
import { brandContextPrompt, type BrandDNA } from "@/lib/brand";

export type HookType =
  | "direkt"
  | "neugierig"
  | "story"
  | "problem"
  | "zahlen"
  | "kontrovers-sachlich"
  | "educational";

export interface HookVariant {
  type: HookType;
  text: string;
}

const HOOK_TYPES: HookType[] = [
  "direkt",
  "neugierig",
  "story",
  "problem",
  "zahlen",
  "kontrovers-sachlich",
  "educational",
];

function templateHooks(topic: string): HookVariant[] {
  return [
    { type: "direkt", text: `${topic} — das musst du jetzt wissen.` },
    { type: "neugierig", text: `Was hier wirklich passiert, überrascht die meisten.` },
    { type: "story", text: `Vor kurzem haben wir uns intensiv mit ${topic} beschäftigt — hier das Ergebnis.` },
    { type: "problem", text: `Das größte Problem bei ${topic}, über das kaum jemand spricht.` },
    { type: "zahlen", text: `3 Dinge, die du über ${topic} wissen solltest.` },
    { type: "kontrovers-sachlich", text: `${topic} wird oft überschätzt — hier die Fakten.` },
    { type: "educational", text: `So funktioniert ${topic} in unter 60 Sekunden erklärt.` },
  ];
}

export async function generateHooks(input: {
  topic: string;
  platform?: string;
  brand?: BrandDNA | null;
}): Promise<{ hooks: HookVariant[]; provider: string }> {
  const { data, provider } = await generateJson<HookVariant[]>({
    system:
      "Du bist der HookAgent von SECRET 58. Du erzeugst kurze, wirkungsvolle Hooks " +
      `für Social-Media-Content. Erlaubte Typen: ${HOOK_TYPES.join(", ")}. ` +
      "Keine irreführenden Clickbait-Aussagen, nur sachlich zugespitzte Hooks.",
    prompt: [
      brandContextPrompt(input.brand ?? null),
      `Thema: ${input.topic}`,
      input.platform ? `Plattform: ${input.platform}` : "",
      `Gib ein JSON-Array mit genau ${HOOK_TYPES.length} Objekten zurück, ` +
        'je Objekt { "type": "<einer der erlaubten Typen>", "text": "<Hook-Text>" }.',
    ]
      .filter(Boolean)
      .join("\n"),
    fallback: () => templateHooks(input.topic),
  });

  const hooks = Array.isArray(data) && data.length > 0 ? data : templateHooks(input.topic);
  return { hooks, provider };
}
