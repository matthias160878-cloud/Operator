import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/plans";
import { ShopBuyButton } from "@/components/sales/ShopBuyButton";

export const dynamic = "force-dynamic";

/** Öffentliche Angebotsseite eines Kunden. Zeigt keine weiteren Workspace-Daten. */
export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ bezahlt?: string }>;
}) {
  const { productId } = await params;
  const { bezahlt } = await searchParams;
  const product = await prisma.merchantProduct.findFirst({
    where: { id: productId, active: true },
    include: { workspace: { select: { name: true, merchantAccount: { select: { chargesEnabled: true } } } } },
  });
  if (!product || !product.workspace.merchantAccount?.chargesEnabled) notFound();
  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-4 py-12">
      <div className="card w-full max-w-md p-6 text-center">
        <div className="text-xs text-muted">Angebot von {product.workspace.name}</div>
        <h1 className="mt-1 text-xl font-semibold text-foreground">{product.name}</h1>
        {product.description && <p className="mt-2 text-sm text-muted">{product.description}</p>}
        <div className="mt-4 text-2xl font-semibold text-foreground">{formatCents(product.amount, product.currency)}</div>
        {bezahlt ? (
          <p className="mt-4 text-sm text-foreground">
            Danke! Die Zahlung wird von Stripe bestätigt; der Verkäufer erhält die Bestätigung direkt.
          </p>
        ) : (
          <ShopBuyButton productId={product.id} />
        )}
        <p className="mt-4 text-[11px] text-muted">
          Verkäufer ist {product.workspace.name}. Die Zahlung wird über Stripe direkt an den Verkäufer abgewickelt.
        </p>
      </div>
    </div>
  );
}
