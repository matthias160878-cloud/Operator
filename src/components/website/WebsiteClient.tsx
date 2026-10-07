"use client";

import { useState, type FormEvent } from "react";

interface Site {
  id: string;
  origin: string;
  verified: boolean;
  verifyToken: string;
  embed: string;
}

export function WebsiteClient({ sites }: { sites: Site[] }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(path: string, method: string, body?: unknown) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(path, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg(data.error ?? "Das hat nicht geklappt.");
      return res.ok ? data : null;
    } catch {
      setMsg("Keine Verbindung zum Server.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = new FormData(e.currentTarget).get("url");
    if (await call("/api/websites", "POST", { url, assistant: "CHAT" })) window.location.reload();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="card flex flex-wrap gap-2 p-5">
        <input
          name="url"
          required
          placeholder="https://meine-firma.de"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
        />
        <select aria-label="Assistent" className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm" defaultValue="CHAT">
          <option value="CHAT">Webseiten-Chat</option>
        </select>
        <button disabled={busy} className="rounded-lg bg-accent px-4 py-2 text-sm text-white disabled:opacity-40">
          Webseite hinzufügen
        </button>
      </form>
      {msg && <p className="text-sm text-foreground" role="status">{msg}</p>}
      {sites.map((s) => (
        <div key={s.id} className="card space-y-2 p-5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-foreground">{s.origin}</span>
            <span className="text-xs text-muted">{s.verified ? "Domain bestätigt" : "Domain noch nicht bestätigt"}</span>
          </div>
          {!s.verified && (
            <div>
              <div className="text-xs text-muted">Inhalt für {s.origin}/.well-known/secret58-verify.txt:</div>
              <code className="block break-all rounded bg-surface-2 p-2 text-xs">{s.verifyToken}</code>
            </div>
          )}
          <div>
            <div className="text-xs text-muted">Einbindungscode:</div>
            <code className="block break-all rounded bg-surface-2 p-2 text-xs">{s.embed}</code>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy}
              className="rounded-lg border border-border px-3 py-1.5 text-xs"
              onClick={() => navigator.clipboard?.writeText(s.embed).then(() => setMsg("Code kopiert."))}
            >
              Code kopieren
            </button>
            {!s.verified && (
              <button
                disabled={busy}
                className="rounded-lg border border-border px-3 py-1.5 text-xs"
                onClick={async () => {
                  if (await call(`/api/websites/${s.id}/verify`, "POST")) window.location.reload();
                }}
              >
                Domain prüfen
              </button>
            )}
            <button
              disabled={busy}
              className="rounded-lg border border-border px-3 py-1.5 text-xs"
              onClick={async () => {
                const d = await call(`/api/websites/${s.id}/test`, "POST");
                if (d)
                  setMsg(
                    `${s.origin}: Domain ${d.verified ? "bestätigt" : "nicht bestätigt"}, Einbindungscode ${d.embedFound ? "auf der Startseite gefunden" : "auf der Startseite nicht gefunden"}.`
                  );
              }}
            >
              Verbindung testen
            </button>
            <button
              disabled={busy}
              className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300"
              onClick={async () => {
                if (confirm("Einbindung widerrufen? Der Assistent hört sofort auf zu antworten.") && (await call(`/api/websites/${s.id}`, "DELETE")))
                  window.location.reload();
              }}
            >
              Widerrufen
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
