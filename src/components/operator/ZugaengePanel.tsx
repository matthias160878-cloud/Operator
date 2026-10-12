"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import type { SettingGroup, SettingStatus } from "@/lib/operatorSettings";
import { SETTING_GROUPS } from "@/lib/operatorSettings";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

const GROUP_ORDER: SettingGroup[] = ["composio", "ki", "email", "zahlung"];
const PRUEFBAR: Partial<Record<SettingGroup, "composio" | "email" | "zahlung">> = { composio: "composio", email: "email", zahlung: "zahlung" };

function sourceText(s: SettingStatus): string {
  if (s.source === "server") return "in der Server-Umgebung gesetzt";
  if (s.source === "app") return `in der App gespeichert${s.updatedAt ? ` (${new Date(s.updatedAt).toLocaleString("de-DE")})` : ""}`;
  return "fehlt";
}

export function ZugaengePanel({ initial, speicherbar }: { initial: SettingStatus[]; speicherbar: boolean }) {
  const [rows, setRows] = useState(initial);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [checks, setChecks] = useState<Record<string, { ok: boolean; text: string }>>({});

  async function refresh() {
    const res = await fetch("/api/operator/zugaenge", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { zugaenge: SettingStatus[] };
      setRows(data.zugaenge);
    }
  }

  async function save(key: string, value: string) {
    setBusy(key);
    try {
      const res = await fetch("/api/operator/zugaenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; source?: string };
      if (!res.ok) {
        setNotes((n) => ({ ...n, [key]: { ok: false, text: data.error ?? "Speichern fehlgeschlagen." } }));
      } else {
        setNotes((n) => ({ ...n, [key]: { ok: true, text: value ? "Gespeichert und sofort wirksam." : "Entfernt." } }));
        setDrafts((d) => ({ ...d, [key]: "" }));
        await refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function check(bereich: "composio" | "email" | "zahlung") {
    setBusy(`check:${bereich}`);
    try {
      const res = await fetch("/api/operator/zugaenge/pruefen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bereich }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; text?: string; error?: string };
      setChecks((c) => ({ ...c, [bereich]: { ok: Boolean(data.ok), text: data.text ?? data.error ?? "Prüfung fehlgeschlagen." } }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {GROUP_ORDER.map((group) => {
        const items = rows.filter((r) => r.group === group);
        const pruef = PRUEFBAR[group];
        const check_ = pruef ? checks[pruef] : undefined;
        return (
          <section key={group} className="card space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{SETTING_GROUPS[group].title}</h2>
                <p className="mt-1 text-xs text-muted">{SETTING_GROUPS[group].text}</p>
              </div>
              {pruef && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => check(pruef)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground disabled:opacity-40"
                >
                  {busy === `check:${pruef}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  Verbindung prüfen
                </button>
              )}
            </div>
            {check_ && (
              <div className={`rounded-lg border px-3 py-2 text-xs ${check_.ok ? "border-success/40 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`}>
                {check_.text}
              </div>
            )}
            <ul className="space-y-4">
              {items.map((s) => {
                const locked = s.source === "server" || !speicherbar;
                const draft = drafts[s.key] ?? "";
                const note = notes[s.key];
                return (
                  <li key={s.key} className="rounded-lg border border-border bg-surface-2/40 p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <label htmlFor={`z-${s.key}`} className="text-sm font-medium text-foreground">
                        {s.label}
                      </label>
                      <span className={`inline-flex items-center gap-1 text-xs ${s.source === "fehlt" ? "text-warning" : "text-success"}`}>
                        {s.source !== "fehlt" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {sourceText(s)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted">
                      <code className="text-[11px]">{s.key}</code> · {s.hint}
                      {s.value !== null && (
                        <>
                          {" "}
                          · aktuell: <code className="text-[11px] text-foreground">{s.value}</code>
                        </>
                      )}
                    </div>
                    {!locked && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          id={`z-${s.key}`}
                          type={s.secret ? "password" : "text"}
                          autoComplete="off"
                          spellCheck={false}
                          className={`${inputClass} min-h-11 flex-1 min-w-[12rem]`}
                          placeholder={s.secret ? "Neuen Wert einfügen" : s.hint}
                          value={draft}
                          onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
                        />
                        <button
                          type="button"
                          disabled={busy !== null || !draft.trim()}
                          onClick={() => save(s.key, draft)}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                        >
                          {busy === s.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          Speichern
                        </button>
                        {s.source === "app" && (
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => {
                              if (confirm(`${s.label} aus der App entfernen?`)) void save(s.key, "");
                            }}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs text-danger disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Entfernen
                          </button>
                        )}
                      </div>
                    )}
                    {note && (
                      <div className={`mt-2 text-xs ${note.ok ? "text-success" : "text-danger"}`}>{note.text}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
