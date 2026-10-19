"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, Plus, Trash2 } from "lucide-react";
import type { Auswertung, StufenKnoten, Zahl } from "@/lib/reichweite/auswertung";
import { METRIK_INFO, METRIKEN } from "@/lib/reichweite/auswertung";
import { empfehlungsUrl } from "@/lib/reichweite/teilen";
import { begleittexte } from "@/lib/reichweite/vorschlaege";
import { TeilenBereich } from "@/components/reichweite/TeilenBereich";

const feld =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";
const knopf = "inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground disabled:opacity-50";
const knopfPrimaer = "inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50";

interface LinkZeile {
  id: string;
  code: string;
  stufe: number;
  bezeichnung: string;
  herkunft: string;
  istDemo: boolean;
  widerrufen: boolean;
}
interface KennzahlZeile {
  id: string;
  plattform: string;
  metrik: string;
  wert: number;
  quelle: string;
  zeitraumVon: string;
  zeitraumBis: string;
}
interface KampagneZeile {
  id: string;
  titel: string;
  text: string;
  zielUrl: string;
  aktiv: boolean;
  istDemo: boolean;
  interneKampagne: string | null;
  links: LinkZeile[];
  kennzahlen: KennzahlZeile[];
}
interface PlattformZeile {
  plattform: string;
  anmeldungEingerichtet: boolean;
  konto: string;
  composio: string;
  statistikAbruf: string;
}

const STATUS_TEXT: Record<Zahl["status"], string> = {
  GEMESSEN: "gemessen",
  ERFASST: "erfasst",
  NICHT_ANGEBUNDEN: "nicht angebunden",
  NICHT_MESSBAR: "nicht messbar",
  KEINE_DATEN: "noch keine Daten",
};

const datum = (iso: string) => new Date(iso).toLocaleDateString("de-DE");
const zeit = (iso: string) => new Date(iso).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });

function DemoMarke() {
  return <span className="rounded border border-warning/60 px-1.5 py-0.5 text-[10px] font-semibold text-warning">DEMO</span>;
}

