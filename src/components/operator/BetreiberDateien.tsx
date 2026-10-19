"use client";

import { useEffect, useRef, useState } from "react";

const input = "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none";
const btn = "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent disabled:opacity-50";
const btnMain = "rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-accent hover:bg-accent/20 disabled:opacity-50";

interface Konto { id: string; name: string; anBetreiber: number; vomBetreiber: number }
interface Datei { id: string; ordner: string; name: string; groesse: number; quelle: string; quelleName: string; createdAt: string }

const groesse = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1).replace(".", ",")} KB` : `${(n / 1048576).toFixed(1).replace(".", ",")} MB`);

/**
 * Betreiberansicht des Dateiaustauschs: je Kundenkonto nur „An SECRET 58“ (vom Kunden für den
 * Betreiber) und die eigenen Ablagen in „Von SECRET 58“. Andere Kundenordner bleiben unsichtbar.
 */
export function BetreiberDateien() {
  const [konten, setKonten] = useState<Konto[] | null>(null);
  const [konto, setKonto] = useState("");
  const [dateien, setDateien] = useState<Datei[]>([]);
  const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/operator/dateien").then((r) => r.json()).then((d) => { if (alive) setKonten(d.konten ?? []); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!konto) return;
    let alive = true;
    fetch(`/api/operator/dateien?konto=${encodeURIComponent(konto)}`).then((r) => r.json()).then((d) => { if (alive) setDateien(d.dateien ?? []); });
    return () => { alive = false; };
  }, [konto]);

  async function neu() {
    const [k, d] = await Promise.all([
      fetch("/api/operator/dateien").then((r) => r.json()),
      fetch(`/api/operator/dateien?konto=${encodeURIComponent(konto)}`).then((r) => r.json()),
    ]);
    setKonten(k.konten ?? []);
    setDateien(d.dateien ?? []);
  }

  async function hochladen(files: FileList) {
    if (!konto || !files.length) return;
    const name = konten?.find((k) => k.id === konto)?.name ?? "Kunde";
    if (!confirm(`${files.length} Datei(en) an „${name}“ übergeben? Der Kunde sieht sie in „Von SECRET 58“.`)) return;
    setBusy(true);
    setMsg(null);
    const fehler: string[] = [];
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("datei", f);
      fd.append("konto", konto);
      const r = await fetch("/api/operator/dateien", { method: "POST", body: fd });
      if (!r.ok) fehler.push(`${f.name}: ${(await r.json().catch(() => ({}))).error || "Fehler"}`);
    }
    setMsg(fehler.length ? { t: `Nicht übergeben: ${fehler.join(" · ")}`, bad: true } : { t: `An „${name}“ übergeben.` });
    if (ref.current) ref.current.value = "";
    await neu();
    setBusy(false);
  }

  if (!konten) return <p className="text-sm text-muted">Lade Kundenkonten …</p>;
  const an = dateien.filter((d) => d.ordner === "An SECRET 58");
  const von = dateien.filter((d) => d.ordner === "Von SECRET 58");

  const zeile = (d: Datei, loeschbar: boolean) => (
    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
      <span className="min-w-0 break-all text-foreground">
        {d.name} <span className="text-xs text-muted">{groesse(d.groesse)}</span>
        <span className="block text-xs text-muted">{d.quelleName || d.quelle} · {new Date(d.createdAt).toLocaleString("de-DE")}</span>
      </span>
      <span className="flex gap-1.5">
        <a className={btn} href={`/api/operator/dateien/${d.id}`}>Laden</a>
        {loeschbar && (
          <button className={btn} disabled={busy} onClick={async () => {
            if (!confirm(`„${d.name}“ beim Kunden entfernen?`)) return;
            setBusy(true);
            const r = await fetch(`/api/operator/dateien/${d.id}`, { method: "DELETE" });
            setMsg(r.ok ? { t: "Entfernt." } : { t: "Entfernen fehlgeschlagen.", bad: true });
            await neu();
            setBusy(false);
          }}>Entfernen</button>
        )}
      </span>
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <label className="block text-sm text-foreground">
          Kundenkonto
          <select className={`${input} mt-1 w-full`} value={konto} onChange={(e) => { setKonto(e.target.value); setMsg(null); }}>
            <option value="">Bitte wählen …</option>
            {konten.map((k) => (
              <option key={k.id} value={k.id}>{k.name}{k.anBetreiber ? ` · ${k.anBetreiber} Datei(en) für Sie` : ""}</option>
            ))}
          </select>
        </label>
        {msg && <p className={`text-sm ${msg.bad ? "text-red-400" : "text-emerald-400"}`} role="status">{msg.t}</p>}
      </div>
      {konto && (
        <>
          <div className="card space-y-2 p-4">
            <h2 className="text-base font-semibold text-foreground">Vom Kunden: „An SECRET 58“</h2>
            <ul className="space-y-2">{an.length ? an.map((d) => zeile(d, false)) : <li className="text-sm text-muted">Keine Dateien.</li>}</ul>
          </div>
          <div className="card space-y-2 p-4">
            <h2 className="text-base font-semibold text-foreground">An den Kunden: „Von SECRET 58“</h2>
            <label className={`${btnMain} inline-block cursor-pointer`}>
              Datei(en) an Kunden übergeben
              <input ref={ref} type="file" multiple className="hidden" disabled={busy} onChange={(e) => e.target.files && hochladen(e.target.files)} />
            </label>
            <ul className="space-y-2">{von.length ? von.map((d) => zeile(d, true)) : <li className="text-sm text-muted">Noch nichts übergeben.</li>}</ul>
          </div>
        </>
      )}
      <p className="text-xs text-muted">Andere Ordner der Kunden (eigene Dateien, Agenten-Ergebnisse) sind hier bewusst nicht sichtbar.</p>
    </div>
  );
}
