"use client";

import { useEffect, useState } from "react";

interface Status {
  pilot: { available: boolean; missing?: string[] };
  publicChat: { available: boolean; reasons: string[] };
}
type Msg = { role: "user" | "assistant"; content: string };

export function HermesPilot() {
  const [status, setStatus] = useState<Status | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/operator/hermes-pilot").then((r) => r.json()).then(setStatus).catch(() => setError("Status nicht lesbar."));
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next); setInput(""); setBusy(true); setError("");
    try {
      const r = await fetch("/api/operator/hermes-pilot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Fehler");
      setMessages([...next, { role: "assistant", content: d.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-2 p-4 text-sm">
        <div className="font-semibold text-foreground">Stand</div>
        {!status ? <p className="text-muted">Wird geladen …</p> : (
          <ul className="space-y-1 text-muted">
            <li>
              Interner Pilot: {status.pilot.available ? <span className="text-success">eingerichtet</span> : <span>nicht verfügbar — fehlt: {status.pilot.missing?.join(", ")}</span>}
            </li>
            <li>
              Öffentlicher Besucherchat: {status.publicChat.available ? <span className="text-success">verfügbar</span> : <span>aus — {status.publicChat.reasons.join("; ") || "nicht eingerichtet"}</span>}
            </li>
          </ul>
        )}
        <p className="text-xs text-muted">
          Der Pilot schickt nur, was Sie hier tippen. Es werden keine Kundendaten mitgesendet, und nichts wird veröffentlicht oder versendet.
          Der Hermes-Server kann eigene Werkzeuge haben — das ist Ihr Server.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <div className="max-h-96 space-y-2 overflow-y-auto text-sm" aria-live="polite">
          {messages.length === 0 && <p className="text-muted">Noch keine Nachricht.</p>}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-foreground" : "text-accent-2"}>
              <span className="mr-2 text-xs uppercase text-muted">{m.role === "user" ? "Sie" : "Hermes"}</span>
              <span className="whitespace-pre-wrap">{m.content}</span>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <form onSubmit={send} className="flex gap-2">
          <input
            value={input} onChange={(e) => setInput(e.target.value)} maxLength={4000} disabled={!status?.pilot.available || busy}
            placeholder={status?.pilot.available ? "Nachricht an Hermes" : "Hermes-Pilot ist nicht verfügbar"}
            aria-label="Nachricht an Hermes"
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground disabled:opacity-60"
          />
          <button type="submit" disabled={!status?.pilot.available || busy || !input.trim()} className="rounded-lg bg-accent px-4 py-2 text-sm text-white disabled:opacity-50">
            {busy ? "…" : "Senden"}
          </button>
        </form>
      </div>
    </div>
  );
}
