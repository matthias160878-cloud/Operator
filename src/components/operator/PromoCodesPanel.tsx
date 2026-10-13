"use client";

import { useState } from "react";
import { Copy, Loader2, Ticket } from "lucide-react";

interface Row {
  id: string;
  hint: string;
  plan: string;
  label: string;
  usedCount: number;
  maxUses: number;
  createdAt: string;
}

const inputClass =
  "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function PromoCodesPanel({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [plan, setPlan] = useState<"PRO" | "MAXI">("MAXI");
  const [anzahl, setAnzahl] = useState(5);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [neu, setNeu] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function erzeugen() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/operator/promocodes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, anzahl, label }),
      });
      const data = (await res.json().catch(() => ({}))) as { codes?: string[]; error?: string };
      if (!res.ok || !data.codes) {
        setError(data.error ?? "Anlegen fehlgeschlagen.");
        return;
      }
      setNeu(data.codes);
      const list = await fetch("/api/operator/promocodes", { cache: "no-store" });
      if (list.ok) setRows(((await list.json()) as { codes: Row[] }).codes);
    } finally {
      setBusy(false);
    }
  }

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(neu.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Zwischenablage nicht verfügbar — Codes bleiben sichtbar */
    }
  }

  return (
    <section className="card space-y-3 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Ticket className="h-4 w-4 text-accent-2" /> Promocodes
      </h2>
      <p className="text-xs text-muted">
        Ein Code schaltet ein Paket dauerhaft frei, ohne Zahlung, je Code einmal. Der Klartext erscheint nur hier beim
        Anlegen — bitte sofort kopieren. Gespeichert wird nur ein Hash. Kunden lösen den Code unter „Paket &amp;
        Abrechnung“ ein. Ein laufendes bezahltes Abo wird nie überschrieben.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-muted">
          Paket
          <select value={plan} onChange={(e) => setPlan(e.target.value as "PRO" | "MAXI")} className={`${inputClass} mt-1 block min-h-11`}>
            <option value="MAXI">Maxi</option>
            <option value="PRO">Pro</option>
          </select>
        </label>
        <label className="text-xs text-muted">
          Anzahl
          <input type="number" min={1} max={20} value={anzahl} onChange={(e) => setAnzahl(Number(e.target.value))} className={`${inputClass} mt-1 block min-h-11 w-24`} />
        </label>
        <label className="flex-1 text-xs text-muted">
          Bezeichnung (optional)
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="z. B. Partner Oktober" className={`${inputClass} mt-1 block min-h-11 w-full`} />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={erzeugen}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Codes erzeugen
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {neu.length > 0 && (
        <div className="rounded-lg border border-success/40 bg-success/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-success">Neue Codes — jetzt kopieren, sie werden nicht erneut angezeigt:</span>
            <button type="button" onClick={kopieren} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs text-foreground">
              <Copy className="h-3.5 w-3.5" /> {copied ? "Kopiert" : "Alle kopieren"}
            </button>
          </div>
          <ul className="mt-2 space-y-1 font-mono text-sm text-foreground">
            {neu.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-2 py-2 font-medium">Code</th>
              <th className="px-2 py-2 font-medium">Paket</th>
              <th className="px-2 py-2 font-medium">Bezeichnung</th>
              <th className="px-2 py-2 font-medium">Eingelöst</th>
              <th className="px-2 py-2 font-medium">Angelegt</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-xs text-muted">Noch keine Codes.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-2 py-2 font-mono text-foreground">{r.hint}</td>
                <td className="px-2 py-2 text-foreground">{r.plan}</td>
                <td className="px-2 py-2 text-muted">{r.label || "—"}</td>
                <td className="px-2 py-2 text-foreground">
                  {r.usedCount} / {r.maxUses}
                </td>
                <td className="px-2 py-2 text-muted">{new Date(r.createdAt).toLocaleDateString("de-DE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
