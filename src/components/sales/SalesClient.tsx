"use client";

import { useState, type FormEvent } from "react";

interface Merchant {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: string[];
}

export function SalesClient({
  connectConfigured,
  merchant,
  products,
}: {
  connectConfigured: boolean;
  merchant: Merchant | null;
  products: { id: string; name: string; price: string; active: boolean }[];
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(path: string, body?: BodyInit, json = true) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: json ? { "content-type": "application/json" } : { "content-type": "text/csv" },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg(data.error ?? "Das hat nicht geklappt.");
      return res.ok ? data : null;
    } finally {
      setBusy(false);
    }
  }

  async function addProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const euros = String(f.get("price") ?? "").replace(",", ".");
    const amount = Math.round(Number(euros) * 100);
    const ok = await post(
      "/api/sales/products",
      JSON.stringify({ name: f.get("name"), description: f.get("description"), amount, currency: f.get("currency") })
    );
    if (ok) window.location.reload();
  }

  async function importCsv(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = (new FormData(e.currentTarget).get("file") as File | null) ?? null;
    if (!file) return;
    const data = await post("/api/sales/import", await file.text(), false);
    if (data) setMsg(`Importiert: ${data.imported}, übersprungen (bereits vorhanden): ${data.duplicates}${data.errors?.length ? `, fehlerhafte Zeilen: ${data.errors.length}` : ""}`);
  }

  const input = "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-foreground">B · Verkaufen über SECRET 58</h2>
        {!connectConfigured ? (
          <p className="text-sm text-muted">Der Verkaufsbereich ist vom Betreiber noch nicht eingerichtet.</p>
        ) : (
          <>
            <p className="text-xs text-muted">
              Du bekommst ein eigenes Stripe-Händlerkonto. Du bist Verkäufer gegenüber deinen Kunden, trägst die
              Stripe-Gebühren, bearbeitest Erstattungen und erhältst Auszahlungen direkt von Stripe. SECRET 58 erhebt
              darauf keine Gebühr. Bank- und Identitätsdaten gibst du nur bei Stripe ein.
            </p>
            <p className="text-sm">
              Status:{" "}
              {!merchant
                ? "noch kein Händlerkonto"
                : merchant.chargesEnabled
                  ? `verkaufsbereit${merchant.payoutsEnabled ? ", Auszahlungen aktiv" : ", Auszahlungen noch nicht aktiv"}`
                  : merchant.detailsSubmitted
                    ? "Angaben werden von Stripe geprüft"
                    : "Einrichtung nicht abgeschlossen"}
            </p>
            {merchant && merchant.requirementsDue.length > 0 && (
              <p className="text-xs text-muted">Stripe benötigt noch {merchant.requirementsDue.length} Angabe(n).</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                disabled={busy}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-40"
                onClick={async () => {
                  const d = await post("/api/sales/onboarding");
                  if (d?.url) window.location.assign(d.url);
                }}
              >
                {merchant ? "Einrichtung bei Stripe fortsetzen" : "Händlerkonto bei Stripe einrichten"}
              </button>
              {merchant && (
                <button
                  disabled={busy}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm"
                  onClick={async () => {
                    if (await post("/api/sales/status")) window.location.reload();
                  }}
                >
                  Status aktualisieren
                </button>
              )}
            </div>
            <form onSubmit={addProduct} className="grid gap-2 sm:grid-cols-2">
              <input name="name" required placeholder="Produkt / Dienstleistung" className={input} />
              <input name="price" required inputMode="decimal" placeholder="Preis, z. B. 49,00" className={input} />
              <input name="description" placeholder="Beschreibung (optional)" className={`${input} sm:col-span-2`} />
              <select name="currency" className={input} defaultValue="eur">
                <option value="eur">EUR</option>
                <option value="chf">CHF</option>
                <option value="usd">USD</option>
                <option value="gbp">GBP</option>
              </select>
              <button disabled={busy} className="rounded-lg border border-border px-3 py-1.5 text-sm">Angebot anlegen</button>
            </form>
            <ul className="space-y-1 text-sm">
              {products.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {p.name} · {p.price} {p.active ? "" : "(inaktiv)"}
                  </span>
                  <a className="text-xs text-accent-2 underline" href={`/shop/${p.id}`} target="_blank" rel="noreferrer">
                    Verkaufslink
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-foreground">A · Bestehenden Shop einbinden (Import)</h2>
        <p className="text-xs text-muted">
          Lade einen CSV-Export deines Shops oder Zahlungsanbieters hoch (Spalten: external_id, date, amount, currency,
          product). Bereits vorhandene Verkäufe — auch solche, die direkt über SECRET 58 liefen — werden anhand der
          externen ID erkannt und nicht doppelt gezählt. Auszahlungen bleiben bei deinem jeweiligen Anbieter. Direkte
          Live-Anbindungen (z. B. per OAuth) an Shopsysteme sind noch nicht umgesetzt.
        </p>
        <form onSubmit={importCsv} className="flex flex-wrap items-center gap-2">
          <input name="file" type="file" accept=".csv,text/csv" required className="text-sm" />
          <button disabled={busy} className="rounded-lg border border-border px-3 py-1.5 text-sm">Importieren</button>
        </form>
      </section>
      {msg && <p className="text-sm text-foreground lg:col-span-2" role="status">{msg}</p>}
    </div>
  );
}
