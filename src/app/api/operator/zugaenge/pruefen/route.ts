import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/lib/auth/session";
import { route } from "@/lib/api";
import { applyOperatorSettings } from "@/lib/operatorSettings";
import { ComposioError, composioPing, isComposioConfigured } from "@/lib/composio/client";
import { isEmailConfigured } from "@/lib/email";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/**
 * „Verbindung prüfen“: ein lesender, kundenunabhängiger Aufruf je Anbieter.
 * Es wird nichts geschrieben, gesendet oder abgebucht.
 */
const schema = z.object({ bereich: z.enum(["composio", "email", "zahlung"]) });

async function handlePOST(request: Request) {
  const user = await requireSessionUser();
  if (!user.isOperator) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  await applyOperatorSettings();

  switch (parsed.data.bereich) {
    case "composio": {
      if (!isComposioConfigured()) return NextResponse.json({ ok: false, text: "Composio-Schlüssel fehlt." });
      try {
        const r = await composioPing();
        return NextResponse.json({ ok: true, text: `Schlüssel gültig. ${r.authConfigs} Auth-Config(s) im Composio-Projekt.` });
      } catch (err) {
        const text = err instanceof ComposioError ? err.message : "Prüfung fehlgeschlagen.";
        return NextResponse.json({ ok: false, text });
      }
    }
    case "email": {
      if (!isEmailConfigured()) return NextResponse.json({ ok: false, text: "Resend-Schlüssel oder Absender fehlt." });
      const base = (process.env.EMAIL_API_BASE?.trim() || "https://api.resend.com").replace(/\/+$/, "");
      try {
        const res = await fetch(`${base}/domains`, {
          headers: { authorization: `Bearer ${process.env.RESEND_API_KEY?.trim()}` },
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
        if (res.status === 401 || res.status === 403) return NextResponse.json({ ok: false, text: "Resend hat den Schlüssel abgelehnt." });
        if (!res.ok) return NextResponse.json({ ok: false, text: `Resend antwortet mit HTTP ${res.status}.` });
        const data = (await res.json().catch(() => null)) as { data?: { name?: string; status?: string }[] } | null;
        const domains = data?.data ?? [];
        const verified = domains.filter((d) => d.status === "verified").map((d) => d.name).filter(Boolean);
        return NextResponse.json({
          ok: true,
          text: verified.length ? `Schlüssel gültig. Bestätigte Domains: ${verified.join(", ")}.` : "Schlüssel gültig, aber noch keine bestätigte Absenderdomain bei Resend.",
        });
      } catch {
        return NextResponse.json({ ok: false, text: "Resend ist gerade nicht erreichbar." });
      }
    }
    case "zahlung": {
      if (!isStripeConfigured()) return NextResponse.json({ ok: false, text: "Stripe Secret Key fehlt." });
      try {
        const prices = await getStripe().prices.list({ limit: 1 });
        const mode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "Live" : "Test";
        return NextResponse.json({ ok: true, text: `Stripe erreichbar (${mode}-Modus, ${prices.data.length ? "Preise vorhanden" : "noch keine Preise"}).` });
      } catch (err) {
        const msg = err instanceof Error ? err.message.replace(/sk_(test|live)_[A-Za-z0-9]+/g, "[…]").slice(0, 160) : "Prüfung fehlgeschlagen.";
        return NextResponse.json({ ok: false, text: `Stripe: ${msg}` });
      }
    }
  }
}

export const POST = route(handlePOST);
