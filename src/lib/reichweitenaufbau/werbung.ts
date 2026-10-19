/**
 * Werbeplanung ohne Werbe-Schnittstelle: Entwurf, Prüfung, Freigabe, Export.
 * In der Vorschau wird nie eine bezahlte Kampagne gestartet. Geplante Budgets
 * und gemeldete Ausgaben bleiben getrennt; eine Ausgabenobergrenze wird nicht
 * zugesagt, weil sie technisch nicht von dieser App durchgesetzt wird.
 */

export const WERBE_PLATTFORMEN = ["META", "YOUTUBE_GOOGLE", "LINKEDIN", "TIKTOK"] as const;
export type WerbePlattform = (typeof WERBE_PLATTFORMEN)[number];

export const WERBE_ZIELE = {
  REICHWEITE: "Reichweite / Bekanntheit",
  VIDEOAUFRUFE: "Videoaufrufe",
  TRAFFIC: "Besuche der Zielseite",
  LEADS: "Anfragen / Leads",
  NEWSLETTER: "Newsletter-Anmeldungen",
} as const;

export const ZIELGRUPPEN_ARTEN = {
  NEU: "Neue Zielgruppe (Interessen, Region, Alter)",
  ERNEUT: "Erneute Ansprache (Retargeting)",
  AEHNLICH: "Ähnliche Zielgruppe (Lookalike)",
} as const;
export type ZielgruppenArt = keyof typeof ZIELGRUPPEN_ARTEN;

/** Stand der Recherche: 19.10.2026. Vor einer echten Anbindung erneut in den offiziellen Unterlagen prüfen. */
export const PLATTFORM_VORAUSSETZUNGEN: Record<
  WerbePlattform,
  { label: string; schnittstelle: string; voraussetzungen: string[]; zielgruppen: Record<ZielgruppenArt, string>; quelle: string }
> = {
  META: {
    label: "Meta (Facebook/Instagram)",
    schnittstelle: "Marketing API",
    voraussetzungen: [
      "Meta-App mit Berechtigungen ads_management / ads_read",
      "Für fremde Werbekonten: Advanced Access über App Review und Business-Verifizierung",
      "Werbekonto mit hinterlegter Zahlungsart beim Kunden",
    ],
    zielgruppen: {
      NEU: "möglich",
      ERNEUT: "möglich über Custom Audiences (Website-Pixel/Conversions API mit Einwilligung, Interaktionen); Nutzungsbedingungen müssen akzeptiert sein",
      AEHNLICH: "möglich über Lookalike Audiences aus einer Custom Audience; für Wohnen, Kredit und Beschäftigung eingeschränkt",
    },
    quelle: "https://developers.facebook.com/docs/marketing-api/get-started/authorization",
  },
  YOUTUBE_GOOGLE: {
    label: "YouTube (über Google Ads)",
    schnittstelle: "Google Ads API",
    voraussetzungen: [
      "Google-Ads-Verwaltungskonto mit Developer Token",
      "Für echte Konten mindestens Basic Access (Antrag bei Google)",
      "OAuth-Zugang des Kunden zu seinem Google-Ads-Konto",
    ],
    zielgruppen: {
      NEU: "möglich",
      ERNEUT: "möglich über eigene Datensegmente (z. B. Kanal-Interaktionen, Website mit Einwilligung)",
      AEHNLICH: "abhängig vom Kampagnentyp; vor Anbindung prüfen",
    },
    quelle: "https://developers.google.com/google-ads/api/docs/access-levels",
  },
  LINKEDIN: {
    label: "LinkedIn",
    schnittstelle: "LinkedIn Marketing API (Advertising API)",
    voraussetzungen: ["Zugang zur Advertising API (Antrag bei LinkedIn)", "Kampagnen-Manager-Konto des Kunden"],
    zielgruppen: {
      NEU: "möglich",
      ERNEUT: "möglich über Matched Audiences (Website-Retargeting, Kontakt- oder Firmenlisten)",
      AEHNLICH: "Lookalike Audiences wurden am 29.02.2024 eingestellt – stattdessen Predictive Audiences bzw. Audience Expansion",
    },
    quelle: "https://www.linkedin.com/help/lms/answer/94287",
  },
  TIKTOK: {
    label: "TikTok",
    schnittstelle: "TikTok API for Business (Marketing API)",
    voraussetzungen: ["Entwickler-Registrierung und App-Freigabe durch TikTok", "Werbekonto des Kunden", "Berechtigung Audience Management für Zielgruppen"],
    zielgruppen: {
      NEU: "möglich",
      ERNEUT: "möglich über Custom Audiences (Freigabe/Verarbeitung bis 48 h)",
      AEHNLICH: "möglich über Lookalike Audiences aus einer Custom Audience",
    },
    quelle: "https://business-api.tiktok.com/portal/docs",
  },
};

