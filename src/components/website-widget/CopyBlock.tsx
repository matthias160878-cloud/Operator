"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy } from "lucide-react";

export function CopyBlock({ code }: { code: string }) {
  const t = useTranslations("websiteWidget");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Zwischenablage nicht verfügbar (z. B. ohne HTTPS) — Text bleibt markierbar.
    }
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border border-border bg-surface-2 p-3 pr-20 text-xs text-foreground">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-muted hover:text-foreground"
      >
        <Copy className="h-3 w-3" /> {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}
