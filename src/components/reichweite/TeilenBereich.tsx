"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { teilenZiele } from "@/lib/reichweite/teilen";

/**
 * Freiwilliges Teilen: Web Share API (Systemdialog), „Link kopieren“ und
 * offizielle Teilen-Adressen der Plattformen. Die Person wählt Empfänger
 * selbst. Nichts davon wird gezählt — die App erfährt nicht, ob tatsächlich
 * geteilt wurde.
 */
export function TeilenBereich({ url, titel, texte }: { url: string; titel: string; texte: string[] }) {
  const [text, setText] = useState(texte[0] ?? "");
  const [kopiert, setKopiert] = useState(false);
  const [hinweis, setHinweis] = useState<string | null>(null);
  // Erst im Browser prüfen (Server: false), sonst weicht die Server-Ausgabe ab.
  const kannTeilen = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false
  );

  async function systemTeilen() {
    setHinweis(null);
    try {
      await navigator.share({ title: titel, text, url });
    } catch {
      // Abbruch durch die Person oder nicht verfügbar – bewusst ohne Zählung.
    }
  }

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(text ? `${text} ${url}` : url);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
    } catch {
      setHinweis("Kopieren nicht möglich – bitte den Link oben markieren und kopieren.");
    }
  }

  return (
    <div className="space-y-3" data-testid="teilen-bereich">
      <div>
        <label className="text-xs text-muted" htmlFor="teilen-link">Link</label>
        <input
          id="teilen-link"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
        />
      </div>
      {texte.length > 0 && (
        <div>
          <label className="text-xs text-muted" htmlFor="teilen-text">Begleittext (frei änderbar)</label>
          <select
            className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
            onChange={(e) => setText(e.target.value)}
            value={texte.includes(text) ? text : ""}
            aria-label="Textvorschlag wählen"
          >
            {texte.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
            <option value="">Ohne Vorschlag</option>
          </select>
          <textarea
            id="teilen-text"
            value={text}
            maxLength={400}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {kannTeilen && (
          <button type="button" onClick={systemTeilen} className="inline-flex font-medium text-white bg-accent min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm">
            <Share2 className="h-4 w-4" /> Teilen …
          </button>
        )}
        <button
          type="button"
          onClick={kopieren}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground"
        >
          {kopiert ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {kopiert ? "Kopiert" : "Link kopieren"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {teilenZiele(url, text).map((z) => (
          <a
            key={z.key}
            href={z.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 py-2 text-xs text-foreground hover:border-accent"
          >
            {z.label}
          </a>
        ))}
      </div>
      {hinweis && <p className="text-xs text-warning">{hinweis}</p>}
      <p className="text-[11px] text-muted">
        Du entscheidest selbst, ob und mit wem du teilst. Das Öffnen eines Teilen-Fensters wird nicht gezählt, und es werden keine Kontakte ausgelesen.
      </p>
    </div>
  );
}
