"use client";

import { useState } from "react";
import { EIGENE_METRIKEN, EIGENSCHAFTEN, VARIANTEN_METRIKEN, VARIANTEN_METRIK_KEYS, type VariantenErgebnis, type VariantenMetrik } from "@/lib/reichweitenaufbau/varianten";
import { empfehlungsUrl } from "@/lib/reichweite/teilen";
import { Chip, DemoMarke, datum, useAktion } from "@/components/reichweitenaufbau/gemeinsam";
import { feld, karte, knopf, knopfPrimaer } from "@/components/reichweitenaufbau/stil";

interface Test {
  id: string;
  titel: string;
  ziel: string;
  hauptkennzahl: string;
  eigenschaft: string;
  datenquelle: string;
  laufzeitVon: string;
  laufzeitBis: string;
  zufallsverteilt: boolean;
  istDemo: boolean;
  varianten: { id: string; label: string; beschreibung: string; plattform: string; link: { code: string } | null; messwerte: { id: string; metrik: string; wert: number; quelle: string }[] }[];
}

const PLATTFORM_AUSWAHL = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "LINKEDIN", "FACEBOOK"];
const zahl = (n: number | null, stellen = 1) => (n === null ? "–" : n.toLocaleString("de-DE", { maximumFractionDigits: stellen }));

