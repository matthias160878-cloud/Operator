"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Verbrauchslimits für KI mit eigenem Schlüssel. Leer = kein eigenes Limit. */
export function KiLimitFormular({ aufrufe, kostenUsd }: { aufrufe: number | null; kostenUsd: number | null }) {
  const router = useRouter();
  const [a, setA] = useState(aufrufe?.toString() ?? "");
  const [k, setK] = useState(kostenUsd?.toString() ?? "");
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [laedt, setLaedt] = useState(false);
  const zahl = (s: string) => (s.trim() ? Number(s.replace(",", ".")) : null);
  return (
    <form
      className="space-y-2"
      data-testid="ki-limits"
      onSubmit={async (e) => {
        e.preventDefault();
        setLaedt(true);
        setMeldung(null);
        const aufrufeMonat = zahl(a);
        const res = await fetch("/api/zugaenge/limits", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ aufrufeMonat: aufrufeMonat === null ? null : Math.round(aufrufeMonat), kostenMonatUsd: zahl(k) }),
        });
        const data = await res.json().catch(() => ({}));
        setLaedt(false);
        setMeldung(res.ok ? { ok: true, text: "Limits gespeichert." } : { ok: false, text: data.error ?? "Speichern fehlgeschlagen." });
        if (res.ok) router.refresh();
      }}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-muted">
          Höchstens Aufrufe pro Monat
          <input className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground" type="number" min="1" step="1" value={a} onChange={(e) => setA(e.target.value)} placeholder="kein Limit" />
        </label>
        <label className="space-y-1 text-xs text-muted">
          Höchstens geschätzte Kosten pro Monat (US-$)
          <input className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground" type="number" min="0.01" step="0.01" value={k} onChange={(e) => setK(e.target.value)} placeholder="kein Limit" />
        </label>
      </div>
      <button type="submit" disabled={laedt} className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 py-2 text-sm text-foreground disabled:opacity-50">
        Limits speichern
      </button>
      {meldung && <p className={`text-xs ${meldung.ok ? "text-success" : "text-danger"}`} role="status">{meldung.text}</p>}
    </form>
  );
}
