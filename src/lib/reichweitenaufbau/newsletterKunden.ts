import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { sellerProfileComplete } from "@/lib/connect/sellerProfile";
import { resendZugang, type ResendZugang } from "@/lib/zugaenge/service";
import { newsletterFreigeschaltet } from "@/lib/reichweitenaufbau/freischaltung";

export * from "@/lib/reichweitenaufbau/newsletterRegeln";

/**
 * Newsletter für Kunden-Workspaces (getrennt vom SECRET-58-eigenen Newsletter).
 * Versandmodus ECHT nur, wenn der Baustein freigeschaltet ist, der Kunde
 * seinen eigenen Resend-Zugang hinterlegt hat (zuletzt erfolgreich geprüft)
 * und seine Anbieterangaben (Impressum, Datenschutz) vollständig sind.
 * Sonst DEMO: es wird keine E-Mail versendet, alles ist als Demo gekennzeichnet.
 * Der Resend-Zugang des Betreibers wird für Kunden-Newsletter nie verwendet.
 */
export type VersandModus = "ECHT" | "DEMO";

export interface VersandStand {
  modus: VersandModus;
  zugang: ResendZugang | null;
  fehlt: string[];
}

export async function versandStand(workspaceId: string): Promise<VersandStand> {
  const fehlt: string[] = [];
  if (!newsletterFreigeschaltet()) fehlt.push("Newsletter-Baustein nicht freigeschaltet");
  const [zugang, profil] = await Promise.all([resendZugang(workspaceId), prisma.sellerProfile.findUnique({ where: { workspaceId } })]);
  if (!zugang) fehlt.push("eigener Resend-Zugang (Einstellungen → Eigene Zugänge)");
  if (!sellerProfileComplete(profil)) fehlt.push("Anbieterangaben für Impressum und Datenschutz (Verkaufen)");
  return { modus: fehlt.length ? "DEMO" : "ECHT", zugang: fehlt.length ? null : zugang, fehlt };
}

export function ausgabeHash(betreff: string, text: string): string {
  return createHash("sha256").update(`${betreff}\n${text}`).digest("hex");
}
