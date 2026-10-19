/**
 * Auswertung einer Reichweiten-Kampagne. Reine Funktion ohne Datenbank,
 * damit sie direkt testbar ist.
 *
 * Grundsätze:
 *  - Aufrufe, Klicks, Plattform-Ausspielungen und Personen werden nie
 *    vermischt oder ineinander umgerechnet. Eindeutige Personen sind nicht
 *    messbar (keine Cookies, keine Besucherkennung).
 *  - Jede Zahl trägt Quelle, Zeitraum, letzte Aktualisierung, Messlücken
 *    und Demo-Kennzeichen.
 *  - Stufen gibt es nur, wenn jemand ausdrücklich einen eigenen Link aus
 *    einem bestehenden erzeugt hat. Wird derselbe Link weitergegeben, bleibt
 *    es dieselbe Stufe — es werden keine Ketten erfunden.
 */

export type EreignisArt = "AUFRUF" | "ZIEL_KLICK" | "ANFRAGE" | "LINK_ERZEUGT";
export const EREIGNIS_ARTEN: EreignisArt[] = ["AUFRUF", "ZIEL_KLICK", "ANFRAGE", "LINK_ERZEUGT"];

export type Metrik = "IMPRESSIONEN" | "REICHWEITE" | "VIDEOAUFRUFE" | "SHARES";
export const METRIKEN: Metrik[] = ["IMPRESSIONEN", "REICHWEITE", "VIDEOAUFRUFE", "SHARES"];

export const METRIK_INFO: Record<Metrik, { label: string; einheit: string }> = {
  IMPRESSIONEN: { label: "Impressionen", einheit: "Ausspielungen (keine Personen)" },
  REICHWEITE: { label: "Reichweite", einheit: "laut Plattform erreichte Konten je Plattform – über Plattformen summiert keine eindeutigen Personen" },
  VIDEOAUFRUFE: { label: "Videoaufrufe", einheit: "Aufrufe nach Plattform-Definition (keine Personen)" },
  SHARES: { label: "Geteilt (Plattform)", einheit: "von der Plattform gemeldete Teilungen; Weitergabe in Messengern ist nicht enthalten" },
};

export interface LinkEingabe {
  id: string;
  code: string;
  parentId: string | null;
  stufe: number;
  bezeichnung: string;
  herkunft: string;
  istDemo: boolean;
  widerrufenAm: Date | null;
  createdAt: Date;
}

export interface EreignisEingabe {
  linkId: string | null;
  art: string;
  istDemo: boolean;
  createdAt: Date;
}

export interface KennzahlEingabe {
  id: string;
  plattform: string;
  metrik: string;
  wert: number;
  quelle: string;
  zeitraumVon: Date;
  zeitraumBis: Date;
  erfasstAm: Date;
}

export interface Zahl {
  wert: number | null;
  einheit: string;
  quelle: string;
  zeitraum: { von: string; bis: string } | null;
  letzteAktualisierung: string | null;
  messluecken: string[];
  istDemo: boolean;
  status: "GEMESSEN" | "ERFASST" | "NICHT_ANGEBUNDEN" | "NICHT_MESSBAR" | "KEINE_DATEN";
}

export interface StufenKnoten {
  id: string;
  code: string;
  stufe: number;
  bezeichnung: string;
  herkunft: string;
  istDemo: boolean;
  widerrufen: boolean;
  zaehler: Record<EreignisArt, number>;
  kinder: StufenKnoten[];
}

export interface FlussSchritt {
  key: string;
  label: string;
  zahl: Zahl;
}

export interface Auswertung {
  plattformKennzahlen: { plattform: string; metrik: Metrik; label: string; zahl: Zahl }[];
  eigeneMessung: Record<EreignisArt, Zahl>;
  herkunft: { gemesseneWeiterempfehlungen: Zahl; unbekannteHerkunft: Zahl; plattformempfehlungen: Zahl };
  newsletter: Zahl;
  eindeutigePersonen: Zahl;
  fluss: FlussSchritt[];
  stufen: StufenKnoten[];
  enthaeltDemo: boolean;
  hinweise: string[];
}

const iso = (d: Date) => d.toISOString();

function leer(status: Zahl["status"], einheit: string, messluecken: string[], quelle = "—"): Zahl {
  return { wert: null, einheit, quelle, zeitraum: null, letzteAktualisierung: null, messluecken, istDemo: false, status };
}

function zaehle(ereignisse: EreignisEingabe[], art: EreignisArt, einheit: string, messluecken: string[]): Zahl {
  const passend = ereignisse.filter((e) => e.art === art);
  if (passend.length === 0) {
    return { ...leer("KEINE_DATEN", einheit, messluecken, "Eigene Messung (Empfehlungslinks)"), wert: 0 };
  }
  const zeiten = passend.map((e) => e.createdAt.getTime());
  return {
    wert: passend.length,
    einheit,
    quelle: "Eigene Messung (Empfehlungslinks)",
    zeitraum: { von: iso(new Date(Math.min(...zeiten))), bis: iso(new Date(Math.max(...zeiten))) },
    letzteAktualisierung: iso(new Date(Math.max(...zeiten))),
    messluecken,
    istDemo: passend.some((e) => e.istDemo),
    status: "GEMESSEN",
  };
}

