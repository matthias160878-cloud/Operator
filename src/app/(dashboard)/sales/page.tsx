import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { formatCents } from "@/lib/plans";
import { getMerchantBalance, isConnectConfigured } from "@/lib/connect/merchant";
import { SalesClient } from "@/components/sales/SalesClient";
import { SellerLegalForm } from "@/components/sales/SellerLegalForm";
import { sellerProfileMissing } from "@/lib/connect/sellerProfile";

export const dynamic = "force-dynamic";

/**
 * Eigene Geschäftseinnahmen des Kunden — strikt getrennt von den
 * Paketzahlungen an den Betreiber. Beträge je Währung getrennt.
 */
export default async function SalesPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const [merchant, products, sales, sellerProfile] = await Promise.all([
    prisma.merchantAccount.findUnique({ where: { workspaceId } }),
    prisma.merchantProduct.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } }),
    prisma.customerSale.findMany({ where: { workspaceId }, orderBy: { occurredAt: "desc" }, take: 100 }),
    prisma.sellerProfile.findUnique({ where: { workspaceId } }),
  ]);
  const sellerMissing = sellerProfileMissing(sellerProfile);

  const totals = new Map<string, { gross: number; refunded: number }>();
  for (const s of sales) {
    if (s.status === "FAILED" || s.status === "PENDING") continue;
    const key = `${s.currency}${s.isTestData ? " (Test)" : ""}`;
    const t = totals.get(key) ?? { gross: 0, refunded: 0 };
    t.gross += s.amount;
    t.refunded += s.refundedAmount;
    totals.set(key, t);
  }

  let balance: Awaited<ReturnType<typeof getMerchantBalance>> | null = null;
  if (merchant && isConnectConfigured()) {
    try {
      balance = await getMerchantBalance(merchant.stripeAccountId);
    } catch {
      balance = null;
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Verkauf &amp; Shop</h1>
        <p className="mt-1 text-sm text-muted">
          Deine eigenen Geschäftseinnahmen. Sie sind getrennt von deinem SECRET-58-Paket — ein gekauftes Paket erzeugt
          keine Einnahmen. Gezählt werden nur tatsächliche Verkäufe; Testdaten sind gekennzeichnet.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-foreground">Summen je Währung</h2>
        {totals.size === 0 ? (
          <p className="mt-2 text-sm text-muted">Noch keine Verkäufe.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {[...totals.entries()].map(([key, t]) => (
              <li key={key}>
                {key.toUpperCase()}: {formatCents(t.gross, key.slice(0, 3))} brutto
                {t.refunded > 0 ? `, davon erstattet ${formatCents(t.refunded, key.slice(0, 3))}` : ""}
              </li>
            ))}
          </ul>
        )}
        {balance && (
          <p className="mt-3 text-xs text-muted">
            Stripe-Guthaben deines Händlerkontos — verfügbar:{" "}
            {balance.available.map((b) => formatCents(b.amount, b.currency)).join(", ") || "0"} · ausstehend:{" "}
            {balance.pending.map((b) => formatCents(b.amount, b.currency)).join(", ") || "0"}. Auszahlungen auf dein
            Bankkonto erfolgen durch Stripe nach deinem dort eingestellten Auszahlungsplan.
          </p>
        )}
      </section>

      <SellerLegalForm
        missing={sellerMissing}
        initial={{
          anbieter: sellerProfile?.anbieter ?? "",
          firma: sellerProfile?.firma ?? "",
          anschrift: sellerProfile?.anschrift ?? "",
          email: sellerProfile?.email ?? "",
          telefon: sellerProfile?.telefon ?? "",
          ustId: sellerProfile?.ustId ?? "",
          register: sellerProfile?.register ?? "",
          aufsicht: sellerProfile?.aufsicht ?? "",
          verantwortlich: sellerProfile?.verantwortlich ?? "",
          agbUrl: sellerProfile?.agbUrl ?? "",
          datenschutzUrl: sellerProfile?.datenschutzUrl ?? "",
          widerrufUrl: sellerProfile?.widerrufUrl ?? "",
        }}
      />

      <SalesClient
        connectConfigured={isConnectConfigured()}
        merchant={
          merchant && {
            chargesEnabled: merchant.chargesEnabled,
            payoutsEnabled: merchant.payoutsEnabled,
            detailsSubmitted: merchant.detailsSubmitted,
            requirementsDue: JSON.parse(merchant.requirementsDue) as string[],
          }
        }
        products={products.map((p) => ({ id: p.id, name: p.name, price: formatCents(p.amount, p.currency), active: p.active }))}
      />

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-foreground">Letzte Verkäufe</h2>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {sales.length === 0 && (
              <tr>
                <td className="text-muted">Keine Einträge.</td>
              </tr>
            )}
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="py-1.5">{s.occurredAt.toLocaleDateString("de-DE")}</td>
                <td>{s.productName || "—"}</td>
                <td>{formatCents(s.amount, s.currency)}</td>
                <td className="text-xs text-muted">
                  {s.source === "IMPORT_CSV" ? "Import" : "SECRET 58 Shop"} · {s.status}
                  {s.isTestData ? " · Test" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
