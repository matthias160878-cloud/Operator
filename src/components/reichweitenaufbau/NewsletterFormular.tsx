"use client";

import { useState } from "react";

const feld = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted";

/** Öffentliches Anmeldeformular mit Themenwahl und Einwilligung (Double-Opt-in). */
export function NewsletterFormular({ code, themen, einwilligung, refCode, datenschutzUrl }: { code: string; themen: string[]; einwilligung: string; refCode: string | null; datenschutzUrl: string | null }) {
  const [gewaehlt, setGewaehlt] = useState<string[]>(themen);
  const [antwort, setAntwort] = useState<{ meldung: string; demo?: boolean; bestaetigungsUrl?: string | null; abmeldeUrl?: string | null } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function senden(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLaedt(true);
    setFehler(null);
    const res = await fetch(`/api/nl/${code}/anmelden`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: f.get("email"), themen: gewaehlt, einwilligung: f.get("einwilligung") === "on", ref: refCode, website: f.get("website") ?? "" }),
    });
    const data = await res.json().catch(() => ({}));
    setLaedt(false);
    if (!res.ok) return setFehler(data.error ?? "Anmeldung nicht möglich.");
    setAntwort(data);
  }

  if (antwort) {
    return (
      <div className="space-y-2" data-testid="nl-antwort">
        <p className="text-sm text-foreground">{antwort.meldung}</p>
        {antwort.demo && antwort.bestaetigungsUrl && (
          <a href={antwort.bestaetigungsUrl} className="inline-flex min-h-11 items-center rounded-lg border border-warning/60 px-4 py-2 text-sm text-warning">
            DEMO: Anmeldung bestätigen
          </a>
        )}
        {antwort.demo && antwort.abmeldeUrl && (
          <a href={antwort.abmeldeUrl} className="ml-2 inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm text-muted">
            DEMO: Abmelden
          </a>
        )}
      </div>
    );
  }
  return (
    <form onSubmit={senden} className="space-y-3">
      <input name="email" type="email" required maxLength={320} placeholder="E-Mail-Adresse" autoComplete="email" className={feld} />
      {themen.length > 0 && (
        <fieldset className="space-y-1">
          <legend className="text-xs text-muted">Themen (mindestens eins)</legend>
          {themen.map((t) => (
            <label key={t} className="flex min-h-9 items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={gewaehlt.includes(t)}
                onChange={(e) => setGewaehlt(e.target.checked ? [...gewaehlt, t] : gewaehlt.filter((x) => x !== t))}
              />
              {t}
            </label>
          ))}
        </fieldset>
      )}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="flex items-start gap-2 text-xs text-muted">
        <input type="checkbox" name="einwilligung" required className="mt-0.5 h-4 w-4" />
        <span>
          {einwilligung}
          {datenschutzUrl && (
            <>
              {" "}Details: <a href={datenschutzUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">Datenschutzerklärung</a>
            </>
          )}
        </span>
      </label>
      <button
        type="submit"
        disabled={laedt || (themen.length > 0 && gewaehlt.length === 0)}
        className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {laedt ? "Wird gesendet …" : "Anmelden"}
      </button>
      {fehler && <p className="text-xs text-danger">{fehler}</p>}
      <p className="text-[11px] text-muted">Sie erhalten erst nach Bestätigung per E-Mail Post. Abmeldung jederzeit über den Link in jeder Ausgabe.</p>
    </form>
  );
}
