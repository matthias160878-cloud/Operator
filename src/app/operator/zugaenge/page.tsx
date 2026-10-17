import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canStoreSettings, operatorSettingsStatus } from "@/lib/operatorSettings";
import { ZugaengePanel } from "@/components/operator/ZugaengePanel";

export const dynamic = "force-dynamic";

export default async function ZugaengePage() {
  const user = await getSessionUser();
  if (!user?.isOperator) redirect("/");
  const zugaenge = await operatorSettingsStatus();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-accent-2">Betreiberbereich</div>
          <h1 className="text-xl font-semibold text-foreground">Zugänge</h1>
          <p className="mt-1 max-w-2xl text-xs text-muted">
            Schlüssel und Kennungen für Composio, KI, E-Mail und Stripe. Werte werden verschlüsselt auf dem Server
            gespeichert und sofort wirksam — kein Neustart, kein Render-Dashboard. Geheime Werte werden nach dem
            Speichern nicht mehr angezeigt. Vom Server selbst gesetzte Werte haben Vorrang und sind hier nicht änderbar.
          </p>
        </div>
        <Link href="/operator" className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground">
          Zurück zum Betreiberbereich
        </Link>
      </div>
      {!canStoreSettings() && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          Speichern in der App ist nicht möglich: Auf dem Server fehlt <code>TOKEN_ENCRYPTION_KEY</code>. Zugänge können
          dann nur im Hosting-Dashboard gesetzt werden.
        </div>
      )}
      <ZugaengePanel initial={zugaenge} speicherbar={canStoreSettings()} />
    </div>
  );
}
