import type { Metadata } from "next";
import Link from "next/link";
import { getImpressum } from "@/lib/legal";
import { LegalFooter } from "@/components/legal/LegalFooter";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Impressum — SECRET 58" };

export default function ImpressumPage() {
  const i = getImpressum();
  return (
    <div className="flex min-h-screen flex-col items-center bg-grid px-4 py-12">
      <div className="card w-full max-w-2xl space-y-4 p-6 text-sm text-foreground sm:p-8">
        <h1 className="text-xl font-semibold">Impressum</h1>
        {!i ? (
          <p className="text-muted">
            Die Anbieterangaben sind noch nicht hinterlegt. Der Betreiber trägt sie in der Server-Konfiguration ein
            (IMPRESSUM_NAME, IMPRESSUM_ANSCHRIFT, IMPRESSUM_EMAIL).
          </p>
        ) : (
          <>
            <p className="text-muted">Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)</p>
            <section>
              <h2 className="font-semibold">Diensteanbieter</h2>
              <p>{i.firma ?? i.anbieter}</p>
              {i.firma && <p>{i.register ? "Vertreten durch" : "Inhaber"}: {i.anbieter}</p>}
              {i.anschrift.map((z) => (
                <p key={z}>{z}</p>
              ))}
            </section>
            <section>
              <h2 className="font-semibold">Kontakt</h2>
              <p>
                E-Mail: <a className="underline" href={`mailto:${i.email}`}>{i.email}</a>
              </p>
              {i.telefon && <p>Telefon: {i.telefon}</p>}
              {i.kontaktUrl && (
                <p>
                  Kontaktformular: <a className="underline" href={i.kontaktUrl}>{i.kontaktUrl.startsWith("/") ? "Anfrage stellen" : i.kontaktUrl}</a>
                </p>
              )}
            </section>
            {i.ustId && (
              <section>
                <h2 className="font-semibold">Umsatzsteuer-Identifikationsnummer</h2>
                <p>gemäß § 27 a Umsatzsteuergesetz: {i.ustId}</p>
              </section>
            )}
            {!i.ustId && i.umsatzsteuer && (
              <section>
                <h2 className="font-semibold">Umsatzsteuer</h2>
                <p>{i.umsatzsteuer}</p>
              </section>
            )}
            {i.register && (
              <section>
                <h2 className="font-semibold">Registereintrag</h2>
                <p>{i.register}</p>
              </section>
            )}
            {i.aufsicht && (
              <section>
                <h2 className="font-semibold">Aufsichtsbehörde / Kammer</h2>
                <p>{i.aufsicht}</p>
              </section>
            )}
            <section>
              <h2 className="font-semibold">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
              <p>{i.verantwortlich}, Anschrift wie oben</p>
            </section>
            {i.streitbeilegung && (
              <section>
                <h2 className="font-semibold">Verbraucherstreitbeilegung</h2>
                <p>{i.streitbeilegung}</p>
              </section>
            )}
          </>
        )}
        <p>
          <Link href="/buy" className="text-accent-2 underline">Zurück</Link>
        </p>
      </div>
      <LegalFooter installieren />
    </div>
  );
}
