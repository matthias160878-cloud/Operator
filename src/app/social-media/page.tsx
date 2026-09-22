import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { checkIntegration, INTEGRATIONS } from "@/lib/integrations/registry";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PlatformGlyph, type PlatformGlyphKey } from "@/components/dashboard/PlatformGlyph";
import { PLATFORM_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

const PLATFORM_INTEGRATION_KEY: Record<string, string> = {
  YOUTUBE: "youtube",
  INSTAGRAM: "instagram",
  TIKTOK: "tiktok",
  LINKEDIN: "linkedin",
  FACEBOOK: "facebook",
};

export default async function SocialMediaPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const accounts = await prisma.platformAccount.findMany({
    where: { workspaceId },
    orderBy: { platform: "asc" },
  });

  const credentialStatuses = await Promise.all(
    INTEGRATIONS.filter((i) => Object.values(PLATFORM_INTEGRATION_KEY).includes(i.key)).map(
      (i) => checkIntegration(i)
    )
  );
  const credentialByKey = new Map(credentialStatuses.map((s) => [s.key, s]));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Social Media</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Plattform-Accounts und ihr Verbindungsstatus. Zugangsdaten werden ausschließlich als
          Server-seitige Environment-Variablen verwaltet, niemals im Frontend gespeichert.
          Ein echter OAuth-Login-Flow ist je Plattform vorbereitet, aber noch nicht
          implementiert — sobald App-Zugangsdaten hinterlegt sind, kann er hier ergänzt werden.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {accounts.map((acc) => {
          const credKey = PLATFORM_INTEGRATION_KEY[acc.platform];
          const cred = credKey ? credentialByKey.get(credKey) : undefined;
          return (
            <div key={acc.id} className="card space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={
                      "flex h-9 w-9 items-center justify-center rounded-full border " +
                      (acc.status === "CONNECTED"
                        ? "border-success/50 bg-success/15 text-success"
                        : "border-border bg-surface-2 text-muted grayscale")
                    }
                  >
                    <PlatformGlyph platform={acc.platform as PlatformGlyphKey} className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {PLATFORM_LABELS[acc.platform] ?? acc.platform}
                  </h3>
                </div>
                <StatusBadge status={acc.status} />
              </div>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted">App-Zugangsdaten</dt>
                  <dd>
                    <StatusBadge status={cred?.status ?? "NOT_CONFIGURED"} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Account</dt>
                  <dd className="text-foreground">{acc.accountName || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Letzte Veröffentlichung</dt>
                  <dd className="text-foreground">
                    {acc.lastPublishedAt
                      ? new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(
                          acc.lastPublishedAt
                        )
                      : "—"}
                  </dd>
                </div>
                {acc.lastError && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Letzter Fehler</dt>
                    <dd className="text-danger">{acc.lastError}</dd>
                  </div>
                )}
              </dl>
              <button
                disabled
                title="OAuth-Flow noch nicht implementiert"
                className="w-full cursor-not-allowed rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted"
              >
                {acc.status === "CONNECTED" ? "Verbunden" : "Verbinden (noch nicht verfügbar)"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
