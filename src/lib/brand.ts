import { prisma } from "@/lib/db";
import type { Brand } from "@prisma/client";

export interface BrandDNA {
  name: string;
  description: string;
  targetAudience: string;
  industry: string;
  language: string;
  tonality: string;
  humor: string;
  formality: string;
  preferredWords: string[];
  forbiddenWords: string[];
  preferredCtas: string[];
  brandValues: string[];
  topics: string[];
  colors: string[];
  fonts: string[];
  logoUrl: string | null;
  visualRules: string;
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function toBrandDNA(brand: Brand): BrandDNA {
  return {
    name: brand.name,
    description: brand.description,
    targetAudience: brand.targetAudience,
    industry: brand.industry,
    language: brand.language,
    tonality: brand.tonality,
    humor: brand.humor,
    formality: brand.formality,
    preferredWords: parseJsonArray(brand.preferredWords),
    forbiddenWords: parseJsonArray(brand.forbiddenWords),
    preferredCtas: parseJsonArray(brand.preferredCtas),
    brandValues: parseJsonArray(brand.brandValues),
    topics: parseJsonArray(brand.topics),
    colors: parseJsonArray(brand.colors),
    fonts: parseJsonArray(brand.fonts),
    logoUrl: brand.logoUrl ?? null,
    visualRules: brand.visualRules,
  };
}

export async function getBrandDNA(workspaceId: string): Promise<BrandDNA | null> {
  const brand = await prisma.brand.findUnique({ where: { workspaceId } });
  return brand ? toBrandDNA(brand) : null;
}

export function brandContextPrompt(brand: BrandDNA | null): string {
  if (!brand) return "Keine Brand DNA hinterlegt — nutze einen neutralen, professionellen Ton.";
  return [
    `Marke: ${brand.name}`,
    `Beschreibung: ${brand.description}`,
    `Zielgruppe: ${brand.targetAudience}`,
    `Branche: ${brand.industry}`,
    `Sprache: ${brand.language}`,
    `Tonalität: ${brand.tonality}, Humor: ${brand.humor}, Formalität: ${brand.formality}`,
    brand.preferredWords.length
      ? `Bevorzugte Wörter: ${brand.preferredWords.join(", ")}`
      : "",
    brand.forbiddenWords.length
      ? `Verbotene Wörter (niemals verwenden): ${brand.forbiddenWords.join(", ")}`
      : "",
    brand.preferredCtas.length
      ? `Bevorzugte CTAs: ${brand.preferredCtas.join(", ")}`
      : "",
    brand.brandValues.length ? `Markenwerte: ${brand.brandValues.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