const QUELLE_LABEL = (q: string) =>
  q === "DEMO" ? "Demo-Daten" : q === "MANUELL" ? "Manuell eingetragen (Plattform-Statistik)" : q.startsWith("API:") ? `Plattform-Schnittstelle ${q.slice(4)}` : q;

const MESSLUECKEN = {
  aufruf: [
    "Zählt Seitenaufrufe über Empfehlungslinks, keine Personen – mehrfaches Öffnen zählt mehrfach.",
    "Vorschau-Abrufe von Messengern und bekannte Bots werden nicht gezählt, unbekannte Bots evtl. schon.",
  ],
  zielKlick: ["Zählt Klicks auf „Weiter zur Seite“. Was danach auf der Zielseite passiert, ist nicht verbunden."],
  anfrage: ["Nur Anfragen über das Formular der Empfehlungsseite. Anfragen per Telefon, E-Mail oder DM sind nicht zugeordnet."],
  linkErzeugt: ["Zählt nur ausdrücklich erzeugte eigene Links. Ob diese danach geteilt werden, ist nicht bekannt."],
};

export function baueStufen(links: LinkEingabe[], ereignisse: EreignisEingabe[]): StufenKnoten[] {
  const zaehlerFuer = (linkId: string) => {
    const z = { AUFRUF: 0, ZIEL_KLICK: 0, ANFRAGE: 0, LINK_ERZEUGT: 0 } as Record<EreignisArt, number>;
    for (const e of ereignisse) if (e.linkId === linkId && (EREIGNIS_ARTEN as string[]).includes(e.art)) z[e.art as EreignisArt]++;
    return z;
  };
  const ids = new Set(links.map((l) => l.id));
  const knoten = (l: LinkEingabe): StufenKnoten => ({
    id: l.id,
    code: l.code,
    stufe: l.stufe,
    bezeichnung: l.bezeichnung,
    herkunft: l.herkunft,
    istDemo: l.istDemo,
    widerrufen: !!l.widerrufenAm,
    zaehler: zaehlerFuer(l.id),
    kinder: links
      .filter((k) => k.parentId === l.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(knoten),
  });
  // Wurzeln: Links ohne (noch vorhandenen) Elternlink. Nur tatsächlich gespeicherte Links erscheinen.
  return links
    .filter((l) => !l.parentId || !ids.has(l.parentId))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(knoten);
}

export function auswerten(input: {
  links: LinkEingabe[];
  ereignisse: EreignisEingabe[];
  kennzahlen: KennzahlEingabe[];
}): Auswertung {
  const { links, ereignisse, kennzahlen } = input;

  const plattformKennzahlen: Auswertung["plattformKennzahlen"] = [];
  for (const k of [...kennzahlen].sort((a, b) => a.plattform.localeCompare(b.plattform) || a.metrik.localeCompare(b.metrik))) {
    if (!(METRIKEN as string[]).includes(k.metrik)) continue;
    const metrik = k.metrik as Metrik;
    plattformKennzahlen.push({
      plattform: k.plattform,
      metrik,
      label: METRIK_INFO[metrik].label,
      zahl: {
        wert: k.wert,
        einheit: METRIK_INFO[metrik].einheit,
        quelle: QUELLE_LABEL(k.quelle),
        zeitraum: { von: iso(k.zeitraumVon), bis: iso(k.zeitraumBis) },
        letzteAktualisierung: iso(k.erfasstAm),
        messluecken: k.quelle.startsWith("API:")
          ? []
          : ["Nicht automatisch abgerufen – Wert stammt aus " + (k.quelle === "DEMO" ? "Beispieldaten." : "manueller Übertragung aus der Plattform-Statistik.")],
        istDemo: k.quelle === "DEMO",
        status: "ERFASST",
      },
    });
  }

  const eigeneMessung: Auswertung["eigeneMessung"] = {
    AUFRUF: zaehle(ereignisse, "AUFRUF", "Linkaufrufe (keine Personen)", MESSLUECKEN.aufruf),
    ZIEL_KLICK: zaehle(ereignisse, "ZIEL_KLICK", "Klicks zur Zielseite (keine Personen)", MESSLUECKEN.zielKlick),
    ANFRAGE: zaehle(ereignisse, "ANFRAGE", "Anfragen über das Formular", MESSLUECKEN.anfrage),
    LINK_ERZEUGT: zaehle(ereignisse, "LINK_ERZEUGT", "ausdrücklich erzeugte eigene Empfehlungslinks", MESSLUECKEN.linkErzeugt),
  };

  // Herkunft der Linkaufrufe: Besucher-Links (Stufe ≥ 2) sind dokumentierte Weiterempfehlungen,
  // Aufrufe über Team-Links haben unbekannte Herkunft (Beitrag, Bio, weitergeleitete Nachricht …).
  const besucherLinkIds = new Set(links.filter((l) => l.herkunft === "BESUCHER" && l.stufe >= 2).map((l) => l.id));
  const aufrufe = ereignisse.filter((e) => e.art === "AUFRUF");
  const gemessen = aufrufe.filter((e) => e.linkId && besucherLinkIds.has(e.linkId));
  const unbekannt = aufrufe.filter((e) => !e.linkId || !besucherLinkIds.has(e.linkId));
  const herkunft: Auswertung["herkunft"] = {
    gemesseneWeiterempfehlungen: zaehle(
      gemessen.map((e) => ({ ...e, art: "AUFRUF" })),
      "AUFRUF",
      "Linkaufrufe über von Besuchern erzeugte Empfehlungslinks",
      ["Nur Weiterempfehlungen, bei denen ausdrücklich ein eigener Link erzeugt wurde."]
    ),
    unbekannteHerkunft: zaehle(unbekannt, "AUFRUF", "Linkaufrufe über Team-Links", [
      "Ob jemand den Link direkt aus dem Beitrag, aus der Bio oder aus einer weitergeleiteten Nachricht geöffnet hat, ist nicht unterscheidbar.",
    ]),
    plattformempfehlungen: leer("NICHT_ANGEBUNDEN", "algorithmische Ausspielung durch die Plattform", [
      "Nur über die Statistik-Schnittstelle der jeweiligen Plattform abrufbar – in dieser App noch nicht angebunden.",
    ]),
  };

  const newsletter = leer("NICHT_ANGEBUNDEN", "Newsletter-Anmeldungen", [
    "Der vorhandene Newsletter ist nicht kampagnenbezogen angebunden; Anmeldungen werden keiner Kampagne zugeordnet.",
  ]);
  const eindeutigePersonen = leer("NICHT_MESSBAR", "eindeutige Personen", [
    "Ohne Cookies und Besucherkennung ist nicht feststellbar, ob mehrere Aufrufe von derselben Person stammen.",
  ]);

  const summe = (metrik: Metrik): Zahl => {
    const rows = plattformKennzahlen.filter((k) => k.metrik === metrik);
    if (rows.length === 0) {
      return leer("NICHT_ANGEBUNDEN", METRIK_INFO[metrik].einheit, ["Keine Plattformzahl erfasst; automatischer Abruf ist nicht angebunden."]);
    }
    const von = Math.min(...rows.map((r) => Date.parse(r.zahl.zeitraum!.von)));
    const bis = Math.max(...rows.map((r) => Date.parse(r.zahl.zeitraum!.bis)));
    return {
      wert: rows.reduce((s, r) => s + (r.zahl.wert ?? 0), 0),
      einheit: METRIK_INFO[metrik].einheit,
      quelle: [...new Set(rows.map((r) => r.zahl.quelle))].join(", "),
      zeitraum: { von: iso(new Date(von)), bis: iso(new Date(bis)) },
      letzteAktualisierung: rows.map((r) => r.zahl.letzteAktualisierung!).sort().at(-1) ?? null,
      messluecken: [
        `Summe aus ${rows.length} Eintrag/Einträgen (${[...new Set(rows.map((r) => r.plattform))].join(", ")}) – keine eindeutigen Personen.`,
        ...new Set(rows.flatMap((r) => r.zahl.messluecken)),
      ],
      istDemo: rows.some((r) => r.zahl.istDemo),
      status: "ERFASST",
    };
  };

  const fluss: FlussSchritt[] = [
    { key: "beitrag", label: "Beitrag (Videoaufrufe laut Plattform)", zahl: summe("VIDEOAUFRUFE") },
    { key: "weiterempfehlung", label: "Dokumentierte Weiterempfehlung (eigener Link erzeugt)", zahl: eigeneMessung.LINK_ERZEUGT },
    { key: "linkbesuch", label: "Linkbesuch", zahl: eigeneMessung.AUFRUF },
    { key: "ziel", label: "Weiter zur Zielseite", zahl: eigeneMessung.ZIEL_KLICK },
    { key: "newsletter", label: "Newsletter-Anmeldung", zahl: newsletter },
    { key: "anfrage", label: "Anfrage", zahl: eigeneMessung.ANFRAGE },
  ];

  const enthaeltDemo =
    links.some((l) => l.istDemo) || ereignisse.some((e) => e.istDemo) || kennzahlen.some((k) => k.quelle === "DEMO");

  return {
    plattformKennzahlen,
    eigeneMessung,
    herkunft,
    newsletter,
    eindeutigePersonen,
    fluss,
    stufen: baueStufen(links, ereignisse),
    enthaeltDemo,
    hinweise: [
      "Ein geöffneter Teilen-Dialog wird nicht gezählt – die App erfährt nicht, ob danach wirklich geteilt wurde.",
      "Wird derselbe Link weitergegeben, entsteht keine neue Stufe. Stufen gibt es nur bei ausdrücklich erzeugten eigenen Links.",
      "Aufrufe, Klicks, Ausspielungen und Personen sind unterschiedliche Größen und werden nicht verrechnet.",
    ],
  };
}
