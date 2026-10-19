import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { istGueltigerCode } from "@/lib/reichweite/codes";
import { oeffentlicherLink } from "@/lib/reichweite/service";
import { AnbieterImpressum } from "@/components/sales/AnbieterImpressum";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Impressum", robots: { index: false, follow: false }, referrer: "no-referrer" };

/** Impressum des Kunden, dem die Empfehlungsseite gehört. */
export default async function EmpfehlungImpressum({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!istGueltigerCode(code)) notFound();
  const link = await oeffentlicherLink(code);
  if (!link?.profil) notFound();
  return <AnbieterImpressum p={link.profil} zurueck={<a href={`/e/${code}`} className="text-accent-2 underline">Zurück zur Empfehlung</a>} />;
}
