"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, RefreshCw } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/format";

interface SyncResult {
  platform: string;
  ok: boolean;
  newConversations: number;
  newMessages: number;
  notes: string[];
}

export function SyncInboxButton() {
  const t = useTranslations("inbox");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sync() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/conversations/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("sync.failed"));
        return;
      }
      setResults(data.results);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={sync}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {t("sync.button")}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
      {results && (
        <div className="max-w-md space-y-1 text-xs text-muted">
          {results.length === 0 && <p>{t("sync.noAccounts")}</p>}
          {results.map((r) => (
            <div key={r.platform}>
              <p className="text-foreground">
                {t("sync.result", {
                  platform: PLATFORM_LABELS[r.platform] ?? r.platform,
                  conversations: r.newConversations,
                  messages: r.newMessages,
                })}
              </p>
              {r.notes.map((note, i) => (
                <p key={i} className={r.ok ? "" : "text-warning"}>
                  {note}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
