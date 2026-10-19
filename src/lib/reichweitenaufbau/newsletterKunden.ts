import { createHash } from "node:crypto";
import { isEmailConfigured } from "@/lib/email";

export * from "@/lib/reichweitenaufbau/newsletterRegeln";

/**
 * Newsletter für Kunden-Workspaces (getrennt vom SECRET-58-eigenen Newsletter).
 * Versandmodus ECHT nur, wenn ein Versanddienst eingerichtet ist UND
 * REICHWEITE_NEWSLETTER_ECHTVERSAND=1 gesetzt ist. Sonst DEMO: es wird keine
 * E-Mail versendet, alles ist als Demo gekennzeichnet.
 */
export type VersandModus = "ECHT" | "DEMO";

export function versandModus(): VersandModus {
  return isEmailConfigured() && process.env.REICHWEITE_NEWSLETTER_ECHTVERSAND === "1" ? "ECHT" : "DEMO";
}

export function ausgabeHash(betreff: string, text: string): string {
  return createHash("sha256").update(`${betreff}\n${text}`).digest("hex");
}
