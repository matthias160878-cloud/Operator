"use client";

import { useState } from "react";
import { Loader2, Rocket } from "lucide-react";
import { PACKAGE_PRICE_DISPLAY } from "@/lib/pricing";

export function BuyButton({ configured }: { configured: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout fehlgeschlagen.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
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
        {loading ? "Weiterleitung zu Stripe …" : "Jetzt kaufen"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
      {!configured && (
        <p className="text-xs text-warning">
          Zahlung ist noch nicht konfiguriert — der Betreiber muss zuerst in Stripe ein Produkt
          zu {PACKAGE_PRICE_DISPLAY} anlegen und STRIPE_SECRET_KEY / STRIPE_PRICE_ID hinterlegen.
        </p>
      )}
    </div>
  );
}
