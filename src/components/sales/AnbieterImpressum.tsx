import type { ReactNode } from "react";
import type { SellerProfile } from "@prisma/client";

/**
 * Impressum eines Kunden (Anbieters) auf seinen öffentlichen Seiten — nur
 * dessen eigene Angaben aus dem Verkäuferprofil. Gemeinsam für Shop und
 * Empfehlungsseiten.
 */
export function AnbieterImpressum({ p, zurueck }: { p: SellerProfile; zurueck: ReactNode }) {
  const lines = p.anschrift.split(/\r?\n|\s\|\s/).map((z) => z.trim()).filter(Boolean);
  return (
    <div className="flex min-h-screen flex-col items-center bg-grid px-4 py-12">
      <div className="card w-full max-w-2xl space-y-4 p-6 text-sm text-foreground sm:p-8">
        <h1 className="text-xl font-semibold">Impressum</h1>
        <p className="text-muted">Angaben des Anbieters gemäß § 5 Digitale-Dienste-Gesetz (DDG)</p>
        <section>
          <p>{p.firma || p.anbieter}</p>
          {p.firma && <p>Vertreten durch: {p.anbieter}</p>}
          {lines.map((z) => (
            <p key={z}>{z}</p>
          ))}
        </section>
        <section>
          <h2 className="font-semibold">Kontakt</h2>
          <p>
            E-Mail: <a className="underline" href={`mailto:${p.email}`}>{p.email}</a>
          </p>
          {p.telefon && <p>Telefon: {p.telefon}</p>}
        </section>
        {p.ustId && (
          <section>
            <h2 className="font-semibold">Umsatzsteuer-Identifikationsnummer</h2>
            <p>gemäß § 27 a Umsatzsteuergesetz: {p.ustId}</p>
          </section>
        )}
        {p.register && (
          <section>
            <h2 className="font-semibold">Registereintrag</h2>
            <p>{p.register}</p>
          </section>
        )}
        {p.aufsicht && (
          <section>
            <h2 className="font-semibold">Aufsichtsbehörde / Kammer</h2>
            <p>{p.aufsicht}</p>
          </section>
        )}
        <section>
          <h2 className="font-semibold">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>{p.verantwortlich || p.anbieter}, Anschrift wie oben</p>
        </section>
        <p className="text-xs text-muted">
          Für die Angaben ist der Anbieter verantwortlich. SECRET 58 stellt nur die technische Plattform bereit.
        </p>
        <p>{zurueck}</p>
      </div>
    </div>
  );
}
