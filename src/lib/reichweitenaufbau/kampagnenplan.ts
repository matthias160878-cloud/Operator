/**
 * Kampagnenassistent: Pflichtangaben einer Kampagne und Vorschlag für einen
 * bearbeitbaren Ablauf. Reine Logik, auch im Browser nutzbar.
 */
export const HAUPTKENNZAHLEN = {
  LINKAUFRUFE: { label: "Aufrufe der Kampagnenlinks", ereignis: "AUFRUF" },
  ZIEL_KLICKS: { label: "Klicks zur Angebotsseite", ereignis: "ZIEL_KLICK" },
  ANFRAGEN: { label: "Anfragen über das Formular", ereignis: "ANFRAGE" },
  WEITEREMPFEHLUNGEN: { label: "Selbst erzeugte Empfehlungslinks", ereignis: "LINK_ERZEUGT" },
  NEWSLETTER: { label: "Bestätigte Newsletter-Anmeldungen", ereignis: null },
} as const;
export type Hauptkennzahl = keyof typeof HAUPTKENNZAHLEN;

export const SCHRITT_ARTEN = {
  INHALT: "Inhalt",
  PRUEFUNG: "Prüfung",
  FREIGABE: "Freigabe",
  VEROEFFENTLICHUNG: "Veröffentlichung",
  WERBUNG: "Werbung",
  AUSWERTUNG: "Auswertung",
  SONSTIGES: "Sonstiges",
} as const;
export type SchrittArt = keyof typeof SCHRITT_ARTEN;

export interface KampagnenEingabe {
  titel: string;
  ziel: string;
  hauptkennzahl: string;
  zielgruppe: string;
  zielUrl: string;
  startAm: string; // YYYY-MM-DD
  endeAm: string;
  verantwortlichId: string;
  verantwortlichName?: string;
  /** null = kein Budget */
  budgetCent: number | null;
}

/** Fehlende Pflichtangaben einer bestehenden Kampagne (für Hinweise in der Übersicht). */
export function kampagneFehlt(k: { ziel: string; hauptkennzahl: string; zielgruppe: string; zielUrl: string; startAm: Date | string | null; endeAm: Date | string | null; verantwortlichId: string | null }): string[] {
  const f: string[] = [];
  if (!k.ziel.trim()) f.push("Ziel");
  if (!(k.hauptkennzahl in HAUPTKENNZAHLEN)) f.push("Hauptkennzahl");
  if (!k.zielgruppe.trim()) f.push("Zielgruppe");
  if (!k.zielUrl.trim()) f.push("Zielseite");
  if (!k.startAm || !k.endeAm) f.push("Zeitraum");
  if (!k.verantwortlichId) f.push("Verantwortlicher für Freigaben");
  return f;
}

const tag = (s: string) => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

export function pruefeKampagne(e: KampagnenEingabe): string | null {
  if (!e.titel.trim()) return "Bitte einen Titel angeben.";
  if (e.ziel.trim().length < 5) return "Bitte ein konkretes Ziel angeben (z. B. „20 Anfragen für die Herbstaktion“).";
  if (!(e.hauptkennzahl in HAUPTKENNZAHLEN)) return "Bitte eine Hauptkennzahl wählen.";
  if (!e.zielgruppe.trim()) return "Bitte die Zielgruppe angeben.";
  if (!e.zielUrl.trim()) return "Bitte die passende Zielseite (Angebotsseite) angeben.";
  const von = tag(e.startAm), bis = tag(e.endeAm);
  if (!von || !bis) return "Bitte Start und Ende angeben.";
  if (bis < von) return "Das Ende liegt vor dem Start.";
  if ((bis.getTime() - von.getTime()) / 86_400_000 > 366) return "Der Zeitraum ist länger als ein Jahr.";
  if (!e.verantwortlichId) return "Bitte einen Verantwortlichen für Freigaben wählen.";
  if (e.budgetCent !== null && (!Number.isInteger(e.budgetCent) || e.budgetCent <= 0)) return "Das Budget muss ein Betrag über 0 € sein – oder „kein Budget“.";
  return null;
}

/** Vorgeschlagener Ablauf; alle Schritte sind danach frei bearbeitbar. */
export function ablaufVorschlag(e: KampagnenEingabe): { art: SchrittArt; titel: string; notiz: string; faelligAm: Date | null }[] {
  const von = tag(e.startAm)!, bis = tag(e.endeAm)!;
  const tage = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
  const mitte = new Date((von.getTime() + bis.getTime()) / 2);
  const wer = e.verantwortlichName?.trim() || "Verantwortliche Person";
  const kennzahl = HAUPTKENNZAHLEN[e.hauptkennzahl as Hauptkennzahl]?.label ?? e.hauptkennzahl;
  const schritte: { art: SchrittArt; titel: string; notiz: string; faelligAm: Date | null }[] = [
    { art: "INHALT", titel: "Inhalte aus dem Thema für die Plattformen vorbereiten", notiz: `Zielgruppe: ${e.zielgruppe}. Fakten mit Quelle erfassen, ungeprüfte Aussagen kennzeichnen.`, faelligAm: tage(von, -7) },
    { art: "PRUEFUNG", titel: "Varianten prüfen (Fakten, Quellen, Kennzeichnung)", notiz: "Jede Variante einzeln in der Vorschau ansehen.", faelligAm: tage(von, -4) },
    { art: "FREIGABE", titel: `Freigabe durch ${wer}`, notiz: "Jede Variante wird einzeln freigegeben. Ohne Freigabe wird nichts veröffentlicht.", faelligAm: tage(von, -2) },
    { art: "VEROEFFENTLICHUNG", titel: "Kampagnenlinks erzeugen und Beiträge veröffentlichen", notiz: `Je Kanal ein eigener Link, Ziel: ${e.zielUrl}`, faelligAm: von },
  ];
  if (e.budgetCent !== null) {
    schritte.push({ art: "WERBUNG", titel: `Werbeplan anlegen (Budget höchstens ${(e.budgetCent / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })})`, notiz: "Freigabe des Betrags durch Inhaber/Admin; Start nur im eigenen Werbekonto.", faelligAm: tage(von, -1) });
  }
  schritte.push(
    { art: "AUSWERTUNG", titel: "Zwischenstand prüfen", notiz: `Hauptkennzahl: ${kennzahl}.`, faelligAm: mitte },
    { art: "AUSWERTUNG", titel: "Auswertung nach Kampagnenende", notiz: `Ziel: ${e.ziel}. Hauptkennzahl: ${kennzahl}. Unbekannte Herkunft bleibt unbekannt.`, faelligAm: tage(bis, 2) }
  );
  return schritte;
}
