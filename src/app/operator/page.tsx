import { prisma } from "@/lib/db";
import { formatEur } from "@/lib/pricing";
import { PACKAGES, isPackageId, type PackageId } from "@/lib/packages";

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
  const [active, pending, refunded, uebernommen, recent] = await Promise.all([
    // Nur "stripe": "zentrale"-Lizenzen (Entitlement-Token-Übernahme aus
    // secret58-web, siehe src/app/entitlement/einloesen/route.ts) sind kein
    // eigener Verkauf hier und würden Umsatz/Verkaufszahlen sonst verzerren.
    prisma.license.findMany({
      where: { status: "ACTIVE", origin: "stripe" },
      select: { amountTotal: true, currency: true, packageId: true },
    }),
    prisma.license.count({ where: { status: "PENDING", origin: "stripe" } }),
    prisma.license.count({ where: { status: "REFUNDED", origin: "stripe" } }),
    prisma.license.count({ where: { status: "ACTIVE", origin: "zentrale" } }),
    prisma.license.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        customerEmail: true,
        status: true,
        packageId: true,
        amountTotal: true,
        currency: true,
        createdAt: true,
        workspaceId: true,
        origin: true,
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

  // Aufschlüsselung nach Paket (Pro/Maxi) — nur aktive, nicht erstattete
  // Lizenzen zählen als Umsatz, genau wie bei der Gesamtsumme oben.
  const byPackage = new Map<PackageId | "unbekannt", { count: number; amountTotal: number }>();
  for (const license of active) {
    const key = isPackageId(license.packageId) ? license.packageId : "unbekannt";
    const entry = byPackage.get(key) ?? { count: 0, amountTotal: 0 };
    entry.count += 1;
    entry.amountTotal += license.amountTotal;
    byPackage.set(key, entry);
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-muted">Über die Zentrale übernommen</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{uebernommen}</p>
            <p className="mt-1 text-xs text-muted">
              Kein eigener Verkauf hier — Pro/Maxi wurde bei secret58-web bezahlt.
            </p>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-muted">Nach Paket (aktive Lizenzen)</p>
          {byPackage.size === 0 ? (
            <p className="mt-2 text-sm text-muted">Noch keine aktiven Lizenzen.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(["pro", "maxi", "unbekannt"] as const)
                .filter((key) => byPackage.has(key))
                .map((key) => {
                  const entry = byPackage.get(key)!;
                  const name = key === "unbekannt" ? "Unbekannt (Alt-Lizenz)" : PACKAGES[key].name;
                  return (
                    <div key={key} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{entry.count}</p>
                      <p className="text-xs text-muted">{formatEur("de", entry.amountTotal / 100)}</p>
                    </div>
                  );
                })}
            </div>
          )}
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
                  <th className="pb-2 pr-4">Paket</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Betrag</th>
                  <th className="pb-2 pr-4">Herkunft</th>
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
                    <td className="py-2 pr-4 text-foreground">
                      {isPackageId(license.packageId) ? PACKAGES[license.packageId].name : "—"}
                    </td>
                    <td className="py-2 pr-4 text-foreground">{license.status}</td>
                    <td className="py-2 pr-4 text-foreground">
                      {formatEur("de", license.amountTotal / 100)}
                    </td>
                    <td className="py-2 pr-4 text-muted">
                      {license.origin === "zentrale" ? "Zentrale" : "Stripe"}
                    </td>
                    <td className="py-2 text-muted">{license.workspaceId ? "Ja" : "Nein (alt/anonym)"}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-muted">
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
