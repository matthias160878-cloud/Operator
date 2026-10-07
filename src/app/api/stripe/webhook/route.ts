import { NextResponse } from "next/server";
import { constructWebhookEvent, isStripeWebhookConfigured } from "@/lib/stripe";
import { processPlatformEvent } from "@/lib/billing/platformWebhook";

/**
 * Stripe-Webhook für die Paketabrechnung. Nur signaturgeprüfte Events
 * werden verarbeitet; die Erfolgs-URL des Checkouts schaltet nichts frei.
 */
export async function POST(request: Request) {
  if (!isStripeWebhookConfigured()) {
    return NextResponse.json({ error: "Webhook nicht konfiguriert." }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Fehlende Signatur." }, { status: 400 });

  const rawBody = await request.text();
  let event;
  try {
    event = constructWebhookEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  try {
    const result = await processPlatformEvent(event);
    return NextResponse.json({ received: true, result });
  } catch (err) {
    console.error("[stripe-webhook]", event.type, err instanceof Error ? err.message : err);
    // 500 -> Stripe stellt erneut zu; die Transaktion wurde zurückgerollt.
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen." }, { status: 500 });
  }
}
