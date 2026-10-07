import type { Locale } from "@/i18n/config";
import { formatEur } from "@/lib/pricing";

/**
 * Zentrale Paketdefinition für SECRET 58: zwei Pakete, "Pro" und "Maxi",
 * wie im Auftrag festgelegt. Diese Datei ist die EINZIGE Quelle der
 * Wahrheit für Preis, Kontingente und Stripe-Zuordnung — Verkaufsseite
 * (/buy), Checkout-Route und Kontingent-Durchsetzung (lib/quota.ts) lesen
 * ausschließlich von hier, nie eigene Kopien der Preise/Limits. Der Preis
 * wird serverseitig immer aus `priceCents` berechnet, nie aus einem vom
 * Client mitgeschickten Betrag.
 *
 * Beide Pakete schalten denselben vollen Funktionsumfang frei (alle 14
 * Agenten, Voice Studio, Video Studio — kein Feature-Gating zwischen den
 * Paketen). Der Unterschied liegt ausschließlich in den monatlichen
 * Kontingenten, genau wie es die Preisanalyse (docs/preisanalyse.html)
 * bereits für die Autopilot-Größen festlegt ("Staffelung ausschließlich
 * nach Menge, nie nach Funktionen").
 *
 * WICHTIG: Die Kontingent-Zahlen unten (ideasPerMonth/videosPerMonth/
 * voiceGenerationsPerMonth) sind ein begründeter Startwert, kein vom
 * Auftraggeber verbindlich festgelegter Wert — nur die beiden Preise
 * (590 € Pro / 797 € Maxi) wurden explizit bestätigt. Bitte vor dem
 * echten Verkaufsstart prüfen/anpassen (siehe Projektbericht).
 */
export type PackageId = "pro" | "maxi";

export interface PackageDefinition {
  id: PackageId;
  name: string;
  /** Bruttopreis in ganzen Euro — nur für Anzeige, nie für Berechnung. */
  priceEur: number;
  /** Bruttopreis in Cent (kleinste Währungseinheit) — einzige Quelle für Stripe/Checkout. */
  priceCents: number;
  /** Name der Umgebungsvariable mit der Stripe-Price-ID dieses Pakets. */
  stripePriceEnvVar: "STRIPE_PRICE_ID_PRO" | "STRIPE_PRICE_ID_MAXI";
  quotas: {
    ideasPerMonth: number;
    videosPerMonth: number;
    voiceGenerationsPerMonth: number;
  };
}

export const PACKAGES: Record<PackageId, PackageDefinition> = {
  pro: {
    id: "pro",
    name: "Pro",
    priceEur: 590,
    priceCents: 59_000,
    stripePriceEnvVar: "STRIPE_PRICE_ID_PRO",
    quotas: { ideasPerMonth: 60, videosPerMonth: 15, voiceGenerationsPerMonth: 20 },
  },
  maxi: {
    id: "maxi",
    name: "Maxi",
    priceEur: 797,
    priceCents: 79_700,
    stripePriceEnvVar: "STRIPE_PRICE_ID_MAXI",
    quotas: { ideasPerMonth: 150, videosPerMonth: 40, voiceGenerationsPerMonth: 50 },
  },
};

export const PACKAGE_IDS: PackageId[] = ["pro", "maxi"];

export function isPackageId(value: unknown): value is PackageId {
  return value === "pro" || value === "maxi";
}

export function getPackage(id: PackageId): PackageDefinition {
  return PACKAGES[id];
}

export function formatPackagePriceEur(id: PackageId, locale: Locale): string {
  return formatEur(locale, PACKAGES[id].priceEur);
}

const PACKAGE_DISPLAY_NAME_BY_LOCALE: Record<Locale, (pkg: PackageDefinition) => string> = {
  de: (pkg) => `SECRET 58 ${pkg.name}`,
  en: (pkg) => `SECRET 58 ${pkg.name}`,
  es: (pkg) => `SECRET 58 ${pkg.name}`,
  fr: (pkg) => `SECRET 58 ${pkg.name}`,
};

export function getPackageDisplayName(id: PackageId, locale: Locale): string {
  const fn = PACKAGE_DISPLAY_NAME_BY_LOCALE[locale] ?? PACKAGE_DISPLAY_NAME_BY_LOCALE.de;
  return fn(PACKAGES[id]);
}
