import { NextResponse } from "next/server";
import { constructWebhookEvent, isStripeWebhookConfigured } from "@/lib/stripe";
import { markLicenseRefunded } from "@/lib/license";

/**
 * Pro/Maxi gibt es nicht mehr über einen eigenen Checkout hier (siehe
 * /api/stripe/checkout, retired, 410) --- deshalb schaltet dieser Webhook
 * auch kein `checkout.session.completed` mehr zu einer neuen Lizenz frei.
 * `charge.refunded` bleibt aktiv: eine Erstattung für einen VOR dieser
 * Umstellung hier abgeschlossenen Kauf muss weiterhin verarbeitet werden
 * können.
 */
export async function POST(request: Request) {
  if (!isStripeWebhookConfigured()) {
    return NextResponse.json(
      { error: "Stripe-Webhook ist noch nicht konfiguriert (STRIPE_WEBHOOK_SECRET fehlt)." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Fehlende Stripe-Signatur." }, { status: 400 });
  }

  const rawBody = await request.text();

  try {
    const event = constructWebhookEvent(rawBody, signature);
    if (event.type === "charge.refunded") {
      await markLicenseRefunded(event.data.object);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook-Verarbeitung fehlgeschlagen." },
      { status: 400 },
    );
  }
}
