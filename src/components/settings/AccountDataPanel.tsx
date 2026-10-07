"use client";

import { useState, type FormEvent } from "react";

export function AccountDataPanel() {
  const [msg, setMsg] = useState<string | null>(null);

  async function onDelete(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: f.get("password"), confirm: f.get("confirm") }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) window.location.assign("/login");
    else setMsg(data.error ?? "Löschen fehlgeschlagen.");
  }

  return (
    <div className="card space-y-3 p-5">
      <h2 className="text-sm font-semibold text-foreground">Meine Daten</h2>
      <a href="/api/account/export" className="inline-block rounded-lg border border-border px-3 py-1.5 text-sm text-foreground">
        Alle Daten exportieren (JSON)
      </a>
      <form onSubmit={onDelete} className="space-y-2 border-t border-border pt-3">
        <p className="text-xs text-muted">
          Arbeitsbereich endgültig löschen: alle Inhalte, Dateien, Webseiten-Einbindungen und Verkäufe in SECRET 58.
          Laufende Abos vorher beenden. Daten beim Zahlungsanbieter Stripe unterliegen dessen Aufbewahrungspflichten.
        </p>
        <input name="password" type="password" required placeholder="Passwort" autoComplete="current-password" className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm" />
        <input name="confirm" required placeholder="Zur Bestätigung LÖSCHEN eintippen" className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm" />
        <button className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-300">Arbeitsbereich löschen</button>
        {msg && <p className="text-sm text-red-300">{msg}</p>}
      </form>
    </div>
  );
}
