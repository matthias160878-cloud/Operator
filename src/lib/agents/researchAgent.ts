import { generateJson } from "@/lib/ai/generateJson";
import { brandContextPrompt, type BrandDNA } from "@/lib/brand";

export interface ResearchBrief {
  summary: string;
  keyPoints: string[];
  audienceQuestions: string[];
  risks: string[];
}

function templateResearch(topic: string): ResearchBrief {
  return {
    summary: `Kurzüberblick zu "${topic}": Das Thema gewinnt an Relevanz und eignet sich für mehrere Content-Formate.`,
    keyPoints: [
      `Warum "${topic}" gerade jetzt relevant ist`,
      "Konkrete Beispiele aus der Praxis",
      "Häufige Missverständnisse",
    ],
    audienceQuestions: [
      `Was bedeutet "${topic}" konkret für meinen Alltag?`,
      "Wo fange ich am besten an?",
    ],
    risks: [
      "Ohne echte KI-Recherche/Quellenanbindung bleiben Aussagen allgemein — bei Bedarf ANTHROPIC_API_KEY oder OPENAI_API_KEY konfigurieren.",
    ],
  };
}

export async function researchTopic(input: {
  topic: string;
  brand?: BrandDNA | null;
}): Promise<{ brief: ResearchBrief; provider: string }> {
  const { data, provider } = await generateJson<ResearchBrief>({
    system:
      "Du bist der ResearchAgent von SECRET 58. Du bereitest ein kurzes, sachliches Research-Briefing für die Content-Strategie vor.",
    prompt: [
      brandContextPrompt(input.brand ?? null),
      `Thema: ${input.topic}`,
      'Gib ein JSON-Objekt zurück: { "summary": string, "keyPoints": string[], "audienceQuestions": string[], "risks": string[] }.',
    ].join("\n"),
    fallback: () => templateResearch(input.topic),
  });

  return { brief: data, provider };
}
