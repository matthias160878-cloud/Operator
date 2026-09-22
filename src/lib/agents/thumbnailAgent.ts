import { generateJson } from "@/lib/ai/generateJson";
import { brandContextPrompt, type BrandDNA } from "@/lib/brand";

export interface ThumbnailConcept {
  title: string;
  visualIdea: string;
  text: string;
  layout: string;
  cta: string;
  imageDescription: string;
}

function templateThumbnail(topic: string): ThumbnailConcept {
  return {
    title: topic,
    visualIdea: `Nahaufnahme eines Gesichts mit überraschtem Ausdruck, Thema "${topic}" im Hintergrund angedeutet.`,
    text: topic.length > 28 ? `${topic.slice(0, 25)}…` : topic,
    layout: "Text oben links, Gesicht rechts, kontrastreicher Hintergrund.",
    cta: "Jetzt ansehen",
    imageDescription: `Illustratives Bild zu "${topic}" in den Markenfarben, hoher Kontrast, große Typografie.`,
  };
}

/**
 * Erzeugt nur das Konzept (Text/Layout-Idee) für ein Thumbnail — vorbereitet
 * für die Anbindung eines Bildgenerators (Abschnitt 14). Es wird kein Bild
 * erzeugt, solange kein Bildgenerator konfiguriert ist.
 */
export async function generateThumbnailConcept(input: {
  topic: string;
  brand?: BrandDNA | null;
}): Promise<{ concept: ThumbnailConcept; provider: string }> {
  const { data, provider } = await generateJson<ThumbnailConcept>({
    system:
      "Du bist der ThumbnailAgent von SECRET 58. Du entwirfst Thumbnail-Konzepte (kein Bild, nur Text-Konzept).",
    prompt: [
      brandContextPrompt(input.brand ?? null),
      `Thema: ${input.topic}`,
      'Gib ein JSON-Objekt zurück: { "title", "visualIdea", "text", "layout", "cta", "imageDescription" } (alles Strings).',
    ].join("\n"),
    fallback: () => templateThumbnail(input.topic),
  });

  return { concept: data, provider };
}
