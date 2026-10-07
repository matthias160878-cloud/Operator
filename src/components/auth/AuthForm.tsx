"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { safeInternalPath } from "@/lib/safeRedirect";

type Mode = "login" | "signup" | "setup";

const ENDPOINT: Record<Mode, string> = {
  login: "/api/auth/login",
  signup: "/api/auth/signup",
  setup: "/api/auth/setup-operator",
};

function safeNext(next: string | undefined, fallback: string): string {
  return safeInternalPath(next, window.location.origin, fallback);
}

export function AuthForm({ mode, next, plan }: { mode: Mode; next?: string; plan?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(form.entries());
    if (mode === "signup") body.acceptProcessing = form.get("acceptProcessing") === "on";
    try {
      const res = await fetch(ENDPOINT[mode], {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; isOperator?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Das hat nicht geklappt.");
        return;
      }
      const target =
        mode === "setup" || data.isOperator
          ? safeNext(next, "/operator")
          : plan
            ? `/billing?plan=${encodeURIComponent(plan)}`
            : safeNext(next, "/");
      window.location.assign(target);
    } catch {
      setError("Keine Verbindung zum Server.");
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-left" noValidate>
      {mode === "setup" && (
        <label className="block text-sm">
          <span className="text-muted">Einrichtungsschlüssel (OPERATOR_SETUP_TOKEN vom Server)</span>
          <input name="setupToken" type="password" required autoComplete="off" className={input} />
        </label>
      )}
      {mode !== "login" && (
        <label className="block text-sm">
          <span className="text-muted">Name</span>
          <input name="name" required autoComplete="name" className={input} />
        </label>
      )}
      {mode === "signup" && (
        <label className="block text-sm">
          <span className="text-muted">Name deines Arbeitsbereichs (z. B. Firmenname)</span>
          <input name="workspaceName" required className={input} />
        </label>
      )}
      <label className="block text-sm">
        <span className="text-muted">E-Mail-Adresse</span>
        <input name="email" type="email" required autoComplete="email" className={input} />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Passwort{mode !== "login" ? " (mindestens 12 Zeichen)" : ""}</span>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "login" ? 1 : 12}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className={input}
        />
      </label>
      {mode === "signup" && (
        <label className="flex items-start gap-2 text-xs text-muted">
          <input name="acceptProcessing" type="checkbox" required className="mt-0.5" />
          <span>
            Ich bin einverstanden, dass meine Eingaben zur Erbringung der KI-Funktionen an die vom Betreiber
            eingesetzten KI-Anbieter übermittelt werden. Meine Daten bleiben in meinem privaten Arbeitsbereich und
            sind für andere Kunden nicht sichtbar.
          </span>
        </label>
      )}
      {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Bitte warten…" : mode === "login" ? "Anmelden" : mode === "signup" ? "Konto anlegen" : "Betreiberkonto einrichten"}
      </button>
      {mode === "login" && (
        <p className="text-center text-xs text-muted">
          Noch kein Konto? <Link className="text-accent-2 underline" href="/signup">Registrieren</Link>
        </p>
      )}
      {mode === "signup" && (
        <p className="text-center text-xs text-muted">
          Schon registriert? <Link className="text-accent-2 underline" href="/login">Anmelden</Link>
        </p>
      )}
    </form>
  );
}
