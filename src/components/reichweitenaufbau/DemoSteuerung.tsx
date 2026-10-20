"use client";

import { useAktion } from "@/components/reichweitenaufbau/gemeinsam";
import { knopf } from "@/components/reichweitenaufbau/stil";

export function DemoSteuerung({ hatDemo }: { hatDemo: boolean }) {
  const { laedt, aufruf, rueckmeldung } = useAktion();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={knopf} disabled={laedt} onClick={() => aufruf("/api/reichweitenaufbau/demo", "POST")}>
          {hatDemo ? "Demo-Daten neu laden" : "Demo-Daten laden"}
        </button>
        {hatDemo && (
          <button type="button" className={knopf} disabled={laedt} onClick={() => aufruf("/api/reichweitenaufbau/demo", "DELETE")}>
            Demo entfernen
          </button>
        )}
      </div>
      {rueckmeldung}
    </div>
  );
}
