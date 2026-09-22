"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Save, Sparkles } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/format";
import type { HookVariant } from "@/lib/agents/hookAgent";
import type { ScriptStructure } from "@/lib/agents/scriptAgent";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

const HOOK_TYPE_LABELS: Record<string, string> = {
  direkt: "Direkt",
  neugierig: "Neugierig",
  story: "Story",
  problem: "Problem",
  zahlen: "Zahlen",
  "kontrovers-sachlich": "Kontrovers (sachlich)",
  educational: "Educational",
};

export function ScriptStudio() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("YOUTUBE");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hooks, setHooks] = useState<HookVariant[]>([]);
  const [script, setScript] = useState<ScriptStructure | null>(null);
  const [selectedHook, setSelectedHook] = useState<string>("");
  const [provider, setProvider] = useState<string>("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/script-studio/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generierung fehlgeschlagen.");
      setHooks(data.hooks);
      setScript(data.script);
      setSelectedHook(data.hooks[0]?.text ?? "");
      setProvider(data.provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAsContentItem() {
    if (!script) return;
    setSaving(true);
    try {
      const res = await fetch("/api/content-items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: topic,
          platform,
          hook: selectedHook,
          script: [
            `HOOK: ${selectedHook || script.hook}`,
            `PROBLEM: ${script.problem}`,
            `VALUE: ${script.value}`,
            `EXAMPLE: ${script.example}`,
            `PAYOFF: ${script.payoff}`,
            `CTA: ${script.cta}`,
          ].join("\n\n"),
        }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/content-factory/${data.item.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleGenerate} className="card space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Thema</span>
            <input
              className={`${inputClass} mt-1.5`}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. 5 Wege, wie KI-Agenten Zeit sparen"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Plattform</span>
            <select
              className={`${inputClass} mt-1.5`}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading || topic.trim().length < 3}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-3 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Script & Hooks generieren
        </button>
      </form>

      {hooks.length > 0 && (
        <div className="card space-y-3 p-5">
          <h3 className="text-sm font-semibold text-foreground">Hook-Varianten</h3>
          <p className="text-xs text-muted">
            Engine: {provider === "template" ? "Template-Modus (kein KI-Provider konfiguriert)" : provider}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {hooks.map((h) => (
              <button
                type="button"
                key={h.type}
                onClick={() => setSelectedHook(h.text)}
                className={`rounded-lg border p-3 text-left text-sm ${
                  selectedHook === h.text
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-surface-2 text-muted hover:text-foreground"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wide text-accent-2">
                  {HOOK_TYPE_LABELS[h.type] ?? h.type}
                </div>
                <div className="mt-1">{h.text}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {script && (
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4" /> Script
            </h3>
            <button
              onClick={saveAsContentItem}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" /> {saving ? "Speichert…" : "Als Content-Item speichern"}
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {(
              [
                ["HOOK", selectedHook || script.hook],
                ["PROBLEM", script.problem],
                ["VALUE", script.value],
                ["EXAMPLE", script.example],
                ["PAYOFF", script.payoff],
                ["CTA", script.cta],
              ] as const
            ).map(([label, text]) => (
              <div key={label} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-accent-2">{label}</div>
                <div className="mt-1 text-foreground">{text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