export interface PlanKern {
  plattform: string;
  ziel: string;
  startAm: Date;
  endeAm: Date;
  tagesbudgetCent: number;
  gesamtbudgetCent: number;
}

export function laufzeitTage(p: Pick<PlanKern, "startAm" | "endeAm">): number {
  return Math.max(1, Math.round((p.endeAm.getTime() - p.startAm.getTime()) / 86_400_000) + 1);
}

export function pruefePlan(p: PlanKern): string | null {
  if (Number.isNaN(p.startAm.getTime()) || Number.isNaN(p.endeAm.getTime())) return "Bitte Start und Ende angeben.";
  if (p.endeAm < p.startAm) return "Das Ende liegt vor dem Start.";
  if (p.tagesbudgetCent <= 0 || p.gesamtbudgetCent <= 0) return "Tages- und Gesamtbudget müssen größer als 0 sein.";
  if (p.gesamtbudgetCent < p.tagesbudgetCent) return "Das Gesamtbudget ist kleiner als das Tagesbudget.";
  return null;
}

export function planHinweise(p: PlanKern): string[] {
  const h: string[] = [];
  const max = p.tagesbudgetCent * laufzeitTage(p);
  if (p.gesamtbudgetCent > max) h.push(`Gesamtbudget ist höher als Tagesbudget × ${laufzeitTage(p)} Tage – es würde nicht ausgeschöpft.`);
  if (p.gesamtbudgetCent < max) h.push("Tagesbudget × Laufzeit liegt über dem Gesamtbudget – die Plattform beendet die Auslieferung ggf. früher.");
  h.push("Plattformen können das Tagesbudget an einzelnen Tagen überschreiten. Eine feste Obergrenze setzt nur die Plattform selbst – diese App garantiert keine.");
  return h;
}

const tag = (d: Date) => d.toISOString().slice(0, 10);

/** Freigabe nur, wenn Betrag, Laufzeit und Ziel ausdrücklich so bestätigt werden, wie sie im Plan stehen. */
export function pruefeFreigabe(
  p: PlanKern,
  b: { gesamtbudgetCent: number; startAm: string; endeAm: string; ziel: string; bestaetigt: boolean }
): string | null {
  if (!b.bestaetigt) return "Bitte die Freigabe ausdrücklich bestätigen.";
  if (b.gesamtbudgetCent !== p.gesamtbudgetCent) return "Der bestätigte Betrag stimmt nicht mit dem Plan überein.";
  if (b.startAm !== tag(p.startAm) || b.endeAm !== tag(p.endeAm)) return "Die bestätigte Laufzeit stimmt nicht mit dem Plan überein.";
  if (b.ziel !== p.ziel) return "Das bestätigte Ziel stimmt nicht mit dem Plan überein.";
  return null;
}

