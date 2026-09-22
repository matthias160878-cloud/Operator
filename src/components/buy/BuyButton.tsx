"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Rocket } from "lucide-react";

export function BuyButton({ configured, priceDisplay }: { configured: boolean; priceDisplay: string }) {
  const t = useTranslations("buy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? t("checkoutFailed"));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={!configured || loading}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-accent-3 px-6 py-3 text-sm font-medium text-white shadow-[0_0_30px_rgba(109,91,255,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
        {loading ? t("redirecting") : t("buyButton")}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
      {!configured && (
        <p className="text-xs text-warning">{t("notConfigured", { price: priceDisplay })}</p>
      )}
    </div>
  );
}
