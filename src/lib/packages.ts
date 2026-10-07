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
 * KONTINGENT-HERLEITUNG (nicht mehr frei geschätzt, sondern aus den
 * Anbieterkosten in docs/preisanalyse.html zurückgerechnet):
 *
 * Pro/Maxi sind EINMALIGE Zahlungen, aber die Anbieterkosten (Claude/
 * ElevenLabs/Videogenerator, zentral über Betreiber-Keys bereitgestellt,
 * siehe Abschnitt 6 des Auftrags) laufen pro Nutzung weiter — anders als
 * beim geplanten Autopilot-Abo (monatliche Zahlung deckt monatliche
 * Kosten) amortisiert sich ein einmaliger Preis nur über einen
 * begrenzten Zeitraum. Rechengrundlage: Einmalpreis über 12 Monate
 * verteilt (= der im Preismodell ohnehin genannte Zeitraum "12 Monate
 * Updates/Hosting inklusive"), davon ~45 % als Anbieter-Kostenbudget
 * (Rest = Marge, vergleichbar mit der Autopilot-Marge von 58–60 %),
 * verteilt auf die drei kostenpflichtigen Ressourcen mit den in
 * docs/preisanalyse.html genannten Einheitspreisen:
 *   - Idee (Text durch alle Agenten): ≈ 0,07 € / Idee
 *   - KI-Video (30 s): ≈ 0,15 €/nutzbare Sekunde × 30 ≈ 4,50 € / Video
 *   - Sprachausgabe: ≈ 0,17 € / Minute, angenommen ≈ 1 Minute / Generierung
 * Video dominiert die Kosten massiv (4,50 € ggü. 0,07 € oder 0,17 €) —
 * deshalb bleibt das Video-Kontingent bei beiden Paketen bewusst klein;
 * wer regelmäßig mehr Videos braucht, ist beim geplanten (noch nicht
 * buchbaren) Autopilot-Abo richtig, das laufende Kosten laufend deckt.
 *   Pro (590 €): Budget ≈ 590 × 0,45 / 12 ≈ 22 €/Monat
 *     → 40 Ideen (2,80 €) + 3 Videos (13,50 €) + 20 Sprachausgaben (3,40 €)
 *       ≈ 19,70 €/Monat (≈ 60 % Marge auf 49,17 €/Monat Äquivalent)
 *   Maxi (797 €): Budget ≈ 797 × 0,45 / 12 ≈ 30 €/Monat
 *     → 80 Ideen (5,60 €) + 4 Videos (18,00 €) + 35 Sprachausgaben (5,95 €)
 *       ≈ 29,55 €/Monat (≈ 55 % Marge auf 66,42 €/Monat Äquivalent)
 *
 * Trotzdem weiterhin ein Startwert, keine vom Auftraggeber verbindlich
 * bestätigte Vorgabe — nur die beiden Preise (590 €/797 €) sind bestätigt.
 * Die Annahmen (12-Monats-Horizont, 45 % Kostenanteil, Anbieterpreise
 * Stand der Preisanalyse) sind explizit genannt, damit sie gezielt
 * angepasst werden können. Siehe README, Abschnitt
 * "Monatliche Kontingente", für dieselbe Herleitung in Prosa.
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
    quotas: { ideasPerMonth: 40, videosPerMonth: 3, voiceGenerationsPerMonth: 20 },
  },
  maxi: {
    id: "maxi",
    name: "Maxi",
    priceEur: 797,
    priceCents: 79_700,
    stripePriceEnvVar: "STRIPE_PRICE_ID_MAXI",
    quotas: { ideasPerMonth: 80, videosPerMonth: 4, voiceGenerationsPerMonth: 35 },
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
