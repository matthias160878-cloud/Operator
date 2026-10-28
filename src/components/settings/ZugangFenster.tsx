"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { knopf, knopfPrimaer } from "@/components/reichweitenaufbau/stil";

/**
 * Eigenes Fenster (modaler Dialog) zum Eintragen eines Zugangs. Der Inhalt
 * (Anleitung, Formular, Hinweise) kommt vom Server und steht schon im HTML;
 * das native <dialog> sperrt den Hintergrund, schließt mit Escape und setzt
 * den Fokus ins Fenster.
 */
export function ZugangFenster({
  titel,
  darfEintragen,
  sperrGrund,
  children,
}: {
  titel: string;
  darfEintragen: boolean;
  /** Kurze Begründung, warum Eintragen gesperrt ist. */
  sperrGrund?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [offen, setOffen] = useState(false);
  const titelId = useId();
  const grundId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (offen && !d.open) d.showModal();
    if (!offen && d.open) d.close();
  }, [offen]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={knopfPrimaer}
          disabled={!darfEintragen}
          aria-describedby={!darfEintragen && sperrGrund ? grundId : undefined}
          onClick={() => setOffen(true)}
        >
          Eintragen
        </button>
        {!darfEintragen && (
          <button type="button" className={knopf} onClick={() => setOffen(true)}>
            Anleitung
          </button>
        )}
      </div>
      {!darfEintragen && sperrGrund && (
        <p id={grundId} className="mt-1 text-[11px] text-muted">
          {sperrGrund}
        </p>
      )}
      <dialog
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titelId}
        data-testid="zugang-dialog"
        onClose={() => setOffen(false)}
        onClick={(e) => {
          // Klick auf den abgedunkelten Hintergrund (außerhalb des Inhalts) schließt.
          if (e.target === e.currentTarget) setOffen(false);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/70"
      >
        <div className="max-h-[85vh] space-y-4 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titelId} className="text-base font-semibold text-foreground">
              {titel}
            </h2>
            <button type="button" className={knopf} onClick={() => setOffen(false)} aria-label="Fenster schließen" autoFocus>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
