"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Schalter „als bearbeitet markieren“ für eine Kündigung (nur Betreiber). */
export function KuendigungBearbeitet({ id, bearbeitet }: { id: string; bearbeitet: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");
  async function umschalten() {
    setBusy(true);
    setFehler("");
    const res = await fetch("/api/operator/kuendigungen", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, bearbeitet: !bearbeitet }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return setFehler("Speichern fehlgeschlagen.");
    router.refresh();
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" disabled={busy} onClick={umschalten}
        className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:border-accent disabled:opacity-50">
        {bearbeitet ? "Zurücksetzen" : "Als bearbeitet markieren"}
      </button>
      {fehler && <span className="text-xs text-red-400">{fehler}</span>}
    </span>
  );
}
