import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { isConnectConfigured } from "@/lib/connect/merchant";
import { sellerProfileComplete } from "@/lib/connect/sellerProfile";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { route } from "@/lib/api";

/**
 * Öffentlicher Kauf eines Kundenprodukts. Direct Charge auf dem verbundenen
 * Konto des Kunden; Preis und Währung kommen aus der Datenbank, nie aus der
 * Anfrage. Keine Plattformgebühr.
 */
async function handlePOST(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  if (!(await hitRateLimit(`shop:${clientIp(request)}`, 20, 600))) {
    return NextResponse.json({ error: "Zu viele Anfragen." }, { status: 429 });
  }
  if (!isConnectConfigured()) return NextResponse.json({ error: "Der Verkauf ist nicht verfügbar." }, { status: 503 });
  const product = await prisma.merchantProduct.findFirst({
    where: { id: productId, active: true },
    include: { workspace: { include: { merchantAccount: true, sellerProfile: true } } },
  });
  const merchant = product?.workspace.merchantAccount;
  if (!product || !merchant || !merchant.chargesEnabled || !sellerProfileComplete(product.workspace.sellerProfile)) {
    return NextResponse.json({ error: "Dieses Angebot ist nicht verfügbar." }, { status: 404 });
  }
  const origin = new URL(request.url).origin;
  const session = await getStripe().checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency,
            unit_amount: product.amount,
            product_data: { name: product.name, ...(product.description ? { description: product.description } : {}) },
          },
        },
      ],
      metadata: { workspaceId: product.workspaceId, productId: product.id, productName: product.name.slice(0, 200) },
      success_url: `${origin}/shop/${product.id}?bezahlt=1`,
      cancel_url: `${origin}/shop/${product.id}`,
    },
    { stripeAccount: merchant.stripeAccountId }
  );
  if (!session.url) throw new Error("Keine Checkout-URL");
  return NextResponse.json({ url: session.url });
}

export const POST = route(handlePOST);