export const euro = (cent: number) => (cent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export interface ExportPlan extends PlanKern {
  titel: string;
  zielgruppe: string;
  zielgruppenArt: string;
  region: string;
  sprache: string;
  zielUrl: string;
  erfolgsmessung: string;
  status: string;
  freigegebenAm: Date | null;
  istDemo: boolean;
  inhalt: string;
}

export function exportJson(p: ExportPlan) {
  return {
    hinweis: "Kampagnenentwurf aus SECRET 58. Nicht gestartet. Bitte im Werbekonto der Plattform selbst anlegen und dort Budget-Obergrenzen setzen.",
    demo: p.istDemo,
    freigabe: p.status === "FREIGEGEBEN" ? { freigegebenAm: p.freigegebenAm?.toISOString() ?? null } : "nicht freigegeben",
    titel: p.titel,
    plattform: PLATTFORM_VORAUSSETZUNGEN[p.plattform as WerbePlattform]?.label ?? p.plattform,
    ziel: WERBE_ZIELE[p.ziel as keyof typeof WERBE_ZIELE] ?? p.ziel,
    inhalt: p.inhalt,
    zielgruppe: p.zielgruppe,
    zielgruppenArt: ZIELGRUPPEN_ARTEN[p.zielgruppenArt as ZielgruppenArt] ?? p.zielgruppenArt,
    region: p.region,
    sprache: p.sprache,
    laufzeit: { start: tag(p.startAm), ende: tag(p.endeAm), tage: laufzeitTage(p) },
    budget: { tagesbudget: p.tagesbudgetCent / 100, gesamtbudget: p.gesamtbudgetCent / 100, waehrung: "EUR", art: "geplant" },
    zielseite: p.zielUrl,
    erfolgsmessung: p.erfolgsmessung,
  };
}

function csvFeld(v: unknown): string {
  const s = String(v ?? "");
  const sicher = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s; // Schutz vor Formel-Injektion in Tabellenprogrammen
  return `"${sicher.replace(/"/g, '""')}"`;
}

export function exportCsv(p: ExportPlan): string {
  const j = exportJson(p);
  const zeilen: [string, unknown][] = [
    ["Hinweis", j.hinweis],
    ["Demo", p.istDemo ? "ja" : "nein"],
    ["Freigabe", typeof j.freigabe === "string" ? j.freigabe : `freigegeben am ${j.freigabe.freigegebenAm}`],
    ["Titel", j.titel],
    ["Plattform", j.plattform],
    ["Ziel", j.ziel],
    ["Inhalt", j.inhalt],
    ["Zielgruppe", j.zielgruppe],
    ["Zielgruppen-Art", j.zielgruppenArt],
    ["Region", j.region],
    ["Sprache", j.sprache],
    ["Start", j.laufzeit.start],
    ["Ende", j.laufzeit.ende],
    ["Tagesbudget (EUR, geplant)", j.budget.tagesbudget],
    ["Gesamtbudget (EUR, geplant)", j.budget.gesamtbudget],
    ["Zielseite", j.zielseite],
    ["Erfolgsmessung", j.erfolgsmessung],
  ];
  return "﻿" + zeilen.map(([k, v]) => `${csvFeld(k)};${csvFeld(v)}`).join("\r\n") + "\r\n";
}

export interface KampagnenBeleg {
  kampagneId: string;
  titel: string;
  anfragen: number;
  zielKlicks: number;
  aufrufe: number;
  newsletterBestaetigt: number;
  istDemo: boolean;
}

/** Vorschläge zum Bewerben nur auf Basis gemessener Ergebnisse, mit nachvollziehbarer Begründung. */
export function bewerbungsVorschlaege(belege: KampagnenBeleg[]) {
  return belege
    .filter((b) => b.aufrufe >= 20 && b.anfragen + b.zielKlicks + b.newsletterBestaetigt > 0)
    .sort((a, b) => b.anfragen - a.anfragen || b.newsletterBestaetigt - a.newsletterBestaetigt || b.zielKlicks - a.zielKlicks)
    .slice(0, 3)
    .map((b) => ({
      ...b,
      begruendung: `${b.anfragen} Anfragen, ${b.newsletterBestaetigt} bestätigte Newsletter-Anmeldungen und ${b.zielKlicks} Klicks zur Zielseite bei ${b.aufrufe} Linkaufrufen (eigene Messung).${b.istDemo ? " DEMO-Daten." : ""} Gute organische Werte sind kein Beleg, dass bezahlte Ausspielung ähnlich wirkt.`,
    }));
}
