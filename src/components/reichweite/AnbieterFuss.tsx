import type { ReactNode } from "react";
import type { SellerProfile } from "@prisma/client";

/** Fußzeile öffentlicher Kundenseiten: Impressum und Datenschutz des Anbieters (nicht von SECRET 58). */
export function AnbieterFuss({ profil, impressumHref, children }: { profil: SellerProfile | null; impressumHref: string; children?: ReactNode }) {
  return (
    <p className="px-1 text-[11px] text-muted" data-testid="anbieter-fuss">
      {children}
      {children ? " " : ""}
      {profil ? (
        <>
          Anbieter: {profil.firma || profil.anbieter} ·{" "}
          <a href={impressumHref} className="underline">Impressum</a> ·{" "}
          <a href={profil.datenschutzUrl} rel="noopener noreferrer nofollow" target="_blank" className="underline">Datenschutz</a>
        </>
      ) : (
        <span>DEMO – Anbieterangaben (Impressum, Datenschutz) sind noch nicht hinterlegt.</span>
      )}
    </p>
  );
}

/** Ersatzseite, solange der Kunde seine Pflichtangaben nicht hinterlegt hat. */
export function NichtFreigeschaltet() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-4 py-12">
      <div className="card w-full max-w-md p-6 text-center" data-testid="nicht-freigeschaltet">
        <h1 className="text-lg font-semibold text-foreground">Diese Seite ist noch nicht freigeschaltet.</h1>
        <p className="mt-2 text-sm text-muted">Der Anbieter hat seine Pflichtangaben (Impressum und Datenschutz) noch nicht hinterlegt.</p>
      </div>
    </div>
  );
}
