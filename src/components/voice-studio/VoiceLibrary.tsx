"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Mic, Play, Plus, Trash2 } from "lucide-react";
import type { Voice } from "@prisma/client";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function VoiceLibrary({
  voices,
  elevenLabsConfigured,
}: {
  voices: Voice[];
  elevenLabsConfigured: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [providerVoiceId, setProviderVoiceId] = useState("");
  const [language, setLanguage] = useState("de");
  const [importing, setImporting] = useState(false);
  const [previewText, setPreviewText] = useState("Hallo, das ist ein Beispiel für dieses Voice.");
  const [previewVoiceId, setPreviewVoiceId] = useState(voices[0]?.providerVoiceId ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addVoice(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/voices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, providerVoiceId, language }),
    });
    setName("");
    setProviderVoiceId("");
    setShowForm(false);
    router.refresh();
  }

  async function toggleActive(voice: Voice) {
    await fetch(`/api/voices/${voice.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !voice.active }),
    });
    router.refresh();
  }

  async function removeVoice(id: string) {
    if (!confirm("Voice wirklich löschen?")) return;
    await fetch(`/api/voices/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function importFromElevenLabs() {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/voices/import", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import fehlgeschlagen.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setImporting(false);
    }
  }

  async function playPreview() {
    setPreviewLoading(true);
    setError(null);
    setPreviewUrl(null);
    try {
      const res = await fetch("/api/voices/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: previewText, voiceId: previewVoiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview fehlgeschlagen.");
      setPreviewUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {!elevenLabsConfigured && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          ElevenLabs ist noch nicht konfiguriert. Trage <code>ELEVENLABS_API_KEY</code> in{" "}
          <code>.env</code> ein, um Voiceover und Voice-Import zu nutzen. Die Voice Library
          kann trotzdem für die Planung genutzt werden.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm text-foreground"
        >
          <Plus className="h-4 w-4" /> Voice manuell anlegen
        </button>
        <button
          onClick={importFromElevenLabs}
          disabled={!elevenLabsConfigured || importing}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Von ElevenLabs importieren
        </button>
      </div>

      {showForm && (
        <form onSubmit={addVoice} className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
          <input className={inputClass} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input
            className={inputClass}
            placeholder="Voice ID (ElevenLabs)"
            value={providerVoiceId}
            onChange={(e) => setProviderVoiceId(e.target.value)}
            required
          />
          <input className={inputClass} placeholder="Sprache" value={language} onChange={(e) => setLanguage(e.target.value)} />
          <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm text-white">
            Hinzufügen
          </button>
        </form>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {voices.length === 0 && (
          <div className="card col-span-full flex flex-col items-center gap-2 p-8 text-center text-muted">
            <Mic className="h-6 w-6" />
            <p className="text-sm">Noch keine Voices in der Library.</p>
          </div>
        )}
        {voices.map((voice) => (
          <div key={voice.id} className="card space-y-2 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{voice.name}</h3>
              <button
                onClick={() => toggleActive(voice)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  voice.active ? "bg-success/15 text-success" : "bg-muted/15 text-muted"
                }`}
              >
                {voice.active ? "Aktiv" : "Inaktiv"}
              </button>
            </div>
            <p className="text-xs text-muted">
              {voice.language} · {voice.style || "—"}
            </p>
            <p className="truncate text-[11px] text-muted">ID: {voice.providerVoiceId}</p>
            <button
              onClick={() => removeVoice(voice.id)}
              className="inline-flex items-center gap-1.5 text-xs text-danger hover:underline"
            >
              <Trash2 className="h-3 w-3" /> Entfernen
            </button>
          </div>
        ))}
      </div>

      <div className="card space-y-3 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Play className="h-4 w-4" /> Voice Preview
        </h3>
        <textarea
          className={inputClass}
          rows={2}
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          maxLength={500}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={`${inputClass} w-auto`}
            value={previewVoiceId}
            onChange={(e) => setPreviewVoiceId(e.target.value)}
          >
            <option value="">Voice wählen…</option>
            {voices.map((v) => (
              <option key={v.id} value={v.providerVoiceId}>
                {v.name}
              </option>
            ))}
          </select>
          <button
            onClick={playPreview}
            disabled={!elevenLabsConfigured || !previewVoiceId || previewLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Preview abspielen
          </button>
        </div>
        {previewUrl && <audio controls src={previewUrl} className="w-full" />}
      </div>
    </div>
  );
}
