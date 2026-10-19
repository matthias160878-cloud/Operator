"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const input = "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";
const btn = "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent disabled:opacity-50";
const btnMain = "rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm text-accent hover:bg-accent/20 disabled:opacity-50";
const chip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-xs ${on ? "border-accent bg-accent/15 text-accent" : "border-border text-foreground hover:border-accent"}`;

interface Datei { id: string; ordner: string; name: string; groesse: number; quelle: string; quelleName: string; createdAt: string }
interface Link { id: string; titel: string; url: string; art: string }
interface Freigabe { id: string; dateiId: string; ablauf: string; maxAbrufe: number; abrufe: number }
interface Stand { dateien: Datei[]; links: Link[]; freigaben: Freigabe[]; ordner: string[]; belegtBytes: number; kontingentBytes: number; maxDateiBytes: number }

const STANDARD = ["Eigene Dateien", "Von Agenten", "An SECRET 58", "Von SECRET 58"];
const HINWEIS: Record<string, string> = {
  "An SECRET 58": "Dateien hier sieht SECRET 58. Alle anderen Ordner bleiben privat.",
  "Von SECRET 58": "Hier legt SECRET 58 Dateien für Sie ab.",
  "Von Agenten": "Hier legen Ihre Agenten ihre Ergebnisse ab.",
};
const LINK_ARTEN = ["Eigene Webseite", "Shop", "Social Media", "Cloud-Ordner / Dokument", "Sonstiges"];
const ANSICHT = /\.(pdf|png|jpe?g|gif|webp|txt|csv)$/i;

const groesse = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1).replace(".", ",")} KB` : `${(n / 1048576).toFixed(1).replace(".", ",")} MB`);
const quelle = (d: Datei) => (d.quelle === "AGENT" ? `Agent: ${d.quelleName}` : d.quelle === "BETREIBER" ? "von SECRET 58" : d.quelleName || "von Ihnen");

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: body === undefined ? {} : { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Das hat nicht geklappt.");
  return d;
}

