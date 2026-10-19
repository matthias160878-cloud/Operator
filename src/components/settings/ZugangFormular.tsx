"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Eingabe eines eigenen Zugangs. Der Schlüssel geht nur einmal an den Server und kommt nie zurück. */
export function ZugangFormular({ anbieter, felder, vorhanden }: { anbieter: string; felder: { key: string; label: string; geheim: boolean; platzhalter: string }[]; vorhanden: boolean }) {
  const router = useRouter();
  const [laedt, setLaedt] = useState(false);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);

  async function senden(url: string, init: RequestInit) {
    setLaedt(true);
    setMeldung(null);
    const res = await fetch(url, { ...init, headers: { "content-type": "application/json" } });
    const data = await res.json().catch(() => ({}));
    setLaedt(false);
    if (!res.ok) return setMeldung({ ok: false, text: data.error ?? "Speichern fehlgeschlagen." });
    if (data.pruefung) setMeldung({ ok: data.pruefung.status === "OK", text: data.pruefung.meldung });
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <form
        className="grid gap-2 sm:grid-cols-2"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const werte = Object.fromEntries(felder.map((x) => [x.key, String(f.get(x.key) ?? "")]));
          (e.currentTarget as HTMLFormElement).reset();
          void senden("/api/zugaenge", { method: "PUT", body: JSON.stringify({ anbieter, werte }) });
        }}
      >
        {felder.map((x) => (
          <label key={x.key} className="space-y-1 text-xs text-muted">
            {x.label}
            <input
              name={x.key}
              type={x.geheim ? "password" : "text"}
              required
              maxLength={300}
              placeholder={x.platzhalter}
              autoComplete={x.geheim ? "new-password" : "off"}
              spellCheck={false}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
            />
          </label>
        ))}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button type="submit" disabled={laedt} className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {vorhanden ? "Ersetzen und prüfen" : "Speichern und prüfen"}
          </button>
          {vorhanden && (
            <>
              <button
                type="button"
                disabled={laedt}
                className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 py-2 text-sm text-foreground"
                onClick={() => senden("/api/zugaenge/pruefen", { method: "POST", body: JSON.stringify({ anbieter }) })}
              >
                Erneut prüfen
              </button>
              <button
                type="button"
                disabled={laedt}
                className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-danger"
                onClick={() => confirm("Zugang löschen? Danach läuft der Newsletter nur noch als Demo.") && senden(`/api/zugaenge?anbieter=${anbieter}`, { method: "DELETE" })}
              >
                Löschen
              </button>
            </>
          )}
        </div>
      </form>
      {meldung && <p className={`text-xs ${meldung.ok ? "text-success" : "text-danger"}`}>{meldung.text}</p>}
    </div>
  );
}
