import { z } from "zod";

/** Gemeinsame Eingabe-Schemas für interne Routen und die externe API (/api/v1). */
export const PLATFORM_VALUES = ["YOUTUBE", "TIKTOK", "INSTAGRAM", "LINKEDIN", "FACEBOOK", "BLOG", "NEWSLETTER"] as const;

const urlField = z.string().trim().url("Bitte eine vollständige URL mit https:// angeben.");

export const seoAnalyzeSchema = z.object({
  url: urlField,
  focusKeyword: z.string().trim().max(100).optional(),
  includePageSpeed: z.boolean().default(false),
  strategy: z.enum(["mobile", "desktop"]).default("mobile"),
});

export const websitePostsSchema = z.object({
  url: urlField,
  platforms: z.array(z.enum(PLATFORM_VALUES)).min(1, "Mindestens eine Plattform wählen."),
  postsPerPlatform: z.number().int().min(1).max(3).default(1),
  instructions: z.string().trim().max(1000).optional(),
});