export function VariantenTab(props: {
  tests: Test[];
  auswertungen: { testId: string; ergebnis: VariantenErgebnis }[];
  kampagnen: { id: string; titel: string }[];
  inhalte: { id: string; title: string; platform: string }[];
  darfBearbeiten: boolean;
  origin: string;
}) {
  const { laedt, aufruf, rueckmeldung } = useAktion();
  const [anzahl, setAnzahl] = useState(2);

  async function anlegen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const plattform = String(f.get("plattform"));
    const varianten = Array.from({ length: anzahl }, (_, i) => ({
      label: String(f.get(`label${i}`) || `Variante ${String.fromCharCode(65 + i)}`),
      beschreibung: String(f.get(`beschreibung${i}`) ?? ""),
      plattform,
      contentItemId: String(f.get(`inhalt${i}`) ?? "") || null,
    }));
    const ok = await aufruf("/api/reichweitenaufbau/varianten", "POST", {
      titel: f.get("titel"),
      ziel: f.get("ziel"),
      hauptkennzahl: f.get("hauptkennzahl"),
      eigenschaft: f.get("eigenschaft"),
      datenquelle: f.get("datenquelle"),
      laufzeitVon: f.get("von"),
      laufzeitBis: f.get("bis"),
      zufallsverteilt: f.get("zufallsverteilt") === "on",
      kampagneId: String(f.get("kampagneId") ?? "") || null,
      varianten,
    });
    if (ok) form.reset();
  }

  return (
    <div className="space-y-5">
      {rueckmeldung}
      {props.darfBearbeiten && (
        <details className={karte}>
          <summary className="cursor-pointer text-sm font-semibold text-foreground">Neuen Variantenvergleich festlegen</summary>
          <form onSubmit={anlegen} className="mt-3 grid gap-2 sm:grid-cols-2">
            <input name="titel" required maxLength={160} placeholder="Titel, z. B. „Einstieg: Frage oder Ergebnis?“" className={feld} />
            <input name="ziel" required maxLength={300} placeholder="Ziel, z. B. mehr Klicks zur Angebotsseite" className={feld} />
            <label className="space-y-1 text-xs text-muted">
              Hauptkennzahl (vorher festlegen)
              <select name="hauptkennzahl" className={feld} defaultValue="LINKKLICKS">
                {VARIANTEN_METRIK_KEYS.map((m) => (
                  <option key={m} value={m}>
                    {VARIANTEN_METRIKEN[m].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted">
              Veränderte Eigenschaft (nur eine)
              <select name="eigenschaft" className={feld}>
                {Object.entries(EIGENSCHAFTEN).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted">
              Laufzeit von
              <input name="von" type="date" required className={feld} />
            </label>
            <label className="space-y-1 text-xs text-muted">
              Laufzeit bis
              <input name="bis" type="date" required className={feld} />
            </label>
            <input name="datenquelle" required maxLength={300} placeholder="Verfügbare Datenquelle, z. B. Instagram-Statistik (manuell)" className={feld} />
            <label className="space-y-1 text-xs text-muted">
              Plattform (alle Varianten gleich)
              <select name="plattform" className={feld}>
                {PLATTFORM_AUSWAHL.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted">
              Kampagne (für eigene Links je Variante)
              <select name="kampagneId" className={feld} defaultValue="">
                <option value="">Keine – nur Plattformwerte</option>
                {props.kampagnen.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.titel}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-start gap-2 text-xs text-muted">
              <input type="checkbox" name="zufallsverteilt" className="mt-0.5 h-4 w-4" />
              <span>Die Plattform hat die Varianten selbst zufällig auf dasselbe Publikum verteilt (echter A/B-Test). Sonst: Variantenvergleich.</span>
            </label>
            {Array.from({ length: anzahl }, (_, i) => (
              <fieldset key={i} className="space-y-1 rounded-lg border border-border p-2 sm:col-span-2">
                <legend className="px-1 text-xs text-muted">Variante {String.fromCharCode(65 + i)}</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input name={`label${i}`} maxLength={40} placeholder={`Variante ${String.fromCharCode(65 + i)}`} className={feld} />
                  <input name={`beschreibung${i}`} maxLength={300} placeholder="Was ist anders?" className={feld} />
                  <select name={`inhalt${i}`} className={feld} defaultValue="">
                    <option value="">Inhalt zuordnen (optional)</option>
                    {props.inhalte.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>
            ))}
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              {anzahl < 5 && (
                <button type="button" className={knopf} onClick={() => setAnzahl(anzahl + 1)}>
                  Variante hinzufügen
                </button>
              )}
              <button type="submit" className={knopfPrimaer} disabled={laedt}>
                Festlegen
              </button>
            </div>
          </form>
        </details>
      )}

      {props.tests.length === 0 && <p className="text-sm text-muted">Noch kein Variantenvergleich.</p>}
      {props.tests.map((t) => {
        const erg = props.auswertungen.find((a) => a.testId === t.id)?.ergebnis;
        return <TestKarte key={t.id} t={t} erg={erg} darfBearbeiten={props.darfBearbeiten} origin={props.origin} aufruf={aufruf} laedt={laedt} />;
      })}
    </div>
  );
}

function TestKarte({
  t,
  erg,
  darfBearbeiten,
  origin,
  aufruf,
  laedt,
}: {
  t: Test;
  erg: VariantenErgebnis | undefined;
  darfBearbeiten: boolean;
  origin: string;
  aufruf: ReturnType<typeof useAktion>["aufruf"];
  laedt: boolean;
}) {
  const metriken = VARIANTEN_METRIK_KEYS;
  const ton = erg?.status === "AUFFAELLIG" ? "gut" : erg?.status === "HINWEIS" ? "warn" : "neutral";

  async function eintragen(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const ok = await aufruf(`/api/reichweitenaufbau/varianten/${t.id}/messwerte`, "POST", {
      varianteId: f.get("varianteId"),
      metrik: f.get("metrik"),
      wert: Number(String(f.get("wert")).replace(",", ".")),
    });
    if (ok) form.reset();
  }

  return (
    <section className={karte} data-testid="variantentest">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">
          {t.titel} {t.istDemo && <DemoMarke />}
        </h2>
        <Chip>{erg?.bezeichnung ?? (t.zufallsverteilt ? "A/B-Test" : "Variantenvergleich")}</Chip>
      </div>
      <dl className="grid gap-1 text-xs sm:grid-cols-2">
        <div>
          <dt className="inline text-muted">Ziel: </dt>
          <dd className="inline text-foreground">{t.ziel}</dd>
        </div>
        <div>
          <dt className="inline text-muted">Hauptkennzahl: </dt>
          <dd className="inline text-foreground">{VARIANTEN_METRIKEN[t.hauptkennzahl as VariantenMetrik]?.label ?? t.hauptkennzahl}</dd>
        </div>
        <div>
          <dt className="inline text-muted">Veränderte Eigenschaft: </dt>
          <dd className="inline text-foreground">{EIGENSCHAFTEN[t.eigenschaft as keyof typeof EIGENSCHAFTEN] ?? t.eigenschaft}</dd>
        </div>
        <div>
          <dt className="inline text-muted">Laufzeit: </dt>
          <dd className="inline text-foreground">
            {datum(t.laufzeitVon)} – {datum(t.laufzeitBis)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="inline text-muted">Datenquelle: </dt>
          <dd className="inline text-foreground">{t.datenquelle}</dd>
        </div>
      </dl>

      {erg && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 pr-2 font-normal">Kennzahl</th>
                  {erg.tabelle.map((v) => (
                    <th key={v.varianteId} className="py-1 pr-2 font-normal">
                      {v.label} <span className="text-muted">({v.plattform})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-foreground">
                {metriken.map((m) => (
                  <tr key={m} className={`border-t border-border ${m === t.hauptkennzahl ? "bg-accent/10" : ""}`}>
                    <td className="py-1.5 pr-2">
                      {VARIANTEN_METRIKEN[m].label}
                      <div className="text-[10px] text-muted">{VARIANTEN_METRIKEN[m].einheit}</div>
                    </td>
                    {erg.tabelle.map((v) => {
                      const z = v.zellen[m];
                      return (
                        <td key={v.varianteId} className="py-1.5 pr-2 align-top">
                          {z.wert === null ? <span className="text-muted">nicht vorhanden</span> : zahl(z.wert)}
                          {z.quoteProzent !== null && <span className="text-muted"> ({zahl(z.quoteProzent, 2)} %)</span>}
                          {z.quelle && <div className="text-[10px] text-muted">{z.quelle}</div>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-1 rounded-lg border border-border bg-surface-2 p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Chip ton={ton}>{erg.status === "AUFFAELLIG" ? "statistisch auffällig" : erg.status === "HINWEIS" ? "Hinweis" : "keine Aussage"}</Chip>
              <span className="text-foreground" data-testid="varianten-aussage">
                {erg.aussage}
              </span>
            </div>
            <div className="text-muted">Formel: {erg.formel}. Quote in Klammern = Kennzahl ÷ Aufrufe der jeweiligen Variante.</div>
            <ul className="list-disc space-y-0.5 pl-4 text-muted">
              {erg.hinweise.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            {erg.einschaetzung.map((h) => (
              <p key={h} className="text-foreground">
                {h}
              </p>
            ))}
          </div>
        </>
      )}

      <div className="space-y-1 text-xs">
        {t.varianten.map((v) =>
          v.link ? (
            <div key={v.id} className="break-all text-muted">
              Link {v.label}: <span className="font-mono text-accent-2">{empfehlungsUrl(origin, v.link.code)}</span>
            </div>
          ) : null
        )}
      </div>

      {darfBearbeiten && (
        <form onSubmit={eintragen} className="grid gap-2 sm:grid-cols-4">
          <select name="varianteId" className={feld} aria-label="Variante">
            {t.varianten.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <select name="metrik" className={feld} aria-label="Kennzahl">
            {metriken
              .filter((m) => !(EIGENE_METRIKEN.includes(m) && t.varianten.every((v) => v.link)))
              .map((m) => (
                <option key={m} value={m}>
                  {VARIANTEN_METRIKEN[m].label}
                </option>
              ))}
          </select>
          <input name="wert" required inputMode="decimal" placeholder="Wert aus Plattform-Statistik" className={feld} />
          <button type="submit" className={knopf} disabled={laedt}>
            Eintragen ({t.istDemo ? "DEMO" : "manuell"})
          </button>
        </form>
      )}
      {darfBearbeiten && (
        <button
          type="button"
          className="text-xs text-muted underline hover:text-danger"
          disabled={laedt}
          onClick={() => confirm("Variantenvergleich mit allen eingetragenen Werten löschen?") && aufruf(`/api/reichweitenaufbau/varianten/${t.id}`, "DELETE")}
        >
          Löschen
        </button>
      )}
    </section>
  );
}
