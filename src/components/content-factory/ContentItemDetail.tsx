"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Mic,
  RefreshCw,
  Save,
  Send,
  Subtitles,
  Video,
  XCircle,
} from "lucide-react";
import type { ContentItem, MediaAsset, Script } from "@prisma/client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PLATFORM_LABELS } from "@/lib/format";

type ItemWithRelations = ContentItem & { scripts: Script[]; mediaAssets: MediaAsset[] };

const inputClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

function parseArr(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function ContentItemDetail({ item }: { item: ItemWithRelations }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [hook, setHook] = useState(item.hook);
  const [script, setScript] = useState(item.script);
  const [caption, setCaption] = useState(item.caption);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [repurposeTargets, setRepurposeTargets] = useState<string[]>([]);

  async function save() {
    setSaving(true);
    await fetch(`/api/content-items/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, hook, script, caption }),
    });
    setSaving(false);
    router.refresh();
  }

  async function runAction(action: string, fn: () => Promise<Response>) {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Aktion fehlgeschlagen.");
      } else if (data.message) {
        setMessage(data.message);
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const hashtags = parseArr(item.hashtags);
  const keywords = parseArr(item.keywords);
  const audio = item.mediaAssets.find((a) => a.type === "AUDIO");
  const subtitle = item.mediaAssets.find((a) => a.type === "SUBTITLE");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />
          <span className="text-xs text-muted">{PLATFORM_LABELS[item.platform] ?? item.platform}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => runAction("review", () => fetch(`/api/content-items/${item.id}/status`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "review" }) }))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground"
          >
            <Clock className="h-3.5 w-3.5" /> Zur Prüfung
          </button>
          <button
            onClick={() => runAction("approve", () => fetch(`/api/content-items/${item.id}/status`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "approve" }) }))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 text-xs text-success"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Freigeben
          </button>
          <button
            onClick={() => {
              const reason = prompt("Ablehnungsgrund (optional):") ?? "";
              runAction("reject", () => fetch(`/api/content-items/${item.id}/status`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "reject", reason }) }));
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs text-danger"
          >
            <XCircle className="h-3.5 w-3.5" /> Ablehnen
          </button>
          <button
            onClick={() => {
              const when = prompt("Veröffentlichungsdatum (YYYY-MM-DDTHH:mm):", new Date().toISOString().slice(0, 16));
              if (!when) return;
              runAction("schedule", () => fetch(`/api/content-items/${item.id}/status`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "schedule", scheduledAt: when }) }));
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs text-accent"
          >
            <Send className="h-3.5 w-3.5" /> Einplanen
          </button>
          <button
            onClick={() => runAction("publish", () => fetch(`/api/content-items/${item.id}/status`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "publish" }) }))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
          >
            {busy === "publish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Veröffentlichen
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          {message}
        </div>
      )}

      <div className="card space-y-3 p-5">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Titel</span>
          <input className={`${inputClass} mt-1.5`} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Hook</span>
          <input className={`${inputClass} mt-1.5`} value={hook} onChange={(e) => setHook(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Script</span>
          <textarea
            className={`${inputClass} mt-1.5 font-mono`}
            rows={10}
            value={script}
            onChange={(e) => setScript(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Caption</span>
          <textarea className={`${inputClass} mt-1.5`} rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} />
        </label>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Speichert…" : "Speichern"}
        </button>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Hashtags & Keywords</h3>
          <button
            onClick={() => runAction("hashtags", () => fetch(`/api/content-items/${item.id}/hashtags`, { method: "POST" }))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-foreground"
          >
            {busy === "hashtags" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Neu generieren
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {hashtags.map((h) => (
            <span key={h} className="rounded-full border border-border px-2 py-0.5 text-xs text-accent-2">
              {h}
            </span>
          ))}
          {keywords.map((k) => (
            <span key={k} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {k}
            </span>
          ))}
          {hashtags.length === 0 && keywords.length === 0 && (
            <span className="text-xs text-muted">Noch keine Hashtags generiert.</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mic className="h-4 w-4" /> Voiceover
            </h3>
            <button
              onClick={() => runAction("voiceover", () => fetch(`/api/content-items/${item.id}/voiceover`, { method: "POST" }))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-foreground"
            >
              {busy === "voiceover" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Erzeugen"}
            </button>
          </div>
          {audio ? (
            <audio controls src={audio.url} className="w-full" />
          ) : (
            <p className="text-xs text-muted">Noch kein Voiceover erzeugt.</p>
          )}
        </div>

        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Subtitles className="h-4 w-4" /> Untertitel
            </h3>
            <button
              onClick={() => runAction("subtitles", () => fetch(`/api/content-items/${item.id}/subtitles`, { method: "POST" }))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-foreground"
            >
              {busy === "subtitles" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Erzeugen (SRT)"}
            </button>
          </div>
          {subtitle ? (
            <a href={subtitle.url} download className="text-xs text-accent-2 hover:underline">
              {subtitle.url.split("/").pop()} herunterladen
            </a>
          ) : (
            <p className="text-xs text-muted">Noch keine Untertitel erzeugt.</p>
          )}
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Video className="h-4 w-4" /> Video-Rendering
          </h3>
          <button
            onClick={() => runAction("video", () => fetch(`/api/content-items/${item.id}/video`, { method: "POST" }))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-foreground"
          >
            {busy === "video" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Rendern anfragen"}
          </button>
        </div>
        <p className="text-xs text-muted">
          Provider-agnostische Video-Pipeline (Abschnitt 11/12) — aktuell ist kein
          Video-Provider konfiguriert (siehe Integrationen).
        </p>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4" /> Script-Varianten
          </h3>
          <button
            onClick={() => runAction("script", () => fetch(`/api/content-items/${item.id}/script`, { method: "POST" }))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-foreground"
          >
            {busy === "script" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Neue Variante"}
          </button>
        </div>
        <div className="space-y-2">
          {item.scripts.length === 0 && <p className="text-xs text-muted">Noch keine Varianten.</p>}
          {item.scripts.map((s) => (
            <details key={s.id} className="rounded-lg border border-border bg-surface-2 p-3">
              <summary className="cursor-pointer text-sm text-foreground">Variante {s.variantLabel}</summary>
              <div className="mt-2 space-y-1 text-xs text-muted">
                <p><span className="text-foreground">Hook:</span> {s.hook}</p>
                <p><span className="text-foreground">Problem:</span> {s.problem}</p>
                <p><span className="text-foreground">Value:</span> {s.value}</p>
                <p><span className="text-foreground">Example:</span> {s.example}</p>
                <p><span className="text-foreground">Payoff:</span> {s.payoff}</p>
                <p><span className="text-foreground">CTA:</span> {s.cta}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <h3 className="text-sm font-semibold text-foreground">Repurpose Content</h3>
        <p className="text-xs text-muted">
          Erzeuge aus diesem Content-Item plattformgerechte Ableger für weitere Kanäle.
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PLATFORM_LABELS)
            .filter(([key]) => key !== item.platform)
            .map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setRepurposeTargets((prev) =>
                    prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
                  )
                }
                className={`rounded-full border px-3 py-1 text-xs ${
                  repurposeTargets.includes(key)
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-border bg-surface-2 text-muted"
                }`}
              >
                {label}
              </button>
            ))}
        </div>
        <button
          disabled={repurposeTargets.length === 0 || busy === "repurpose"}
          onClick={() =>
            runAction("repurpose", () =>
              fetch(`/api/content-items/${item.id}/repurpose`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ targets: repurposeTargets }),
              })
            )
          }
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy === "repurpose" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {repurposeTargets.length} Ableger erzeugen
        </button>
      </div>
    </div>
  );
}
