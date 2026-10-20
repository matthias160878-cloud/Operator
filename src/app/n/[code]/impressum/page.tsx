import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { istGueltigerCode } from "@/lib/reichweite/codes";
import { oeffentlicherAnbieter } from "@/lib/reichweite/service";
import { newsletterFreigeschaltet } from "@/lib/reichweitenaufbau/freischaltung";
import { AnbieterImpressum } from "@/components/sales/AnbieterImpressum";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Impressum", robots: { index: false, follow: false }, referrer: "no-referrer" };

/** Impressum des Kunden, dem die Newsletter-Seite gehört. */
export default async function NewsletterImpressum({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!newsletterFreigeschaltet() || !istGueltigerCode(code)) notFound();
  const seite = await prisma.newsletterSeite.findUnique({ where: { code }, select: { workspaceId: true, istDemo: true } });
  if (!seite) notFound();
  const { profil } = await oeffentlicherAnbieter(seite.workspaceId, seite.istDemo);
  if (!profil) notFound();
  return <AnbieterImpressum p={profil} zurueck={<a href={`/n/${code}`} className="text-accent-2 underline">Zurück zur Anmeldung</a>} />;
}
