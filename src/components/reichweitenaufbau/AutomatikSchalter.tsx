"use client";

import { useAktion } from "@/components/reichweitenaufbau/gemeinsam";
import { karte, knopf } from "@/components/reichweitenaufbau/stil";

/** Pausiert alle automatischen Abläufe des Workspaces (geplante Veröffentlichungen). */
export function AutomatikSchalter({ pausiert, darfFreigeben }: { pausiert: boolean; darfFreigeben: boolean }) {
  const { laedt, aufruf, rueckmeldung } = useAktion();
  return (
    <section className={karte} data-testid="automatik">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Automatische Abläufe: {pausiert ? "pausiert" : "aktiv"}</h2>
          <p className="text-xs text-muted">
            Betrifft geplante Veröffentlichungen. Pausierte Aufträge bleiben erhalten und laufen nach dem Fortsetzen weiter – ohne doppelte Veröffentlichung.
            Newsletter und Werbung starten ohnehin nur nach ausdrücklicher Freigabe.
          </p>
        </div>
        {darfFreigeben && (
          <button type="button" className={knopf} disabled={laedt} onClick={() => aufruf("/api/automatik", "PUT", { pausiert: !pausiert })}>
            {pausiert ? "Fortsetzen" : "Alle pausieren"}
          </button>
        )}
      </div>
      {rueckmeldung}
    </section>
  );
}
