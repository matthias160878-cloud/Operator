"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

/** Einzeiliger Wert (z. B. Redirect-URL) mit Kopierknopf. */
export function CopyValue({ value }: { value: string }) {
  const t = useTranslations("integrations.setup");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Zwischenablage nicht verfügbar (z. B. ohne HTTPS) — Text bleibt markierbar.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 overflow-x-auto rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-foreground">
        {value}
      </code>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-muted hover:text-foreground"
        aria-label={t("copy")}
      >
        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
        {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}
