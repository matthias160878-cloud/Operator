import { NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { processConnectEvent } from "@/lib/connect/connectWebhook";

/** Webhook für Events der verbundenen Händlerkonten (eigener Signaturschlüssel). */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Connect-Webhook nicht konfiguriert." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Fehlende Signatur." }, { status: 400 });
  const rawBody = await request.text();
  let event;
  try {
    event = constructWebhookEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }
  try {
    return NextResponse.json({ received: true, result: await processConnectEvent(event) });
  } catch (err) {
    console.error("[connect-webhook]", event.type, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen." }, { status: 500 });
  }
}
