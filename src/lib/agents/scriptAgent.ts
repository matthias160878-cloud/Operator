import { generateJson } from "@/lib/ai/generateJson";
import { brandContextPrompt, type BrandDNA } from "@/lib/brand";

export interface ScriptStructure {
  hook: string;
  problem: string;
  value: string;
  example: string;
  payoff: string;
  cta: string;
}

const PLATFORM_LENGTH_HINT: Record<string, string> = {
  YOUTUBE: "Longform, 3-8 Minuten Sprechzeit, ausführliche Erklärungen.",
  TIKTOK: "Sehr kurz, max. 45 Sekunden Sprechzeit, hohes Tempo.",
  INSTAGRAM: "Reel-Format, max. 60 Sekunden Sprechzeit, visuell.",
  LINKEDIN: "Text-lastig, sachlich, max. 1300 Zeichen, kein Video-Skript nötig.",
  FACEBOOK: "Kurz, community-nah, max. 90 Sekunden Sprechzeit.",
  BLOG: "Langform-Artikel, 600-900 Wörter, Absätze mit Zwischenüberschriften.",
  NEWSLETTER: "Persönlicher Ton, kurze Absätze, ein klarer CTA-Link.",
};

function templateScript(topic: string, platform: string): ScriptStructure {
  return {
    hook: `${topic} verändert gerade, wie wir arbeiten.`,
    problem: `Viele unterschätzen, wie groß der Einfluss von ${topic} bereits ist.`,
    value: `Wir zeigen dir die drei wichtigsten Effekte von ${topic} — verständlich erklärt.`,
    example: `Ein konkretes Beispiel: Ein Team spart durch ${topic} mehrere Stunden pro Woche.`,
    payoff: `Am Ende bleibt mehr Zeit für das, was wirklich zählt.`,
    cta:
      platform === "LINKEDIN"
        ? "Wie nutzt ihr das in eurem Team? Schreibt es in die Kommentare."
        : "Folge uns für mehr zu diesem Thema.",
  };
}

export async function generateScript(input: {
  topic: string;
  platform: string;
  hook?: string;
  brand?: BrandDNA | null;
}): Promise<{ script: ScriptStructure; provider: string }> {
  const { data, provider } = await generateJson<ScriptStructure>({
    system:
      "Du bist der ScriptAgent von SECRET 58. Du schreibst plattformgerechte " +
      "Video-/Post-Skripte nach der Struktur Hook -> Problem -> Value -> Example -> Payoff -> CTA.",
    prompt: [
      brandContextPrompt(input.brand ?? null),
      `Thema: ${input.topic}`,
      `Plattform: ${input.platform}`,
      PLATFORM_LENGTH_HINT[input.platform] ?? "",
      input.hook ? `Nutze exakt diesen Hook als Einstieg: ${input.hook}` : "",
      'Gib ein JSON-Objekt zurück mit den Feldern "hook", "problem", "value", "example", "payoff", "cta" (alles Strings, in der Sprache der Brand DNA).',
    ]
      .filter(Boolean)
      .join("\n"),
    fallback: () => {
      const base = templateScript(input.topic, input.platform);
      return input.hook ? { ...base, hook: input.hook } : base;
    },
  });

  return { script: data, provider };
}
