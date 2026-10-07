"use client";

import { useState } from "react";

export function ShopBuyButton({ productId }: { productId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-4">
      <button
        disabled={busy}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await fetch(`/api/shop/${encodeURIComponent(productId)}/checkout`, { method: "POST" });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.url) window.location.assign(data.url);
          else {
            setError(data.error ?? "Nicht verfügbar.");
            setBusy(false);
          }
        }}
      >
        {busy ? "Weiter zur Zahlung…" : "Zahlungspflichtig kaufen"}
      </button>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
