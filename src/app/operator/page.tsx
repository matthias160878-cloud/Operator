import { prisma } from "@/lib/db";
import { formatEur } from "@/lib/pricing";

export const metadata = { title: "Betreiber-Dashboard — SECRET 58" };
export const dynamic = "force-dynamic";

/**
 * Privates Betreiber-Dashboard (Abschnitt 4 des Auftrags). Nur über
 * OWNER_ACCESS_KEY erreichbar (siehe `proxy.ts`) — zeigt ausschließlich
 * aggregierte Paketzahlungen (License-Tabelle), niemals private
 * Kundeninhalte (Brand DNA, Kampagnen, Content etc.) aus einzelnen
 * Kunden-Workspaces. Zahlen stammen 1:1 aus der eigenen DB (durch Stripe-
 * Webhooks/Success-Redirect befüllt) — keine erfundenen Guthaben oder
 * Erfolgsmeldungen.
 */
export default async function OperatorDashboard() {
  const [active, pending, refunded, recent] = await Promise.all([
    prisma.license.findMany({ where: { status: "ACTIVE" }, select: { amountTotal: true, currency: true } }),
    prisma.license.count({ where: { status: "PENDING" } }),
    prisma.license.count({ where: { status: "REFUNDED" } }),
    prisma.license.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        customerEmail: true,
        status: true,
        amountTotal: true,
        currency: true,
        createdAt: true,
        workspaceId: true,
      },
    }),
  ]);

  const totalsByCurrency = new Map<string, number>();
  for (const license of active) {
    totalsByCurrency.set(
      license.currency,
      (totalsByCurrency.get(license.currency) ?? 0) + license.amountTotal,
    );
  }

  return (
    <div className="min-h-screen bg-grid px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-foreground">Betreiber-Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            Ausschließlich Paketzahlungen (Stripe) — keine privaten Kundeninhalte.
            Umsatz = Summe aktiver (bezahlter, nicht erstatteter) Lizenzen.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Aktive Lizenzen</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{active.length}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Ausstehend (PENDING)</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{pending}</p>
          </div>
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Erstattet</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{refunded}</p>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Umsatz (aktive Lizenzen)</p>
          {totalsByCurrency.size === 0 ? (
            <p className="mt-2 text-sm text-muted">Noch keine aktiven Lizenzen.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {Array.from(totalsByCurrency.entries()).map(([currency, amountMinor]) => (
                <li key={currency} className="text-xl font-semibold text-foreground">
                  {formatEur("de", amountMinor / 100)}
                  {currency.toLowerCase() !== "eur" && (
                    <span className="ml-1 text-xs text-muted">({currency.toUpperCase()})</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            Verfügbares Guthaben, ausgezahlte Beträge und Auszahlungen werden hier bewusst{" "}
            <strong>nicht</strong> angezeigt — diese Daten liefert nur Stripe selbst (Stripe-
            Dashboard → Zahlungen/Auszahlungen), inkl. Stripe-eigener Gebühren und
            Auszahlungs-Timing. Eine Anbindung dafür ist vorbereitet, aber nicht
            Teil dieses Stands (siehe Projektbericht).
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Letzte Lizenzen</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="pb-2 pr-4">Datum</th>
                  <th className="pb-2 pr-4">E-Mail</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Betrag</th>
                  <th className="pb-2">Workspace zugeordnet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((license) => (
                  <tr key={license.id}>
                    <td className="py-2 pr-4 text-muted">
                      {license.createdAt.toLocaleDateString("de-DE")}
                    </td>
                    <td className="py-2 pr-4 text-foreground">{license.customerEmail || "—"}</td>
                    <td className="py-2 pr-4 text-foreground">{license.status}</td>
                    <td className="py-2 pr-4 text-foreground">
                      {formatEur("de", license.amountTotal / 100)}
                    </td>
                    <td className="py-2 text-muted">{license.workspaceId ? "Ja" : "Nein (alt/anonym)"}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted">
                      Noch keine Lizenzen.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