export function DateienPanel() {
  const [st, setSt] = useState<Stand | null>(null);
  const [ordner, setOrdner] = useState("Eigene Dateien");
  const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [neuerLink, setNeuerLink] = useState<{ dateiId: string; url: string } | null>(null);
  const [link, setLink] = useState({ titel: "", url: "", art: "Eigene Webseite" });
  const [ziehen, setZiehen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const laden = useCallback(() => fetch("/api/dateien").then((r) => r.json()).then((d: Stand) => setSt(d)), []);
  useEffect(() => {
    let alive = true;
    fetch("/api/dateien").then((r) => r.json()).then((d: Stand) => { if (alive) setSt(d); }).catch(() => { if (alive) setMsg({ t: "Dateien konnten nicht geladen werden.", bad: true }); });
    return () => { alive = false; };
  }, []);

  async function run(fn: () => Promise<unknown>, ok?: string) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (ok) setMsg({ t: ok });
      await laden();
    } catch (e) {
      setMsg({ t: e instanceof Error ? e.message : "Das hat nicht geklappt.", bad: true });
    } finally {
      setBusy(false);
    }
  }

  async function hochladen(list: FileList | File[]) {
    const files = Array.from(list);
    if (!files.length) return;
    await run(async () => {
      let n = 0;
      const fehler: string[] = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append("datei", f);
        fd.append("ordner", ordner);
        const r = await fetch("/api/dateien", { method: "POST", body: fd });
        if (r.ok) n++;
        else fehler.push(`${f.name}: ${(await r.json().catch(() => ({}))).error || "Fehler"}`);
      }
      if (fehler.length) throw new Error(`${n} hochgeladen. Nicht angenommen: ${fehler.join(" · ")}`);
    }, `${files.length === 1 ? "Datei" : `${files.length} Dateien`} in „${ordner}“ gespeichert.`);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (!st) return <p className="text-sm text-muted">{msg?.t ?? "Lade Dateien …"}</p>;

  const liste = st.dateien.filter((d) => d.ordner === ordner);
  const fr = (id: string) => st.freigaben.filter((f) => f.dateiId === id);
  const pct = Math.min(100, Math.round((st.belegtBytes / st.kontingentBytes) * 100));

  return (
    <div className="space-y-5">
      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ordner">
          {st.ordner.map((o) => (
            <button key={o} className={chip(o === ordner)} onClick={() => setOrdner(o)}>
              📁 {o} <span className="opacity-70">{st.dateien.filter((d) => d.ordner === o).length}</span>
            </button>
          ))}
          <button className={chip(false)} disabled={busy} onClick={() => {
            const n = prompt("Name des neuen Ordners", "");
            if (n) void run(async () => { const r = await call("/api/dateien/ordner", "POST", { name: n }); setOrdner(r.ordner); }, "Ordner angelegt.");
          }}>+ Neuer Ordner</button>
          {!STANDARD.includes(ordner) && (
            <button className={chip(false)} disabled={busy} onClick={() => run(async () => { await call("/api/dateien/ordner", "DELETE", { name: ordner }); setOrdner("Eigene Dateien"); }, "Ordner gelöscht.")}>Ordner löschen</button>
          )}
        </div>
        {HINWEIS[ordner] && <p className="text-xs text-muted">{HINWEIS[ordner]}</p>}

        {ordner !== "Von SECRET 58" && (
          <div
            className={`rounded-lg border-2 border-dashed p-4 text-center text-sm ${ziehen ? "border-accent bg-accent/10" : "border-border"}`}
            onDragOver={(e) => { e.preventDefault(); setZiehen(true); }}
            onDragLeave={() => setZiehen(false)}
            onDrop={(e) => { e.preventDefault(); setZiehen(false); void hochladen(e.dataTransfer.files); }}
          >
            <span className="text-foreground">Dateien hierher ziehen oder </span>
            <label className={`${btnMain} inline-block cursor-pointer whitespace-nowrap`}>
              Dateien auswählen
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && hochladen(e.target.files)} disabled={busy} />
            </label>
            <p className="mt-2 text-xs text-muted">
              Landet in „{ordner}“. PDF, Word, Excel, PowerPoint, Bilder, ZIP und weitere — bis {groesse(st.maxDateiBytes)} je Datei. Ausführbare Dateien (.exe, .bat, .js …) sind gesperrt.
            </p>
          </div>
        )}

        {msg && <p className={`text-sm ${msg.bad ? "text-red-400" : "text-emerald-400"}`} role="status">{msg.t}</p>}

        <ul className="space-y-2">
          {liste.length ? liste.map((d) => (
            <li key={d.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 break-all text-sm text-foreground">
                  {d.name} <span className="text-xs text-muted">{groesse(d.groesse)}</span>
                  <span className="block text-xs text-muted">{quelle(d)} · {new Date(d.createdAt).toLocaleString("de-DE")}</span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {ANSICHT.test(d.name) && <a className={btn} href={`/api/dateien/${d.id}?ansehen=1`} target="_blank" rel="noopener noreferrer">Ansehen</a>}
                  <a className={btn} href={`/api/dateien/${d.id}`}>Laden</a>
                  <select className={`${input} py-1.5`} aria-label="Verschieben nach" value={d.ordner} disabled={busy}
                    onChange={(e) => run(() => call(`/api/dateien/${d.id}`, "PATCH", { ordner: e.target.value }), `Verschoben nach „${e.target.value}“.`)}>
                    {st.ordner.filter((o) => o !== "Von SECRET 58" || d.ordner === "Von SECRET 58").map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <button className={btn} disabled={busy} onClick={() => {
                    const n = prompt("Neuer Dateiname", d.name);
                    if (n && n !== d.name) void run(() => call(`/api/dateien/${d.id}`, "PATCH", { name: n }), "Umbenannt.");
                  }}>Umbenennen</button>
                  <button className={btn} disabled={busy} onClick={() => run(async () => {
                    const r = await call(`/api/dateien/${d.id}/freigabe`, "POST", { tage: 7, maxAbrufe: 5 });
                    setNeuerLink({ dateiId: d.id, url: `${window.location.origin}${r.freigabe.pfad}` });
                  }, "Freigabe-Link erstellt (7 Tage, 5 Abrufe).")}>Link teilen</button>
                  <button className={btn} disabled={busy} onClick={() => {
                    if (confirm(`„${d.name}“ endgültig löschen?`)) void run(() => call(`/api/dateien/${d.id}`, "DELETE"), "Gelöscht.");
                  }}>Löschen</button>
                </span>
              </div>
              {neuerLink?.dateiId === d.id && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-accent/40 bg-accent/5 p-2 text-xs">
                  <input className={`${input} min-w-0 flex-1`} readOnly value={neuerLink.url} onFocus={(e) => e.target.select()} aria-label="Freigabe-Link" />
                  <button className={btn} onClick={() => navigator.clipboard?.writeText(neuerLink.url).then(() => setMsg({ t: "Link kopiert." }), () => undefined)}>Kopieren</button>
                  <span className="w-full text-muted">Der Link wird nur jetzt angezeigt. Jeder mit dem Link kann die Datei laden — höchstens 5-mal, 7 Tage lang.</span>
                </div>
              )}
              {fr(d.id).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                  {fr(d.id).map((f) => (
                    <span key={f.id} className="rounded-full border border-border px-2 py-0.5">
                      Link aktiv bis {new Date(f.ablauf).toLocaleDateString("de-DE")} · {f.abrufe}/{f.maxAbrufe} Abrufe{" "}
                      <button className="underline" disabled={busy} onClick={() => run(() => call(`/api/dateien/freigaben/${f.id}`, "DELETE"), "Link widerrufen.")}>widerrufen</button>
                    </span>
                  ))}
                </div>
              )}
            </li>
          )) : <li className="text-sm text-muted">Keine Dateien in diesem Ordner.</li>}
        </ul>
        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-xs text-muted">Belegt: {groesse(st.belegtBytes)} von {groesse(st.kontingentBytes)}. Dateien liegen auf dem Server von SECRET 58, getrennt je Kundenkonto.</p>
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <h2 className="text-base font-semibold text-foreground">Webseite &amp; Links</h2>
        <p className="text-xs text-muted">Verlinken Sie Ihre eigene Webseite, Ihren Shop, Social-Media-Profile oder freigegebene Cloud-Ordner.</p>
        <form className="grid gap-2 sm:flex sm:flex-wrap" onSubmit={(e) => {
          e.preventDefault();
          void run(async () => { await call("/api/dateien/links", "POST", link); setLink({ titel: "", url: "", art: link.art }); }, "Link gespeichert.");
        }}>
          <input className={`${input} w-full sm:w-auto sm:min-w-0 sm:flex-1`} placeholder="Bezeichnung, z. B. Meine Webseite" maxLength={80} value={link.titel} onChange={(e) => setLink({ ...link, titel: e.target.value })} aria-label="Bezeichnung" />
          <input className={`${input} w-full sm:w-auto sm:min-w-0 sm:flex-1`} placeholder="www.ihre-firma.de" inputMode="url" maxLength={500} value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} aria-label="Adresse" />
          <select className={input} value={link.art} onChange={(e) => setLink({ ...link, art: e.target.value })} aria-label="Art">
            {LINK_ARTEN.map((a) => <option key={a}>{a}</option>)}
          </select>
          <button className={btnMain} disabled={busy || !link.url.trim()}>Link speichern</button>
        </form>
        <ul className="space-y-2">
          {st.links.length ? [...st.links].sort((a, b) => Number(b.art === "Eigene Webseite") - Number(a.art === "Eigene Webseite")).map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
              <span className="min-w-0 break-all text-foreground">
                {l.art === "Eigene Webseite" ? "🌐 " : "🔗 "}{l.titel}
                <span className="block text-xs text-muted">{l.art} · <a className="text-accent underline" href={l.url} target="_blank" rel="noopener noreferrer">{l.url}</a></span>
              </span>
              <span className="flex gap-1.5">
                <a className={btn} href={l.url} target="_blank" rel="noopener noreferrer">Öffnen</a>
                <button className={btn} disabled={busy} onClick={() => run(() => call(`/api/dateien/links/${l.id}`, "DELETE"), "Link entfernt.")}>Entfernen</button>
              </span>
            </li>
          )) : <li className="text-sm text-muted">Noch keine Links. Tragen Sie zuerst Ihre eigene Webseite ein.</li>}
        </ul>
      </div>
    </div>
  );
}
