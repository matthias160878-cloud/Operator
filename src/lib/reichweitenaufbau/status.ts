/**
 * Gemeinsame Statusleiste: Entwurf → Prüfung → freigegeben → geplant →
 * tatsächlich veröffentlicht/versendet → ausgewertet. „Umgesetzt“ gilt nur bei
 * bestätigter Aktion (z. B. publishedAt gesetzt), nie bei bloßem Klick.
 */
export const STUFEN = ["ENTWURF", "PRUEFUNG", "FREIGEGEBEN", "GEPLANT", "UMGESETZT", "AUSGEWERTET"] as const;
export type Stufe = (typeof STUFEN)[number];
export const STUFEN_LABEL: Record<Stufe, string> = {
  ENTWURF: "Entwurf",
  PRUEFUNG: "Prüfung",
  FREIGEGEBEN: "Freigegeben",
  GEPLANT: "Geplant",
  UMGESETZT: "Veröffentlicht / versendet",
  AUSGEWERTET: "Ausgewertet",
};

export function stufeInhalt(status: string, hatAuswertung: boolean): Stufe | null {
  switch (status) {
    case "DRAFT":
    case "REJECTED":
      return "ENTWURF";
    case "IN_REVIEW":
      return "PRUEFUNG";
    case "APPROVED":
      return "FREIGEGEBEN";
    case "SCHEDULED":
      return "GEPLANT";
    case "PUBLISHED":
      return hatAuswertung ? "AUSGEWERTET" : "UMGESETZT";
    default:
      return null;
  }
}

export function stufeAusgabe(status: string): Stufe | null {
  return (
    ({ ENTWURF: "ENTWURF", PRUEFUNG: "PRUEFUNG", FREIGEGEBEN: "FREIGEGEBEN", GEPLANT: "GEPLANT", VERSENDET: "UMGESETZT" } as Record<string, Stufe>)[status] ??
    null
  ); // VERSENDET_DEMO zählt bewusst nicht als tatsächlich versendet
}

export function stufeWerbeplan(status: string, gemeldeteAusgabenCent: number | null): Stufe | null {
  if (gemeldeteAusgabenCent !== null) return "UMGESETZT";
  return ({ ENTWURF: "ENTWURF", PRUEFUNG: "PRUEFUNG", FREIGEGEBEN: "FREIGEGEBEN" } as Record<string, Stufe>)[status] ?? null;
}

export function zaehleStufen(stufen: (Stufe | null)[]): Record<Stufe, number> {
  const z = Object.fromEntries(STUFEN.map((s) => [s, 0])) as Record<Stufe, number>;
  for (const s of stufen) if (s) z[s]++;
  return z;
}

export interface Lage {
  inhalteInPruefung: number;
  inhalteFreigegebenOhneVeroeffentlichung: number;
  variantenOhneAussage: number;
  kooperationenOhneNaechstenSchritt: number;
  kooperationenTerminBald: number;
  werbeplaeneFreigegeben: number;
  werbeplaeneInPruefung: number;
  ausgabenGeplant: number;
  ausgabenInPruefung: number;
  newsletterModus: "ECHT" | "DEMO";
  newsletterSeiten: number;
  plattformStatistikAngebunden: boolean;
  /** Vereinbarte/umgesetzte Kooperationen ohne geklärte Werbekennzeichnung. */
  kooperationenOhneKennzeichnung?: number;
  /** Freigeschaltete Bausteine; ohne Angabe gelten beide als freigeschaltet. */
  newsletterAktiv?: boolean;
  werbungAktiv?: boolean;
}

/** Nächste Schritte als Vorschläge – regelbasiert und nachvollziehbar, keine Erfolgsprognose. */
export function naechsteSchritte(l: Lage): { text: string; tab: string; art: "AKTION" | "FEHLT" }[] {
  const s: { text: string; tab: string; art: "AKTION" | "FEHLT" }[] = [];
  if (l.inhalteInPruefung) s.push({ text: `${l.inhalteInPruefung} Inhalt(e) warten auf Prüfung in der Content Factory.`, tab: "ideen", art: "AKTION" });
  if (l.inhalteFreigegebenOhneVeroeffentlichung)
    s.push({ text: `${l.inhalteFreigegebenOhneVeroeffentlichung} freigegebene(r) Inhalt(e) noch nicht veröffentlicht.`, tab: "ideen", art: "AKTION" });
  if (l.variantenOhneAussage) s.push({ text: `${l.variantenOhneAussage} Variantenvergleich(e) ohne belastbare Aussage – Messwerte nachtragen oder Laufzeit abwarten.`, tab: "varianten", art: "AKTION" });
  if (l.kooperationenOhneNaechstenSchritt) s.push({ text: `${l.kooperationenOhneNaechstenSchritt} Kooperation(en) ohne nächsten Schritt.`, tab: "kooperationen", art: "AKTION" });
  if (l.kooperationenTerminBald) s.push({ text: `${l.kooperationenTerminBald} Kooperationstermin(e) in den nächsten 7 Tagen.`, tab: "kooperationen", art: "AKTION" });
  if (l.kooperationenOhneKennzeichnung) s.push({ text: `${l.kooperationenOhneKennzeichnung} Kooperation(en): Werbekennzeichnung noch nicht geklärt.`, tab: "kooperationen", art: "FEHLT" });
  const werbung = l.werbungAktiv !== false;
  const newsletter = l.newsletterAktiv !== false;
  if (werbung && l.werbeplaeneInPruefung) s.push({ text: `${l.werbeplaeneInPruefung} Werbeplan/-pläne zur Freigabe (Betrag, Laufzeit, Ziel bestätigen).`, tab: "werbung", art: "AKTION" });
  if (werbung && l.werbeplaeneFreigegeben) s.push({ text: `${l.werbeplaeneFreigegeben} freigegebene(r) Werbeplan/-pläne: als Entwurf exportieren und im Werbekonto selbst anlegen (keine Werbeanbindung).`, tab: "werbung", art: "AKTION" });
  if (newsletter && l.ausgabenInPruefung) s.push({ text: `${l.ausgabenInPruefung} Newsletter-Ausgabe(n) in Prüfung.`, tab: "newsletter", art: "AKTION" });
  if (newsletter && l.ausgabenGeplant && l.newsletterModus === "DEMO") s.push({ text: `${l.ausgabenGeplant} geplante Ausgabe(n) – Versand nur als Demo möglich, Versanddienst fehlt.`, tab: "newsletter", art: "FEHLT" });
  if (newsletter && !l.newsletterSeiten) s.push({ text: "Noch keine Newsletter-Anmeldeseite angelegt.", tab: "newsletter", art: "AKTION" });
  if (newsletter && l.newsletterModus === "DEMO") s.push({ text: "Newsletter-Versanddienst nicht freigeschaltet – Anmeldungen und Versand laufen nur als Demo.", tab: "newsletter", art: "FEHLT" });
  if (!l.plattformStatistikAngebunden) s.push({ text: "Plattform-Statistiken nicht angebunden – Messwerte nur manuell oder als Demo.", tab: "varianten", art: "FEHLT" });
  return s;
}

/** Anzahl Termine in den nächsten `tage` Tagen. */
export function termineBald(termine: (Date | null)[], tage = 7, jetzt = Date.now()): number {
  return termine.filter((t) => t && t.getTime() > jetzt && t.getTime() < jetzt + tage * 86_400_000).length;
}
