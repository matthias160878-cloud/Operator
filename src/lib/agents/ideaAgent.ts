import { generateJson } from "@/lib/ai/generateJson";
import { brandContextPrompt, type BrandDNA } from "@/lib/brand";

export interface GeneratedIdea {
  title: string;
  hook: string;
  targetAudience: string;
  platform: string;
  format: string;
  goal: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimatedMinutes: number;
}

const IDEA_TEMPLATES: Array<Omit<GeneratedIdea, "title" | "hook">> = [
  { targetAudience: "Bestehende Follower", platform: "YOUTUBE", format: "Longform Video", goal: "Reichweite", priority: "HIGH", estimatedMinutes: 240 },
  { targetAudience: "Neue Zielgruppe", platform: "TIKTOK", format: "Short", goal: "Reichweite", priority: "MEDIUM", estimatedMinutes: 45 },
  { targetAudience: "Fachpublikum", platform: "LINKEDIN", format: "Post", goal: "Thought Leadership", priority: "MEDIUM", estimatedMinutes: 30 },
  { targetAudience: "Bestehende Follower", platform: "INSTAGRAM", format: "Reel", goal: "Engagement", priority: "MEDIUM", estimatedMinutes: 60 },
  { targetAudience: "Interessierte", platform: "BLOG", format: "Artikel", goal: "SEO", priority: "LOW", estimatedMinutes: 120 },
];

function templateIdeas(topic: string): GeneratedIdea[] {
  return IDEA_TEMPLATES.map((t, i) => ({
    ...t,
    title: `${topic}: ${["Grundlagen", "3 Praxisbeispiele", "Häufige Fehler", "Schritt-für-Schritt", "Ausblick"][i] ?? "Perspektive"}`,
    hook: `${topic} — ${["das Wichtigste in Kürze", "so geht's richtig", "das übersehen die meisten"][i % 3]}.`,
  }));
}

export async function generateIdeas(input: {
  topic: string;
  count?: number;
  brand?: BrandDNA | null;
}): Promise<{ ideas: GeneratedIdea[]; provider: string }> {
  const count = input.count ?? 5;

  const { data, provider } = await generateJson<GeneratedIdea[]>({
    system:
      "Du bist der IdeaAgent von SECRET 58. Du generierst konkrete, umsetzbare Content-Ideen " +
      "(Titel, Hook, Zielgruppe, Plattform, Format, Ziel, Priorität, geschätzte Produktionszeit in Minuten).",
    prompt: [
      brandContextPrompt(input.brand ?? null),
      `Thema: ${input.topic}`,
      `Erzeuge genau ${count} unterschiedliche Ideen für verschiedene Plattformen/Formate.`,
      'Gib ein JSON-Array zurück, je Eintrag: { "title", "hook", "targetAudience", "platform" (YOUTUBE|TIKTOK|INSTAGRAM|LINKEDIN|FACEBOOK|BLOG|NEWSLETTER), "format", "goal", "priority" (LOW|MEDIUM|HIGH), "estimatedMinutes" (number) }.',
    ].join("\n"),
    fallback: () => templateIdeas(input.topic).slice(0, count),
  });

  const ideas = Array.isArray(data) && data.length > 0 ? data : templateIdeas(input.topic);
  return { ideas: ideas.slice(0, count), provider };
}
