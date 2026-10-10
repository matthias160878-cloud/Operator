"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface AppointmentRow {
  id: string;
  datum: string;
  uhrzeit: string;
  notiz: string;
  status: string;
  kundeName: string | null;
  kundeEmail: string | null;
  kundeNachricht: string;
}

const STATUS_TEXT: Record<string, string> = { FREI: "frei", ANGEFRAGT: "angefragt", BESTAETIGT: "bestätigt" };
const STATUS_TONE: Record<string, string> = {
  FREI: "border-border text-muted",
  ANGEFRAGT: "border-warning/40 bg-warning/10 text-warning",
  BESTAETIGT: "border-success/40 bg-success/10 text-success",
};
const input = "min-h-11 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground";
const smallBtn = "min-h-9 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground disabled:opacity-40";

/** Terminfenster für Erstgespräche auf der Startseite: anlegen, Anfragen bestätigen, freigeben, löschen. */
export function AppointmentsPanel({ rows }: { rows: AppointmentRow[] }) {
  const router = useRouter();
  const [datum, setDatum] = useState("");
  const [uhrzeit, setUhrzeit] = useState("10:00");
  const [notiz, setNotiz] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function post(path: string, body: unknown) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMessage(data.error ?? "Das hat nicht geklappt.");
      router.refresh();
      return res.ok;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Termine für Erstgespräche (Startseite)</h2>
        <p className="text-xs text-muted">
          Freie Termine erscheinen auf der Startseite unter „Termin anfragen“. Anfragen kommen zusätzlich in deinen
          Posteingang. Bestätigungen schickst du selbst per E-Mail; die App versendet keine E-Mails.
        </p>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await post("/api/operator/termine", { datum, uhrzeit, notiz })) setNotiz("");
        }}
      >
        <label className="flex flex-col gap-1 text-xs text-muted">
          Datum
          <input id="termin-datum" type="date" required value={datum} onChange={(e) => setDatum(e.target.value)} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Uhrzeit
          <input id="termin-uhrzeit" type="time" required value={uhrzeit} onChange={(e) => setUhrzeit(e.target.value)} className={input} />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted">
          Notiz (nur für dich)
          <input id="termin-notiz" maxLength={300} value={notiz} onChange={(e) => setNotiz(e.target.value)} className={input} />
        </label>
        <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          Termin anlegen
        </button>
      </form>
      {message && <p role="alert" className="text-xs text-danger">{message}</p>}
      <ul className="divide-y divide-border text-sm">
        {rows.length === 0 && <li className="py-2 text-muted">Noch keine Termine angelegt.</li>}
        {rows.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div className="min-w-0">
              <span className="font-medium text-foreground">
                {t.datum.split("-").reverse().join(".")} · {t.uhrzeit} Uhr
              </span>{" "}
              <span className={`ml-1 rounded-full border px-2 py-0.5 text-xs ${STATUS_TONE[t.status] ?? STATUS_TONE.FREI}`}>
                {STATUS_TEXT[t.status] ?? t.status}
              </span>
              {t.kundeName && (
                <div className="text-xs text-muted">
                  {t.kundeName} · {t.kundeEmail}
                  {t.kundeNachricht ? ` · „${t.kundeNachricht}“` : ""}
                </div>
              )}
              {t.notiz && <div className="text-xs text-muted">Notiz: {t.notiz}</div>}
            </div>
            <div className="flex flex-wrap gap-2">
              {t.status === "ANGEFRAGT" && (
                <button type="button" disabled={busy} className={smallBtn} onClick={() => post(`/api/operator/termine/${t.id}`, { action: "bestaetigen" })}>
                  Bestätigen
                </button>
              )}
              {t.status !== "FREI" && (
                <button type="button" disabled={busy} className={smallBtn} onClick={() => post(`/api/operator/termine/${t.id}`, { action: "freigeben" })}>
                  Wieder freigeben
                </button>
              )}
              <button type="button" disabled={busy} className={`${smallBtn} hover:text-danger`} onClick={() => post(`/api/operator/termine/${t.id}`, { action: "loeschen" })}>
                Löschen
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
