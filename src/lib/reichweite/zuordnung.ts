/**
 * Nachvollziehbare Zuordnung der Ergebnisse zu Links und Angebotsseiten.
 * Ereignisse ohne Link bleiben „Herkunft unbekannt“ – es wird nichts geschätzt
 * oder erfunden.
 */
export interface ZLink {
  id: string;
  bezeichnung: string;
  herkunft: string;
  stufe: number;
  parentId: string | null;
  angebotUrl: string;
  istDemo: boolean;
}
export interface ZEreignis {
  linkId: string | null;
  art: string;
}

export interface ZZeile {
  schluessel: string;
  link: string;
  herkunft: string;
  angebotsseite: string;
  aufrufe: number;
  zielKlicks: number;
  anfragen: number;
  neueLinks: number;
}

/** Wirksame Angebotsseite eines Links: eigene, sonst die des Ursprungslinks, sonst die Zielseite der Kampagne. */
export function angebotsseite(link: ZLink, alle: Map<string, ZLink>, zielUrl: string): string {
  let l: ZLink | undefined = link;
  for (let i = 0; l && i < 10; i++) {
    if (l.angebotUrl) return l.angebotUrl;
    l = l.parentId ? alle.get(l.parentId) : undefined;
  }
  return zielUrl || "keine Zielseite";
}

function wurzel(link: ZLink, alle: Map<string, ZLink>): ZLink {
  let l = link;
  for (let i = 0; l.parentId && alle.get(l.parentId) && i < 10; i++) l = alle.get(l.parentId)!;
  return l;
}

export function ergebnisZuordnung(links: ZLink[], ereignisse: ZEreignis[], zielUrl: string) {
  const alle = new Map(links.map((l) => [l.id, l]));
  const zeilen = new Map<string, ZZeile>();
  const zeile = (key: string, init: Omit<ZZeile, "aufrufe" | "zielKlicks" | "anfragen" | "neueLinks">) => {
    if (!zeilen.has(key)) zeilen.set(key, { ...init, aufrufe: 0, zielKlicks: 0, anfragen: 0, neueLinks: 0 });
    return zeilen.get(key)!;
  };
  for (const l of links) {
    const w = wurzel(l, alle);
    zeile(l.id, {
      schluessel: l.id,
      link: l.herkunft === "BESUCHER" ? `Weitergegeben (Stufe ${l.stufe}) über „${w.bezeichnung || "Team-Link"}“` : l.bezeichnung || "Team-Link",
      herkunft: l.herkunft === "BESUCHER" ? "gemessene Weiterempfehlung" : "eigener Kanal (Team-Link)",
      angebotsseite: angebotsseite(l, alle, zielUrl),
    });
  }
  for (const e of ereignisse) {
    const z = e.linkId && alle.has(e.linkId)
      ? zeilen.get(e.linkId)!
      : zeile("unbekannt", { schluessel: "unbekannt", link: "—", herkunft: "Herkunft unbekannt", angebotsseite: "—" });
    if (e.art === "AUFRUF") z.aufrufe++;
    if (e.art === "ZIEL_KLICK") z.zielKlicks++;
    if (e.art === "ANFRAGE") z.anfragen++;
    if (e.art === "LINK_ERZEUGT") z.neueLinks++;
  }
  const liste = [...zeilen.values()];
  const jeSeite = new Map<string, { angebotsseite: string; aufrufe: number; zielKlicks: number; anfragen: number }>();
  for (const z of liste) {
    if (z.schluessel === "unbekannt") continue;
    const s = jeSeite.get(z.angebotsseite) ?? { angebotsseite: z.angebotsseite, aufrufe: 0, zielKlicks: 0, anfragen: 0 };
    s.aufrufe += z.aufrufe;
    s.zielKlicks += z.zielKlicks;
    s.anfragen += z.anfragen;
    jeSeite.set(z.angebotsseite, s);
  }
  return { zeilen: liste, jeAngebotsseite: [...jeSeite.values()] };
}
