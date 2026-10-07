import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { METRIC_LABELS, PLANS, PLAN_KEYS, formatCents, packageTermsConfirmed, type Metric } from "@/lib/plans";
import { getPlanPrice } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pro & Maxi — SECRET 58",
  description: "SECRET 58 Social Media AI: eigener privater Arbeitsbereich, KI-Funktionen inklusive.",
};

/**
 * Öffentliche Verkaufsseite. Pakete, Leistungen und Kontingente kommen aus
 * der zentralen Definition (src/lib/plans.ts), Betrag und Intervall aus dem
 * Stripe-Preis. Gekauft wird erst nach Anmeldung unter /billing — mit
 * ausdrücklicher Bestätigung durch den Kunden.
 */
export default async function BuyPage() {
  const user = await getSessionUser();
  const prices = await Promise.all(PLAN_KEYS.map((k) => getPlanPrice(k).catch(() => null)));
  const confirmed = packageTermsConfirmed();

  return (
    <div className="flex min-h-screen flex-col items-center gap-8 bg-grid px-4 py-12">
      <div className="text-center">
        <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full shadow-[0_0_40px_rgba(109,91,255,0.5)]">
          <Image src="/brand/brain-core.png" alt="SECRET 58" fill sizes="80px" className="object-cover" priority />
        </div>
        <div className="text-xs uppercase tracking-[0.25em] text-accent-2">AI Social Command Center</div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">SECRET 58 — Social Media AI</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
          Dein eigener, privater Arbeitsbereich. Die KI-Funktionen laufen über die Zugänge des Betreibers — du zahlst nur
          dein Paket und brauchst kein zusätzliches ChatGPT-, Claude- oder Gemini-Abo. Bestehende eigene Abos werden
          dadurch weder übernommen noch gekündigt.
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-2">
        {PLAN_KEYS.map((key, i) => {
          const def = PLANS[key];
          const price = prices[i];
          const href = user ? `/billing?plan=${key.toLowerCase()}` : `/signup?plan=${key.toLowerCase()}`;
          return (
            <div key={key} className="card flex flex-col p-6">
              <h2 className="text-lg font-semibold text-foreground">{def.name}</h2>
              <div className="mt-2 text-3xl font-semibold text-foreground">
                {price ? formatCents(price.unitAmount, price.currency) : formatCents(def.displayAmountCents, def.displayCurrency)}
              </div>
              <div className="text-xs text-muted">
                {price
                  ? price.recurring
                    ? `wiederkehrend (${price.recurring.interval === "month" ? "monatlich" : price.recurring.interval === "year" ? "jährlich" : price.recurring.interval})`
                    : "einmalig"
                  : "Unverbindliche Anzeige — Preis und Abrechnungszeitraum werden mit dem Zahlungsanbieter festgelegt"}
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-foreground">
                {def.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <ul className="mt-3 space-y-0.5 text-xs text-muted">
                {(Object.keys(def.quotas) as Metric[]).map((m) => (
                  <li key={m}>
                    {def.quotas[m]} × {METRIC_LABELS[m]}
                  </li>
                ))}
              </ul>
              <Link
                href={href}
                className="mt-5 rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90"
              >
                {def.name} wählen
              </Link>
            </div>
          );
        })}
      </div>
      <p className="max-w-2xl text-center text-xs text-muted">
        Kontingente sind feste Obergrenzen ohne automatische Zusatzkosten.
        {confirmed ? "" : " Alle Angaben sind vorläufig; der Kauf wird freigeschaltet, sobald die Paketkonditionen bestätigt sind."}{" "}
        {user ? (
          <Link className="underline" href="/">Zum Arbeitsbereich</Link>
        ) : (
          <Link className="underline" href="/login">Anmelden</Link>
        )}
      </p>
    </div>
  );
}
