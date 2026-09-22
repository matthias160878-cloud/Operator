"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export function DisconnectButton({ accountId }: { accountId: string }) {
  const t = useTranslations("socialMedia");
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function disconnect() {
    if (!confirm(t("disconnectConfirm"))) return;
    setBusy(true);
    try {
      await fetch(`/api/platform-accounts/${accountId}/disconnect`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={disconnect}
      disabled={busy}
      className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted hover:text-danger disabled:opacity-60"
    >
      {busy ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : t("disconnectButton")}
    </button>
  );
}
