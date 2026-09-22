import { generateJson } from "@/lib/ai/generateJson";
import { brandContextPrompt, type BrandDNA } from "@/lib/brand";

export interface HashtagResult {
  hashtags: string[];
  keywords: string[];
}

const STOPWORDS = new Set([
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer",
  "und", "oder", "mit", "für", "von", "bei", "auf", "aus", "als", "ist", "sind",
  "the", "a", "an", "and", "or", "with", "for", "from", "at", "on", "is", "are", "to",
]);

function cleanWord(word: string): string {
  return word.replace(/[.,!?:;"'„“()]+$/g, "").replace(/^[.,!?:;"'„“()]+/g, "");
}

function slugifyTag(word: string): string {
  return (
    "#" +
    word
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "")
  );
}

function templateHashtags(topic: string, brand?: BrandDNA | null): HashtagResult {
  const words = topic
    .split(/\s+/)
    .map(cleanWord)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()));
  const keywordWords = words.slice(0, 4);
  const brandTags = (brand?.topics ?? []).slice(0, 3).map(slugifyTag);
  const topicTags = keywordWords.map(slugifyTag).filter((tag) => tag.length > 1);
  const hashtags = Array.from(
    new Set([...topicTags, ...brandTags, "#KI", "#SocialMedia", "#ContentMarketing"])
  ).slice(0, 10);
  return {
    hashtags,
    keywords: Array.from(new Set([...keywordWords, ...(brand?.topics ?? [])])).slice(0, 8),
  };
}

export async function generateHashtags(input: {
  topic: string;
  platform?: string;
  brand?: BrandDNA | null;
}): Promise<{ result: HashtagResult; provider: string }> {
  const { data, provider } = await generateJson<HashtagResult>({
    system:
      "Du bist der HashtagAgent von SECRET 58. Du erzeugst relevante, plattformgerechte Hashtags und SEO-Keywords.",
    prompt: [
      brandContextPrompt(input.brand ?? null),
      `Thema: ${input.topic}`,
      input.platform ? `Plattform: ${input.platform}` : "",
      'Gib ein JSON-Objekt zurück: { "hashtags": string[] (5-10 Einträge, mit #), "keywords": string[] (5-8 Einträge, ohne #) }.',
    ]
      .filter(Boolean)
      .join("\n"),
    fallback: () => templateHashtags(input.topic, input.brand),
  });

  return { result: data, provider };
}
