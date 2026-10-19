import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { sellerProfileComplete } from "@/lib/connect/sellerProfile";
import { AnbieterImpressum } from "@/components/sales/AnbieterImpressum";

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
  return <AnbieterImpressum p={p} zurueck={<Link href={`/shop/${product.id}`} className="text-accent-2 underline">Zurück zum Angebot</Link>} />;
}
