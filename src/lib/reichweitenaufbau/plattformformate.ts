import { versprechenImText } from "@/lib/reichweitenaufbau/ideen";

/**
 * Aus einem Thema unterschiedliche Plattformformate vorbereiten. Fakten werden
 * wortgleich übernommen und behalten ihre Quelle; ungeprüfte Aussagen werden
 * sichtbar markiert. Regelbasiert, ohne KI und ohne Kosten.
 */
export const FORMAT_PLATTFORMEN = {
  INSTAGRAM: { name: "Instagram", format: "Reel (bis 60 s) mit Beschriftung", limit: 2200, video: true },
  TIKTOK: { name: "TikTok", format: "Kurzvideo (15–60 s) mit Beschreibung", limit: 2200, video: true },
  YOUTUBE: { name: "YouTube", format: "Short (bis 60 s) mit Titel und Beschreibung", limit: 5000, video: true },
  LINKEDIN: { name: "LinkedIn", format: "Textbeitrag", limit: 3000, video: false },
  FACEBOOK: { name: "Facebook", format: "Beitrag", limit: 5000, video: false },
} as const;
export type FormatPlattform = keyof typeof FORMAT_PLATTFORMEN;

export interface Fakt {
  text: string;
  quelle: string;
  geprueft: boolean;
}

export interface FormatEingabe {
  thema: string;
  kernaussage: string;
  zielgruppe: string;
  aufforderung: string;
  zielUrl: string;
  fakten: Fakt[];
  plattformen: FormatPlattform[];
}

export interface FormatVariante {
  plattform: FormatPlattform;
  format: string;
  titel: string;
  einstieg: string;
  text: string;
  videoablauf: string[];
  fakten: Fakt[];
  ungeprueft: number;
  zeichen: number;
  limit: number;
  hinweise: string[];
}

export const UNGEPRUEFT = "[UNGEPRÜFT]";

export function faktZeile(f: Fakt, nr: number): string {
  return `${f.geprueft ? "" : `${UNGEPRUEFT} `}${f.text.trim()} [${nr}]`;
}

export function quellenBlock(fakten: Fakt[]): string {
  if (!fakten.length) return "";
  return `Quellen:\n${fakten.map((f, i) => `[${i + 1}] ${f.quelle.trim() || "keine Quelle angegeben"}${f.geprueft ? "" : " – ungeprüft"}`).join("\n")}`;
}

export function pruefeFormatEingabe(e: FormatEingabe): string | null {
  if (!e.thema.trim()) return "Bitte das Thema angeben.";
  if (!e.kernaussage.trim()) return "Bitte die Kernaussage angeben.";
  if (!e.plattformen.length) return "Bitte mindestens eine Plattform wählen.";
  if (e.fakten.length > 10) return "Höchstens 10 Fakten.";
  for (const f of e.fakten) if (!f.text.trim()) return "Leere Fakten bitte entfernen.";
  return null;
}

export function plattformVarianten(e: FormatEingabe): FormatVariante[] {
  const fakten = e.fakten.map((f) => ({ text: f.text.trim(), quelle: f.quelle.trim(), geprueft: !!f.geprueft }));
  const zeilen = fakten.map((f, i) => faktZeile(f, i + 1));
  const quellen = quellenBlock(fakten);
  const cta = e.aufforderung.trim() || "Mehr dazu über den Link.";
  const link = e.zielUrl.trim() ? `\n${e.zielUrl.trim()}` : "";
  const ungeprueft = fakten.filter((f) => !f.geprueft).length;

  return [...new Set(e.plattformen)].filter((p) => p in FORMAT_PLATTFORMEN).map((p) => {
    const d = FORMAT_PLATTFORMEN[p];
    const einstieg = p === "LINKEDIN" ? `${e.thema.trim()}: ${e.kernaussage.trim()}` : `${e.kernaussage.trim()} – ${e.thema.trim()}`;
    const titel = p === "YOUTUBE" ? einstieg.slice(0, 100) : e.thema.trim();
    const faktenText = zeilen.length ? `\n\n${zeilen.map((z) => (d.video ? `• ${z}` : `– ${z}`)).join("\n")}` : "";
    const text = d.video
      ? `${einstieg}${faktenText}\n\n${cta}${link}${quellen ? `\n\n${quellen}` : ""}`
      : `${einstieg}\n\nFür ${e.zielgruppe.trim() || "[Zielgruppe]"}:${faktenText || "\n[eigene, überprüfbare Aussagen ergänzen]"}\n\n${cta}${link}${quellen ? `\n\n${quellen}` : ""}`;
    const videoablauf = d.video
      ? [
          `0–3 s: Einstieg einblenden – „${einstieg.slice(0, 80)}“`,
          ...zeilen.map((z, i) => `${3 + i * 5}–${8 + i * 5} s: Texteinblendung – ${z}`),
          `Schluss: ${cta}`,
          ...(quellen ? ["Quellen in der Beschreibung nennen"] : []),
        ]
      : [];
    const hinweise: string[] = [];
    if (text.length > d.limit) hinweise.push(`Text ist ${text.length} Zeichen lang, ${d.name} erlaubt ${d.limit}. Bitte kürzen.`);
    if (ungeprueft) hinweise.push(`${ungeprueft} ungeprüfte Aussage(n) sind mit ${UNGEPRUEFT} markiert – vor der Freigabe prüfen oder entfernen.`);
    if (fakten.some((f) => !f.quelle)) hinweise.push("Mindestens ein Fakt hat keine Quelle.");
    const versprechen = versprechenImText(`${e.thema} ${e.kernaussage} ${fakten.map((f) => f.text).join(" ")}`);
    if (versprechen.length) hinweise.push(`Erfolgsversprechen im Text (${versprechen.join(", ")}) – nur mit Beleg verwenden.`);
    return { plattform: p, format: d.format, titel, einstieg, text, videoablauf, fakten, ungeprueft, zeichen: text.length, limit: d.limit, hinweise };
  });
}
