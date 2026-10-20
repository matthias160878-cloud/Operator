"use client";

import { useState } from "react";
import { feld, knopfPrimaer } from "@/components/reichweitenaufbau/stil";

interface Ergebnis {
  referenz: string;
  eingangText: string;
  zeitpunktText: string;
  zeilen: [string, string][];
  emailGesendet: boolean;
  meldung: string;
}

/** Bestätigungsseite des Kündigungsbuttons (§ 312k Abs. 2–4 BGB). */
export function KuendigungsFormular({ vertraege, heute }: { vertraege: Record<string, string>; heute: string }) {
  const [art, setArt] = useState<"ORDENTLICH" | "AUSSERORDENTLICH">("ORDENTLICH");
  const [grund, setGrund] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [kundennummer, setKundennummer] = useState("");
  const [vertrag, setVertrag] = useState("PRO");
  const [vertragBeschreibung, setVertragBeschreibung] = useState("");
  const [zeitpunktArt, setZeitpunktArt] = useState<"naechstmoeglich" | "datum">("naechstmoeglich");
  const [datum, setDatum] = useState("");
  const [bestaetigungEmail, setBestaetigungEmail] = useState("");
  const [sendet, setSendet] = useState(false);
  const [fehler, setFehler] = useState("");
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setFehler("");
    setSendet(true);
    try {
      const res = await fetch("/api/kuendigen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          art,
          grund: art === "AUSSERORDENTLICH" ? grund : "",
          name,
          email,
          kundennummer,
          vertrag,
          vertragBeschreibung: vertrag === "SONSTIGES" ? vertragBeschreibung : "",
          zeitpunkt: zeitpunktArt === "datum" ? datum : "naechstmoeglich",
          bestaetigungEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFehler(typeof data.meldung === "string" ? data.meldung : "Die Kündigung konnte nicht übermittelt werden. Bitte erneut versuchen oder an info@secret58.com schreiben.");
        return;
      }
      setErgebnis(data as Ergebnis);
      window.scrollTo({ top: 0 });
    } catch {
      setFehler("Keine Verbindung zum Server. Bitte erneut versuchen oder an info@secret58.com schreiben.");
    } finally {
      setSendet(false);
    }
  }

  if (ergebnis) {
    return (
      <section className="space-y-3" aria-live="polite" data-testid="kuendigung-bestaetigung">
        <h2 className="text-base font-semibold">Eingangsbestätigung Ihrer Kündigung</h2>
        <p>{ergebnis.meldung}</p>
        {!ergebnis.emailGesendet && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
            Die E-Mail konnte nicht versendet werden. Diese Bildschirmbestätigung ist Ihr Eingangsnachweis — bitte jetzt
            speichern oder drucken.
          </p>
        )}
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg border border-border bg-surface-2 p-4 sm:grid-cols-[auto_1fr]">
          {ergebnis.zeilen.map(([a, b]) => (
            <div key={a} className="contents">
              <dt className="text-xs text-muted">{a}</dt>
              <dd className="break-words font-medium">{b}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted">
          Wir bearbeiten Ihre Kündigung und teilen Ihnen das Vertragsende mit. Bitte bewahren Sie die Referenznummer auf.
        </p>
        <button type="button" className={`${knopfPrimaer} print:hidden`} onClick={() => window.print()}>
          Bestätigung drucken/speichern
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={absenden} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="mb-1 font-medium">Art der Kündigung</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="art" value="ORDENTLICH" checked={art === "ORDENTLICH"} onChange={() => setArt("ORDENTLICH")} />
          Ordentliche Kündigung
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="art" value="AUSSERORDENTLICH" checked={art === "AUSSERORDENTLICH"} onChange={() => setArt("AUSSERORDENTLICH")} />
          Außerordentliche Kündigung
        </label>
        {art === "AUSSERORDENTLICH" && (
          <div>
            <label htmlFor="k-grund" className="mb-1 block text-xs text-muted">Kündigungsgrund (freiwillig)</label>
            <textarea id="k-grund" className={feld} rows={3} maxLength={1000} value={grund} onChange={(e) => setGrund(e.target.value)} />
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor="k-name" className="mb-1 block font-medium">Name</label>
        <input id="k-name" className={feld} required maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 font-medium">Angaben zur Identifizierung</legend>
        <div>
          <label htmlFor="k-email" className="mb-1 block text-xs text-muted">E-Mail-Adresse Ihres Kontos</label>
          <input id="k-email" type="email" className={feld} required maxLength={200} autoComplete="email" value={email}
            onChange={(e) => { setEmail(e.target.value); if (!bestaetigungEmail || bestaetigungEmail === email) setBestaetigungEmail(e.target.value); }} />
        </div>
        <div>
          <label htmlFor="k-kundennummer" className="mb-1 block text-xs text-muted">Arbeitsbereich oder Kundennummer (freiwillig)</label>
          <input id="k-kundennummer" className={feld} maxLength={120} value={kundennummer} onChange={(e) => setKundennummer(e.target.value)} />
        </div>
      </fieldset>

      <div>
        <label htmlFor="k-vertrag" className="mb-1 block font-medium">Vertrag</label>
        <select id="k-vertrag" className={feld} value={vertrag} onChange={(e) => setVertrag(e.target.value)}>
          {Object.entries(vertraege).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {vertrag === "SONSTIGES" && (
          <div className="mt-2">
            <label htmlFor="k-vertrag-beschreibung" className="mb-1 block text-xs text-muted">Beschreibung des Vertrags</label>
            <input id="k-vertrag-beschreibung" className={feld} required maxLength={300} value={vertragBeschreibung} onChange={(e) => setVertragBeschreibung(e.target.value)} />
          </div>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 font-medium">Zeitpunkt der Kündigung</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="zeitpunkt" checked={zeitpunktArt === "naechstmoeglich"} onChange={() => setZeitpunktArt("naechstmoeglich")} />
          zum nächstmöglichen Zeitpunkt
        </label>
        <label className="flex flex-wrap items-center gap-2">
          <input type="radio" name="zeitpunkt" checked={zeitpunktArt === "datum"} onChange={() => setZeitpunktArt("datum")} />
          zu einem bestimmten Datum:
          <input type="date" aria-label="Datum der Kündigung" className={`${feld} w-auto`} min={heute} value={datum} required={zeitpunktArt === "datum"}
            onChange={(e) => { setDatum(e.target.value); setZeitpunktArt("datum"); }} />
        </label>
      </fieldset>

      <div>
        <label htmlFor="k-bestaetigung" className="mb-1 block font-medium">E-Mail-Adresse für die Eingangsbestätigung</label>
        <input id="k-bestaetigung" type="email" className={feld} required maxLength={200} value={bestaetigungEmail} onChange={(e) => setBestaetigungEmail(e.target.value)} />
      </div>

      {fehler && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs">{fehler}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={knopfPrimaer} disabled={sendet}>jetzt kündigen</button>
        {sendet && <span className="text-xs text-muted">wird übermittelt …</span>}
      </div>
    </form>
  );
}
