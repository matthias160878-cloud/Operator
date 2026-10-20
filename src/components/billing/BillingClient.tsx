"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export interface PlanCard {
  key: "PRO" | "MAXI";
  name: string;
  priceText: string;
  priceIsLive: boolean;
  intervalText: string;
  yearPriceText: string;
  yearIntervalText: string;
  /** false: Jahrespreis in Stripe noch nicht eingerichtet — Auswahl gesperrt. */
  yearAvailable: boolean;
  features: string[];
  quotas: { label: string; value: number; provisional: boolean }[];
}

interface Props {
  cards: PlanCard[];
  preselected: "PRO" | "MAXI" | null;
  preselectedInterval: "month" | "year";
  activeInterval: "month" | "year" | null;
  checkoutId: string | null;
  salesOpen: boolean;
  hasSubscription: boolean;
  hasCustomer: boolean;
  activePlan: string | null;
  /** § 19 UStG: Endpreise ohne Umsatzsteuer */
  kleinunternehmer: boolean;
}

export function BillingClient({
  cards,
  preselected,
  preselectedInterval,
  activeInterval,
  checkoutId,
  salesOpen,
  hasSubscription,
  hasCustomer,
  activePlan,
  kleinunternehmer,
}: Props) {
  const router = useRouter();
  const [promo, setPromo] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoNote, setPromoNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [selected, setSelected] = useState<"PRO" | "MAXI" | null>(preselected);
  const [interval, setBillingInterval] = useState<"month" | "year">(preselectedInterval);
  const selectedCard = cards.find((c) => c.key === selected) ?? null;
  const yearBlocked = interval === "year" && selectedCard !== null && !selectedCard.yearAvailable;
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutState, setCheckoutState] = useState<string | null>(checkoutId ? "Zahlung wird geprüft…" : null);

  // Nach der Rückkehr von Stripe: tatsächlichen Status abfragen. Die
  // Rückkehr-URL selbst schaltet nichts frei — nur der verifizierte Webhook.
  useEffect(() => {
    if (!checkoutId) return;
    let stop = false;
    let tries = 0;
    async function poll() {
      tries += 1;
      const res = await fetch(`/api/billing/status?checkout=${encodeURIComponent(checkoutId!)}`);
      const data = (await res.json().catch(() => ({}))) as { checkout?: { status: string } | null; plan?: { status: string } | null };
      if (stop) return;
      const cs = data.checkout?.status;
      if (cs === "COMPLETED" && data.plan?.status === "ACTIVE") {
        setCheckoutState("Zahlung bestätigt — dein Paket ist aktiv.");
        setTimeout(() => window.location.assign("/billing"), 1500);
        return;
      }
      if (cs === "FAILED" || cs === "EXPIRED") {
        setCheckoutState("Die Zahlung wurde nicht bestätigt. Es wurde nichts freigeschaltet.");
        return;
      }
      if (data.plan?.status === "PENDING") setCheckoutState("Zahlung eingeleitet — die Freischaltung erfolgt nach Zahlungseingang.");
      if (tries < 20) setTimeout(poll, 3000);
      else setCheckoutState("Noch keine Bestätigung von Stripe. Lade die Seite später neu; freigeschaltet wird erst nach bestätigter Zahlung.");
    }
    poll();
    return () => {
      stop = true;
    };
  }, [checkoutId]);

  async function promoEinloesen() {
    const code = promo.trim();
    if (!code) return;
    setPromoBusy(true);
    setPromoNote(null);
    try {
      const res = await fetch("/api/promocode/einloesen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => ({}))) as { name?: string; error?: string };
      if (!res.ok) {
        setPromoNote({ ok: false, text: data.error ?? "Der Code konnte nicht eingelöst werden." });
        return;
      }
      setPromo("");
      setPromoNote({ ok: true, text: `${data.name ?? "Paket"} ist jetzt dauerhaft freigeschaltet.` });
      router.refresh();
    } finally {
      setPromoBusy(false);
    }
  }

  async function go(path: string, body?: unknown) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Das hat nicht geklappt.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Keine Verbindung zum Server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {checkoutState && <div className="card border-accent/40 p-4 text-sm text-foreground" role="status">{checkoutState}</div>}
      <div role="group" aria-label="Abrechnungsintervall" className="flex flex-wrap gap-2">
        {(["month", "year"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={interval === value}
            onClick={() => {
              setBillingInterval(value);
              setConfirmed(false);
            }}
            className={clsx(
              "min-h-11 rounded-full border px-4 py-2 text-sm",
              interval === value ? "border-accent bg-accent/15 text-foreground" : "border-border text-muted hover:text-foreground"
            )}
          >
            {value === "month" ? "Monatlich" : "Jährlich (15 % Rabatt)"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => {
              setSelected(card.key);
              setConfirmed(false);
            }}
            aria-pressed={selected === card.key}
            className={clsx(
              "card p-5 text-left transition",
              selected === card.key ? "border-accent ring-2 ring-accent/40" : "hover:border-accent/50"
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">{card.name}</h3>
              {activePlan === card.key && (
                <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent-2">
                  aktiv{activeInterval === "year" ? " · Jahresabo" : activeInterval === "month" ? " · Monatsabo" : ""}
                </span>
              )}
            </div>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {interval === "year" ? card.yearPriceText : card.priceText}
            </div>
            <div className="text-xs text-muted">{interval === "year" ? card.yearIntervalText : card.intervalText}</div>
            {interval === "year" && !card.yearAvailable && (
              <div className="mt-1 text-xs text-warning">Jahresabo noch nicht eingerichtet</div>
            )}
            <ul className="mt-3 space-y-1 text-sm text-foreground">
              {card.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <ul className="mt-3 space-y-0.5 text-xs text-muted">
              {card.quotas.map((q) => (
                <li key={q.label}>
                  {q.value} × {q.label}
                  {q.provisional ? " (vorläufig)" : ""}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="card space-y-3 p-5">
        {!salesOpen && (
          <p className="text-sm text-muted">
            Der Kauf ist noch nicht freigeschaltet: Zahlungsanbieter oder Paketkonditionen sind vom Betreiber noch nicht
            vollständig eingerichtet. Es wird nichts abgebucht.
          </p>
        )}
        {hasSubscription ? (
          <p className="text-sm text-muted">Paketwechsel, Kündigung und Zahlungsdaten verwaltest du sicher bei Stripe.</p>
        ) : (
          <>
            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={confirmed}
                disabled={!selectedCard || yearBlocked}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span>
                {selectedCard
                  ? interval === "year"
                    ? `Ich möchte ${selectedCard.name} im Jahresabo für ${selectedCard.yearPriceText} ${kleinunternehmer ? "pro Jahr (im Voraus, Endpreis ohne Umsatzsteuer nach § 19 UStG)" : "netto pro Jahr (im Voraus, zzgl. Umsatzsteuer)"} kostenpflichtig kaufen und bestätige das ausdrücklich.`
                    : `Ich möchte ${selectedCard.name} im Monatsabo für ${selectedCard.priceText} ${kleinunternehmer ? "pro Monat (Endpreis ohne Umsatzsteuer nach § 19 UStG)" : "netto pro Monat (zzgl. Umsatzsteuer)"} kostenpflichtig kaufen und bestätige das ausdrücklich.`
                  : "Bitte zuerst ein Paket wählen."}
              </span>
            </label>
            <button
              type="button"
              disabled={!selected || !confirmed || busy || !salesOpen || yearBlocked}
              onClick={() => go("/api/stripe/checkout", { plan: selected, interval, confirmed: true })}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Weiter zu Stripe…" : "Zahlungspflichtig bestellen"}
            </button>
          </>
        )}
        {hasCustomer && (
          <button
            type="button"
            disabled={busy}
            onClick={() => go("/api/stripe/portal")}
            className="ml-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground disabled:opacity-40"
          >
            Abo &amp; Rechnungen verwalten
          </button>
        )}
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      </div>

      {!hasSubscription && (
        <div className="card space-y-2 p-5">
          <h2 className="text-sm font-semibold text-foreground">Promocode einlösen</h2>
          <p className="text-xs text-muted">
            Hast du einen Promocode vom Betreiber? Er schaltet das zugehörige Paket dauerhaft frei — ohne Zahlung, ohne Abo.
          </p>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void promoEinloesen();
            }}
          >
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="S58-XXXX-XXXX-XXXX"
              aria-label="Promocode"
              autoComplete="off"
              spellCheck={false}
              className="min-h-11 min-w-[14rem] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={promoBusy || !promo.trim()}
              className="min-h-11 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent disabled:opacity-40"
            >
              {promoBusy ? "Prüfe …" : "Einlösen"}
            </button>
          </form>
          {promoNote && (
            <p role={promoNote.ok ? "status" : "alert"} className={`text-sm ${promoNote.ok ? "text-success" : "text-red-300"}`}>
              {promoNote.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
