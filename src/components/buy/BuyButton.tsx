"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Rocket } from "lucide-react";

export function BuyButton({
  configured,
  priceDisplay,
  setupServiceAvailable,
  setupServicePrice,
}: {
  configured: boolean;
  priceDisplay: string;
  setupServiceAvailable: boolean;
  setupServicePrice: string;
}) {
  const t = useTranslations("buy");
  const [includeSetupService, setIncludeSetupService] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeSetupService: setupServiceAvailable && includeSetupService }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? t("checkoutFailed"));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor="setup-service"
        className={`mx-auto flex max-w-sm items-start gap-3 rounded-lg border border-border bg-surface-2 p-3 text-left text-sm ${
          setupServiceAvailable ? "cursor-pointer" : "opacity-60"
        }`}
      >
        <input
          id="setup-service"
          type="checkbox"
          checked={setupServiceAvailable && includeSetupService}
          onChange={(e) => setIncludeSetupService(e.target.checked)}
          disabled={!setupServiceAvailable || loading}
          className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
        />
        <span>
          <span className="font-medium text-foreground">
            {t("setupServiceTitle", { price: setupServicePrice })}
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            {setupServiceAvailable ? t("setupServiceDescription") : t("setupServiceUnavailable")}
          </span>
        </span>
      </label>
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
