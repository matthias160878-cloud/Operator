"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface VerifyResponse {
  status?: "CONNECTED" | "NOT_CONFIGURED" | "ERROR";
  message?: string;
  liveCheck?: boolean;
  error?: string;
  retryAfter?: number;
}

export function VerifyButton({ integrationKey }: { integrationKey: string }) {
  const t = useTranslations("integrations.verify");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  async function verify() {
    setBusy(true);
    try {
      const res = await fetch(`/api/integrations/${encodeURIComponent(integrationKey)}/verify`, {
        method: "POST",
      });
      const data = (await res.json()) as VerifyResponse;
      if (res.status === 429) {
        setResult({ status: "ERROR", message: t("rateLimited", { seconds: data.retryAfter ?? 60 }) });
      } else if (!res.ok) {
        setResult({ status: "ERROR", message: t("failed") });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ status: "ERROR", message: t("failed") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={verify}
        disabled={busy}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground hover:border-accent-2",
          busy && "cursor-wait opacity-60"
        )}
      >
        <RefreshCw className={clsx("h-3 w-3", busy && "animate-spin")} />
        {busy ? t("checking") : t("button")}
      </button>
      {result?.status && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <StatusBadge status={result.status} />
          <span className={result.status === "ERROR" ? "text-danger" : "text-muted"}>{result.message}</span>
          {result.liveCheck === false && result.status === "CONNECTED" && (
            <span className="text-muted">({t("noLiveCheck")})</span>
          )}
        </div>
      )}
    </div>
  );
}
