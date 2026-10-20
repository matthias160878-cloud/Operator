"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STUFEN, STUFEN_LABEL, type Stufe } from "@/lib/reichweitenaufbau/status";

export function DemoMarke() {
  return <span className="rounded border border-warning/60 px-1.5 py-0.5 text-[10px] font-semibold text-warning">DEMO</span>;
}

export function Chip({ children, ton = "neutral" }: { children: React.ReactNode; ton?: "neutral" | "gut" | "warn" | "schlecht" }) {
  const farbe = { neutral: "border-border text-muted", gut: "border-success/50 text-success", warn: "border-warning/50 text-warning", schlecht: "border-danger/50 text-danger" }[ton];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${farbe}`}>{children}</span>;
}

/** Entwurf → Prüfung → freigegeben → geplant → veröffentlicht/versendet → ausgewertet */
export function StatusLeiste({ titel, zahlen }: { titel: string; zahlen: Record<Stufe, number> }) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted">{titel}</div>
      <ol className="grid grid-cols-3 gap-1 sm:grid-cols-6">
        {STUFEN.map((s) => (
          <li key={s} className={`rounded-md border px-2 py-1 text-center ${zahlen[s] ? "border-accent/60" : "border-border"}`}>
            <div className="text-sm font-semibold text-foreground">{zahlen[s]}</div>
            <div className="text-[10px] leading-tight text-muted">{STUFEN_LABEL[s]}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Gemeinsamer Aufruf der API mit Lade-, Fehler- und Erfolgsanzeige. Erfolg nur bei bestätigter Serverantwort. */
export function useAktion() {
  const router = useRouter();
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [meldung, setMeldung] = useState<string | null>(null);

  async function aufruf<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<T | null> {
    setLaedt(true);
    setFehler(null);
    setMeldung(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body !== undefined ? { "content-type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFehler(data.error ?? `Aktion fehlgeschlagen (Status ${res.status}).`);
        return null;
      }
      if (typeof data.hinweis === "string") setMeldung(data.hinweis);
      router.refresh();
      return data as T;
    } catch {
      setFehler("Keine Verbindung zum Server.");
      return null;
    } finally {
      setLaedt(false);
    }
  }

  const rueckmeldung = (
    <>
      {fehler && <div className="rounded-lg border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{fehler}</div>}
      {meldung && <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground" role="status">{meldung}</div>}
    </>
  );

  return { laedt, fehler, meldung, setMeldung, aufruf, rueckmeldung };
}

/** Feste Zeitzone, damit Server- und Browser-Ausgabe übereinstimmen (sonst Hydration-Fehler). */
const TZ = "Europe/Berlin";
export const datum = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("de-DE", { timeZone: TZ }) : "—");
export const datumZeit = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short", timeZone: TZ }) : "—";
export const tagInput = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ }) : "");