function ZahlKarte({ label, zahl }: { label: string; zahl: Zahl }) {
  const ohneWert = zahl.wert === null;
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3" data-testid="zahl-karte">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        {zahl.istDemo && <DemoMarke />}
      </div>
      <div className={`mt-1 text-lg font-semibold ${ohneWert ? "text-muted" : "text-foreground"}`}>
        {ohneWert ? STATUS_TEXT[zahl.status] : zahl.wert!.toLocaleString("de-DE")}
      </div>
      <div className="text-[11px] text-muted">{zahl.einheit}</div>
      <dl className="mt-2 space-y-0.5 text-[11px] text-muted">
        <div>Quelle: {zahl.quelle}</div>
        <div>Zeitraum: {zahl.zeitraum ? `${datum(zahl.zeitraum.von)} – ${datum(zahl.zeitraum.bis)}` : "—"}</div>
        <div>Letzte Aktualisierung: {zahl.letzteAktualisierung ? zeit(zahl.letzteAktualisierung) : "—"}</div>
      </dl>
      {zahl.messluecken.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-muted">
          {zahl.messluecken.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stufen({ knoten }: { knoten: StufenKnoten[] }) {
  if (knoten.length === 0) return <p className="text-xs text-muted">Noch keine Links.</p>;
  return (
    <ul className="space-y-1">
      {knoten.map((k) => (
        <li key={k.id}>
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
            <span className="font-mono text-muted">Stufe {k.stufe}</span>
            <span className="text-foreground">{k.bezeichnung || (k.herkunft === "BESUCHER" ? "von Besucher erzeugt" : "Team-Link")}</span>
            <span className="text-muted">
              {k.zaehler.AUFRUF} Aufrufe · {k.zaehler.ZIEL_KLICK} Klicks · {k.zaehler.ANFRAGE} Anfragen
            </span>
            {k.widerrufen && <span className="text-danger">widerrufen</span>}
            {k.istDemo && <DemoMarke />}
          </div>
          {k.kinder.length > 0 && (
            <div className="ml-4 mt-1 border-l border-border pl-3">
              <Stufen knoten={k.kinder} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function WeiterempfehlungenBoard(props: {
  origin: string;
  darfBearbeiten: boolean;
  aufbewahrungTage: number;
  plattformen: PlattformZeile[];
  interneKampagnen: { id: string; title: string }[];
  ctaVorschlaege: string[];
  kampagnen: KampagneZeile[];
}) {
  const { origin, darfBearbeiten, kampagnen } = props;
  const router = useRouter();
  const [gewaehlt, setAuswahl] = useState<string | null>(kampagnen[0]?.id ?? null);
  // Gelöschte oder fehlende Auswahl fällt auf die neueste Kampagne zurück.
  const auswahl = gewaehlt && kampagnen.some((k) => k.id === gewaehlt) ? gewaehlt : (kampagnen[0]?.id ?? null);
  const [geladen, setGeladen] = useState<{ id: string; daten: Auswertung } | null>(null);
  const auswertung = geladen && geladen.id === auswahl ? geladen.daten : null;
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [teilenFuer, setTeilenFuer] = useState<string | null>(null);
  const kampagne = kampagnen.find((k) => k.id === auswahl) ?? null;

  useEffect(() => {
    if (!auswahl) return;
    let abgebrochen = false;
    fetch(`/api/reichweite/kampagnen/${auswahl}/auswertung`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!abgebrochen && data?.auswertung) setGeladen({ id: auswahl, daten: data.auswertung });
      })
      .catch(() => {});
    return () => {
      abgebrochen = true;
    };
  }, [auswahl, kampagnen]);

  async function aufruf(url: string, method: string, body?: unknown) {
    setLaedt(true);
    setFehler(null);
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "content-type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    setLaedt(false);
    if (!res.ok) {
      setFehler(data.error ?? "Aktion fehlgeschlagen.");
      return null;
    }
    router.refresh();
    return data;
  }

  async function kampagneAnlegen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const data = await aufruf("/api/reichweite/kampagnen", "POST", {
      titel: String(f.get("titel") ?? ""),
      text: String(f.get("text") ?? ""),
      zielUrl: String(f.get("zielUrl") ?? ""),
      campaignId: String(f.get("campaignId") ?? "") || null,
    });
    if (data) {
      form.reset();
      setAuswahl(data.kampagne.id);
    }
  }

  async function linkAnlegen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!kampagne) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    if (await aufruf(`/api/reichweite/kampagnen/${kampagne.id}/links`, "POST", { bezeichnung: String(f.get("bezeichnung") ?? "") })) form.reset();
  }

  async function kennzahlAnlegen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!kampagne) return;
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await aufruf(`/api/reichweite/kampagnen/${kampagne.id}/kennzahlen`, "POST", {
      plattform: f.get("plattform"),
      metrik: f.get("metrik"),
      wert: Number(f.get("wert")),
      zeitraumVon: f.get("von"),
      zeitraumBis: f.get("bis"),
    });
    if (ok) form.reset();
  }

  async function demoLaden() {
    const data = await aufruf("/api/reichweite/demo", "POST");
    if (data) setAuswahl(data.kampagne.id);
  }

  async function demoEntfernen() {
    if (await aufruf("/api/reichweite/demo", "DELETE")) setAuswahl(null);
  }

  const hatDemo = kampagnen.some((k) => k.istDemo);

  return (
    <div className="space-y-5">
      {hatDemo && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 px-4 py-3 text-xs text-warning" data-testid="demo-banner">
          <strong>Demo-Daten aktiv:</strong> Kampagnen mit DEMO-Kennzeichen enthalten erfundene Zahlen zur Vorschau. Sie wurden nirgends veröffentlicht.
        </div>
      )}

      {fehler && <div className="rounded-lg border border-danger/50 bg-danger/10 px-4 py-2 text-sm text-danger">{fehler}</div>}

      {/* Einrichtungsstand */}
      <section className="card p-4">
        <h2 className="text-sm font-semibold text-foreground">Stand der Anbindungen</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-1 pr-3 font-normal">Plattform</th>
                <th className="py-1 pr-3 font-normal">Anmeldung (App-Zugang)</th>
                <th className="py-1 pr-3 font-normal">Konto</th>
                <th className="py-1 pr-3 font-normal">Composio</th>
                <th className="py-1 font-normal">Statistik-Abruf</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              {props.plattformen.map((p) => (
                <tr key={p.plattform} className="border-t border-border">
                  <td className="py-1.5 pr-3">{p.plattform}</td>
                  <td className="py-1.5 pr-3">{p.anmeldungEingerichtet ? "eingerichtet" : "nicht eingerichtet"}</td>
                  <td className="py-1.5 pr-3">{p.konto === "CONNECTED" ? "verbunden" : p.konto === "ERROR" ? "Fehler" : "nicht verbunden"}</td>
                  <td className="py-1.5 pr-3">{p.composio === "ACTIVE" ? "aktiv" : p.composio === "NONE" ? "—" : p.composio.toLowerCase()}</td>
                  <td className="py-1.5 text-muted">nicht angebunden</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 list-disc space-y-0.5 pl-4 text-[11px] text-muted">
          <li>Plattformzahlen (Impressionen, Reichweite, Videoaufrufe, Shares) werden derzeit nur als DEMO oder manuell übertragen angezeigt.</li>
          <li>Newsletter: nicht kampagnenbezogen angebunden. Website-Besuche: nur „Klicks zur Zielseite“ über den Empfehlungslink.</li>
          <li>Keine Einwilligungsverwaltung vorhanden – deshalb keine Cookies und keine Besucherkennung; gezählt wird nur ohne Personenbezug.</li>
          <li>Zähl-Ereignisse werden nach {props.aufbewahrungTage} Tagen automatisch gelöscht. Anfragen landen unter „Kundenanfragen“ (Kanal „empfehlung“).</li>
        </ul>
      </section>

      {/* Kampagnen-Auswahl und Demo */}
      <section className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Kampagnen</h2>
          {darfBearbeiten && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={knopf} onClick={demoLaden} disabled={laedt}>
                Demo-Daten laden
              </button>
              {hatDemo && (
                <button type="button" className={knopf} onClick={demoEntfernen} disabled={laedt}>
                  Demo entfernen
                </button>
              )}
            </div>
          )}
        </div>
        {kampagnen.length === 0 ? (
          <p className="text-xs text-muted">Noch keine Kampagne. Lege eine an oder lade die Demo-Daten.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {kampagnen.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setAuswahl(k.id)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                  k.id === auswahl ? "border-accent text-foreground" : "border-border text-muted"
                }`}
              >
                {k.titel} {k.istDemo && <DemoMarke />} {!k.aktiv && <span className="text-danger">pausiert</span>}
              </button>
            ))}
          </div>
        )}
        {darfBearbeiten && (
          <details className="rounded-lg border border-border p-3">
            <summary className="cursor-pointer text-xs text-foreground">Neue Kampagne anlegen</summary>
            <form onSubmit={kampagneAnlegen} className="mt-3 grid gap-2 sm:grid-cols-2">
              <input name="titel" required maxLength={160} placeholder="Öffentlicher Titel" className={feld} />
              <input name="zielUrl" maxLength={500} placeholder="Zielseite (https://…, optional)" className={feld} />
              <textarea name="text" maxLength={1000} rows={2} placeholder="Öffentlicher Text (optional)" className={`${feld} sm:col-span-2`} />
              <select name="campaignId" className={feld} defaultValue="">
                <option value="">Keine interne Kampagne zuordnen</option>
                {props.interneKampagnen.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <button type="submit" className={knopfPrimaer} disabled={laedt}>
                {laedt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Anlegen
              </button>
              <p className="text-[11px] text-muted sm:col-span-2">
                Titel, Text und Zielseite sind öffentlich auf der Empfehlungsseite sichtbar. Die interne Kampagne und alle anderen Daten bleiben privat.
              </p>
            </form>
          </details>
        )}
      </section>

      {kampagne && (
        <>
          {/* Links */}
          <section className="card space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                Empfehlungslinks – {kampagne.titel} {kampagne.istDemo && <DemoMarke />}
              </h2>
              {darfBearbeiten && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={knopf}
                    disabled={laedt}
                    onClick={() => aufruf(`/api/reichweite/kampagnen/${kampagne.id}`, "PATCH", { aktiv: !kampagne.aktiv })}
                  >
                    {kampagne.aktiv ? "Pausieren" : "Aktivieren"}
                  </button>
                  <button
                    type="button"
                    className={knopf}
                    disabled={laedt}
                    onClick={() => {
                      if (confirm("Kampagne mit allen Links, Zählungen und Kennzahlen löschen?")) {
                        void aufruf(`/api/reichweite/kampagnen/${kampagne.id}`, "DELETE").then((ok) => ok && setAuswahl(null));
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Löschen
                  </button>
                </div>
              )}
            </div>
            {kampagne.interneKampagne && <p className="text-[11px] text-muted">Intern zugeordnet: {kampagne.interneKampagne} (nicht öffentlich)</p>}
            <ul className="space-y-2">
              {kampagne.links.map((l) => {
                const url = empfehlungsUrl(origin, l.code);
                return (
                  <li key={l.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-muted">Stufe {l.stufe}</span>
                      <span className="text-foreground">{l.bezeichnung || (l.herkunft === "BESUCHER" ? "von Besucher erzeugt" : "Team-Link")}</span>
                      {l.istDemo && <DemoMarke />}
                      {l.widerrufen && <span className="text-danger">widerrufen</span>}
                    </div>
                    <div className="mt-1 break-all font-mono text-xs text-accent-2">{url}</div>
                    {!l.widerrufen && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" className={knopf} onClick={() => setTeilenFuer(teilenFuer === l.id ? null : l.id)}>
                          Teilen / kopieren
                        </button>
                        <a href={url} target="_blank" rel="noopener noreferrer" className={knopf}>
                          Öffentliche Seite ansehen
                        </a>
                        {darfBearbeiten && (
                          <button type="button" className={knopf} disabled={laedt} onClick={() => aufruf(`/api/reichweite/links/${l.id}`, "DELETE")}>
                            <Ban className="h-4 w-4" /> Widerrufen
                          </button>
                        )}
                      </div>
                    )}
                    {teilenFuer === l.id && (
                      <div className="mt-3">
                        <TeilenBereich url={url} titel={kampagne.titel} texte={begleittexte(kampagne.titel)} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {darfBearbeiten && (
              <form onSubmit={linkAnlegen} className="flex flex-col gap-2 sm:flex-row">
                <input name="bezeichnung" maxLength={80} placeholder="Interne Bezeichnung, z. B. „Instagram-Bio“ (keine Personendaten)" className={feld} />
                <button type="submit" className={knopfPrimaer} disabled={laedt}>
                  <Plus className="h-4 w-4" /> Team-Link
                </button>
              </form>
            )}
            <p className="text-[11px] text-muted">
              Der Code im Link ist zufällig, enthält keine Personendaten und ist kein Zugangsschlüssel. Wer ihn kennt, sieht nur Titel, Text und Zielseite.
            </p>
          </section>

          {/* Auswertung */}
          {auswertung && (
            <section className="card space-y-4 p-4" data-testid="auswertung">
              <h2 className="text-sm font-semibold text-foreground">Übersicht {auswertung.enthaeltDemo && <DemoMarke />}</h2>

              <div>
                <h3 className="text-xs font-semibold text-foreground">Ablauf</h3>
                <ol className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {auswertung.fluss.map((s, i) => (
                    <li key={s.key}>
                      <ZahlKarte label={`${i + 1}. ${s.label}`} zahl={s.zahl} />
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-foreground">Herkunft der Linkaufrufe</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <ZahlKarte label="Gemessene Weiterempfehlungen" zahl={auswertung.herkunft.gemesseneWeiterempfehlungen} />
                  <ZahlKarte label="Unbekannte Herkunft" zahl={auswertung.herkunft.unbekannteHerkunft} />
                  <ZahlKarte label="Plattformempfehlungen" zahl={auswertung.herkunft.plattformempfehlungen} />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-foreground">Plattformzahlen</h3>
                {auswertung.plattformKennzahlen.length === 0 ? (
                  <p className="mt-1 text-xs text-muted">Keine Plattformzahlen erfasst – automatischer Abruf nicht angebunden.</p>
                ) : (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {auswertung.plattformKennzahlen.map((k, i) => (
                      <div key={`${k.plattform}-${k.metrik}-${i}`} className="relative">
                        <ZahlKarte label={`${k.plattform} · ${k.label}`} zahl={k.zahl} />
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <ZahlKarte label="Eindeutige Personen" zahl={auswertung.eindeutigePersonen} />
                  <ZahlKarte label="Newsletter-Anmeldungen" zahl={auswertung.newsletter} />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-foreground">Stufen (nur ausdrücklich erzeugte Links)</h3>
                <div className="mt-2">
                  <Stufen knoten={auswertung.stufen} />
                </div>
              </div>

              <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-muted">
                {auswertung.hinweise.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Kennzahlen manuell */}
          <section className="card space-y-3 p-4">
            <h2 className="text-sm font-semibold text-foreground">Plattformzahlen eintragen</h2>
            <p className="text-[11px] text-muted">
              Solange keine Statistik-Schnittstelle angebunden ist, können Zahlen aus der Plattform-Statistik von Hand übertragen werden. Sie erscheinen
              mit Quelle „manuell“{kampagne.istDemo ? " (in Demo-Kampagnen als DEMO)" : ""}.
            </p>
            {kampagne.kennzahlen.length > 0 && (
              <ul className="space-y-1 text-xs">
                {kampagne.kennzahlen.map((z) => (
                  <li key={z.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border px-2 py-1">
                    <span className="text-foreground">
                      {z.plattform} · {METRIK_INFO[z.metrik as keyof typeof METRIK_INFO]?.label ?? z.metrik}: {z.wert.toLocaleString("de-DE")}
                    </span>
                    <span className="text-muted">
                      {datum(z.zeitraumVon)} – {datum(z.zeitraumBis)} · {z.quelle === "DEMO" ? "DEMO" : "manuell"}
                    </span>
                    {darfBearbeiten && (
                      <button type="button" className="ml-auto text-muted hover:text-danger" disabled={laedt} onClick={() => aufruf(`/api/reichweite/kennzahlen/${z.id}`, "DELETE")} aria-label="Kennzahl löschen">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {darfBearbeiten && (
              <form onSubmit={kennzahlAnlegen} className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <select name="plattform" className={feld} required>
                  {["INSTAGRAM", "YOUTUBE", "FACEBOOK", "LINKEDIN", "TIKTOK", "SONSTIGE"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                <select name="metrik" className={feld} required>
                  {METRIKEN.map((m) => (
                    <option key={m} value={m}>
                      {METRIK_INFO[m].label}
                    </option>
                  ))}
                </select>
                <input name="wert" type="number" min={0} required placeholder="Wert" className={feld} />
                <input name="von" type="date" required className={feld} aria-label="Zeitraum von" />
                <input name="bis" type="date" required className={feld} aria-label="Zeitraum bis" />
                <button type="submit" className={knopfPrimaer} disabled={laedt}>
                  <Plus className="h-4 w-4" /> Eintragen
                </button>
              </form>
            )}
          </section>
        </>
      )}

      {/* Vorschläge */}
      <section className="card space-y-2 p-4">
        <h2 className="text-sm font-semibold text-foreground">Vorschläge für freiwillige Aufrufe zum Teilen</h2>
        <ul className="list-disc space-y-1 pl-4 text-xs text-foreground">
          {props.ctaVorschlaege.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="text-[11px] text-muted">
          Keine Garantie auf Reichweite. Keine automatischen Nachrichten, keine gekauften Aufrufe, Likes oder Follower, kein Auslesen von Kontaktlisten.
        </p>
      </section>
    </div>
  );
}
