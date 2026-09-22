"use client";

import { useState } from "react";
import { Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import type { ThumbnailConcept } from "@/lib/agents/thumbnailAgent";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function ThumbnailGenerator() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [concept, setConcept] = useState<ThumbnailConcept | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/thumbnails/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generierung fehlgeschlagen.");
      setConcept(data.concept);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ImageIcon className="h-4 w-4" /> Thumbnail-Agent
      </h3>
      <p className="text-xs text-muted">
        Erzeugt ein Text-Konzept (Titel, visuelle Idee, Layout, CTA) — vorbereitet für die
        Anbindung eines Bildgenerators. Es wird noch kein Bild erzeugt.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          className={inputClass}
          placeholder="Thema für das Thumbnail"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading || topic.trim().length < 3}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Konzept generieren
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}
      {concept && (
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          {Object.entries({
            Titel: concept.title,
            "Visuelle Idee": concept.visualIdea,
            Text: concept.text,
            Layout: concept.layout,
            CTA: concept.cta,
            Bildbeschreibung: concept.imageDescription,
          }).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-surface-2 p-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-accent-2">{label}</dt>
              <dd className="mt-1 text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
