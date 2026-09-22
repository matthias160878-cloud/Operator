"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Loader2 } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/format";

const PLATFORMS = Object.keys(PLATFORM_LABELS);
const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function CampaignForm({ textProvider }: { textProvider: string }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [goal, setGoal] = useState("Reichweite");
  const [language, setLanguage] = useState("Deutsch");
  const [itemsPerPlatform, setItemsPerPlatform] = useState(1);
  const [platforms, setPlatforms] = useState<string[]>(["YOUTUBE", "INSTAGRAM", "LINKEDIN"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ campaignId: string; contentItemIds: string[]; provider: string } | null>(null);

  function togglePlatform(p: string) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/content-brain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, targetAudience, goal, platforms, language, itemsPerPlatform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generierung fehlgeschlagen.");
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Brain className="h-4 w-4 text-accent-2" />
            Text-Engine:{" "}
            <span className="font-medium text-foreground">
              {textProvider === "template" ? "Template-Modus (kein KI-Provider konfiguriert)" : textProvider}
            </span>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Thema / Idee</span>
          <textarea
            className={`${inputClass} mt-1.5`}
            rows={2}
            placeholder="z.B. Erkläre, warum autonome KI-Agenten die Arbeitswelt verändern."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Zielgruppe</span>
            <input
              className={`${inputClass} mt-1.5`}
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="z.B. 25-45, Tech-Interessierte"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Ziel</span>
            <input
              className={`${inputClass} mt-1.5`}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Sprache</span>
            <input
              className={`${inputClass} mt-1.5`}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </label>
        </div>

        <div>
          <span className="text-sm font-medium text-foreground">Plattformen</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => togglePlatform(p)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  platforms.includes(p)
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-border bg-surface-2 text-muted"
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <label className="block max-w-xs">
          <span className="text-sm font-medium text-foreground">
            Content-Items je Plattform ({itemsPerPlatform})
          </span>
          <input
            type="range"
            min={1}
            max={5}
            value={itemsPerPlatform}
            onChange={(e) => setItemsPerPlatform(Number(e.target.value))}
            className="mt-1.5 w-full accent-[var(--accent)]"
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading || platforms.length === 0 || topic.trim().length < 3}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-3 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {loading ? "Content Brain arbeitet…" : "Content-Plan generieren"}
        </button>
      </form>

      {result && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-success">
            Kampagne erstellt — {result.contentItemIds.length} Content-Items als Entwurf angelegt.
          </h3>
          <p className="mt-1 text-xs text-muted">
            Generiert im {result.provider === "template" ? "Template-Modus" : result.provider}-Modus.
            Alle Inhalte starten als DRAFT — prüfe und bearbeite sie in der Content Factory.
          </p>
          <Link
            href="/content-factory"
            className="mt-3 inline-block rounded-lg border border-accent/40 px-3 py-1.5 text-xs text-accent-2 hover:bg-accent/10"
          >
            Zur Content Factory →
          </Link>
        </div>
      )}
    </div>
  );
}
