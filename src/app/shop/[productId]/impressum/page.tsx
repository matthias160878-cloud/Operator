import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { sellerProfileComplete } from "@/lib/connect/sellerProfile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Impressum des Verkäufers" };

/** Impressum des Kunden (Verkäufers) zu einem öffentlichen Angebot — nur dessen eigene Angaben. */
export default async function SellerImpressumPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await prisma.merchantProduct.findFirst({
    where: { id: productId, active: true },
    select: { id: true, workspace: { select: { sellerProfile: true } } },
  });
  const p = product?.workspace.sellerProfile ?? null;
  if (!product || !p || !sellerProfileComplete(p)) notFound();
  const lines = p.anschrift.split(/\r?\n|\s\|\s/).map((z) => z.trim()).filter(Boolean);
  return (
    <div className="flex min-h-screen flex-col items-center bg-grid px-4 py-12">
      <div className="card w-full max-w-2xl space-y-4 p-6 text-sm text-foreground sm:p-8">
        <h1 className="text-xl font-semibold">Impressum</h1>
        <p className="text-muted">Angaben des Verkäufers gemäß § 5 Digitale-Dienste-Gesetz (DDG)</p>
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
          Für die Angaben ist der Verkäufer verantwortlich. SECRET 58 stellt nur die technische Plattform bereit.
        </p>
        <p>
          <Link href={`/shop/${product.id}`} className="text-accent-2 underline">Zurück zum Angebot</Link>
        </p>
      </div>
    </div>
  );
}
