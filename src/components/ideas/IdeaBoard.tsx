"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Loader2, Plus, Sparkles } from "lucide-react";
import type { ContentIdea } from "@prisma/client";
import { PLATFORM_LABELS } from "@/lib/format";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "text-danger",
  MEDIUM: "text-warning",
  LOW: "text-muted",
};

export function IdeaBoard({ ideas }: { ideas: ContentIdea[] }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualTitle, setManualTitle] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler bei der Ideengenerierung.");
      setTopic("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: manualTitle }),
    });
    setManualTitle("");
    setShowManual(false);
    router.refresh();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleGenerate} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="text-sm font-medium text-foreground">Thema für neue Ideen</span>
          <input
            className={`${inputClass} mt-1.5`}
            placeholder="z.B. Produktivität mit KI-Agenten"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={loading || topic.trim().length < 3}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Ideen generieren
        </button>
        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm text-foreground"
        >
          <Plus className="h-4 w-4" /> Manuell
        </button>
      </form>

      {showManual && (
        <form onSubmit={handleManualAdd} className="card flex gap-2 p-4">
          <input
            className={inputClass}
            placeholder="Idee-Titel"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
          />
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm text-white">
            Hinzufügen
          </button>
        </form>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ideas.length === 0 && (
          <div className="card col-span-full flex flex-col items-center gap-2 p-8 text-center text-muted">
            <Lightbulb className="h-6 w-6" />
            <p className="text-sm">Noch keine Ideen — generiere welche oder lege manuell an.</p>
          </div>
        )}
        {ideas.map((idea) => (
          <div key={idea.id} className="card flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium text-foreground">{idea.title}</h3>
              <span className={`shrink-0 text-[10px] font-semibold uppercase ${PRIORITY_COLORS[idea.priority]}`}>
                {idea.priority}
              </span>
            </div>
            {idea.hook && <p className="text-xs text-muted">„{idea.hook}“</p>}
            <div className="flex flex-wrap gap-1.5 text-[11px] text-muted">
              {idea.platform && (
                <span className="rounded-full border border-border px-2 py-0.5">
                  {PLATFORM_LABELS[idea.platform] ?? idea.platform}
                </span>
              )}
              {idea.format && (
                <span className="rounded-full border border-border px-2 py-0.5">{idea.format}</span>
              )}
              <span className="rounded-full border border-border px-2 py-0.5">
                ~{idea.estimatedMinutes} Min.
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <select
                value={idea.status}
                onChange={(e) => updateStatus(idea.id, e.target.value)}
                className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-foreground"
              >
                <option value="NEW">Neu</option>
                <option value="IN_PROGRESS">In Arbeit</option>
                <option value="USED">Verwendet</option>
                <option value="ARCHIVED">Archiviert</option>
              </select>
              <span className="text-[10px] text-muted">
                {idea.source === "IDEA_AGENT" ? "KI-generiert" : idea.source === "MANUAL" ? "Manuell" : idea.source}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
