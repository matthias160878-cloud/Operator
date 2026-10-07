import { z } from "zod";
import type { SellerProfile } from "@prisma/client";

/** Nur http(s)-Links — keine javascript:/data:-Adressen auf öffentlichen Seiten. */
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Bitte eine vollständige Adresse mit https:// angeben.");

const text = (max: number) => z.string().trim().max(max);

export const sellerProfileSchema = z.object({
  anbieter: text(200),
  firma: text(200),
  anschrift: text(500),
  email: z.string().trim().max(200).refine((v) => v === "" || z.string().email().safeParse(v).success, "Ungültige E-Mail-Adresse."),
  telefon: text(60),
  ustId: text(40),
  register: text(200),
  aufsicht: text(300),
  verantwortlich: text(200),
  agbUrl: optionalUrl,
  datenschutzUrl: optionalUrl,
  widerrufUrl: optionalUrl,
});

export type SellerProfileInput = z.infer<typeof sellerProfileSchema>;

/**
 * Mindestangaben, ohne die ein Angebot nicht öffentlich sein darf:
 * Name, ladungsfähige Anschrift, E-Mail (§ 5 DDG) und Datenschutzerklärung.
 */
export function sellerProfileMissing(p: Pick<SellerProfile, "anbieter" | "anschrift" | "email" | "datenschutzUrl"> | null): string[] {
  const missing: string[] = [];
  if (!p?.anbieter) missing.push("Name");
  if (!p?.anschrift) missing.push("Anschrift");
  if (!p?.email) missing.push("E-Mail");
  if (!p?.datenschutzUrl) missing.push("Link zur Datenschutzerklärung");
  return missing;
}

export function sellerProfileComplete(p: Parameters<typeof sellerProfileMissing>[0]): boolean {
  return sellerProfileMissing(p).length === 0;
}
