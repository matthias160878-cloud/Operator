import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getOperatorOverview, type MoneyByCurrency } from "@/lib/operator/overview";
import { formatCents, packageTermsConfirmed } from "@/lib/plans";
import { LogoutButton } from "@/components/auth/LogoutButton";

export const dynamic = "force-dynamic";

function Money({ rows, empty = "—" }: { rows: MoneyByCurrency[]; empty?: string }) {
  if (rows.length === 0) return <span className="text-muted">{empty}</span>;
  return (
    <span className="space-x-3">
      {rows.map((r) => (
        <span key={r.currency}>{formatCents(r.amount, r.currency)}</span>
      ))}
    </span>
  );
}

export default async function OperatorPage() {
  const user = await getSessionUser();
  if (!user?.isOperator) redirect("/");
  const o = await getOperatorOverview();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-accent-2">Betreiberbereich</div>
          <h1 className="text-xl font-semibold text-foreground">Paketumsätze &amp; Betrieb</h1>
          <p className="text-xs text-muted">
            Stripe-Modus: {o.mode === "live" ? "Live" : o.mode === "test" ? "Test" : "nicht konfiguriert"} · Verkauf{" "}
            {packageTermsConfirmed() ? "freigegeben" : "gesperrt (Konditionen unbestätigt)"} · Kundeninhalte sind hier
            bewusst nicht sichtbar.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground">
            Eigener Arbeitsbereich
          </Link>
          <LogoutButton />
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs text-muted">Umsatz (Paketzahlungen, brutto)</div>
          <div className="mt-1 text-lg text-foreground"><Money rows={o.gross} /></div>
          <div className="mt-1 text-xs text-muted">davon Umsatzsteuer: <Money rows={o.tax.filter((t) => t.amount > 0)} empty="0" /></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Erstattungen</div>
          <div className="mt-1 text-lg text-foreground"><Money rows={o.refunds} /></div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Stripe: ausstehend (noch nicht verfügbar)</div>
          <div className="mt-1 text-lg text-foreground">
            {o.stripe ? <Money rows={o.stripe.pending} /> : <span className="text-muted">Stripe nicht verbunden</span>}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-muted">Stripe: verfügbares Guthaben</div>
          <div className="mt-1 text-lg text-foreground">
            {o.stripe ? <Money rows={o.stripe.available} /> : <span className="text-muted">Stripe nicht verbunden</span>}
          </div>
        </div>
      </section>
      {o.stripe?.error && <p className="text-sm text-red-300">{o.stripe.error}</p>}

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-foreground">Auszahlungen (laut Stripe)</h2>
        {!o.stripe ? (
          <p className="mt-2 text-sm text-muted">Ohne Stripe-Verbindung gibt es keine Auszahlungsdaten.</p>
        ) : o.stripe.payouts.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Noch keine Auszahlungen.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <tbody>
              {o.stripe.payouts.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-1.5">{p.arrivalDate.toLocaleDateString("de-DE")}</td>
                  <td>{formatCents(p.amount, p.currency)}</td>
                  <td className="text-muted">{p.status === "paid" ? "ausgezahlt" : p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-xs text-muted">
          Auszahlungen auf dein Bankkonto steuert Stripe nach deinem Auszahlungsplan. Bankverbindung und
          Identitätsprüfung hinterlegst du ausschließlich bei Stripe. Eine manuelle Auszahlung aus dieser Anwendung wird
          nicht angeboten.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-foreground">Pakete</h2>
          <p className="text-xs text-muted">{o.workspaceCount} Arbeitsbereiche · {o.openCheckouts} offene Checkouts</p>
          <ul className="mt-2 space-y-1 text-sm">
            {o.plans.length === 0 && <li className="text-muted">Noch keine Pakete.</li>}
            {o.plans.map((p) => (
              <li key={`${p.plan}-${p.status}-${p.source}`}>
                {p.plan} · {p.status}
                {p.source === "TEST" ? " · Testdaten" : ""}: {p.count}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-foreground">Letzte Zahlungsvorgänge</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {o.recentPayments.length === 0 && <li className="text-muted">Noch keine Zahlungen verbucht.</li>}
            {o.recentPayments.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span className="text-muted">{p.createdAt.toLocaleDateString("de-DE")} · {p.kind === "REFUND" ? "Erstattung" : "Zahlung"} {p.plan ?? ""}</span>
                <span>{p.kind === "REFUND" ? "−" : ""}{formatCents(p.amount, p.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
