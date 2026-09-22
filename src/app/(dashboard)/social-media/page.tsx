import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { checkIntegration, INTEGRATIONS } from "@/lib/integrations/registry";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PlatformGlyph, type PlatformGlyphKey } from "@/components/dashboard/PlatformGlyph";
import { PLATFORM_LABELS } from "@/lib/format";
import { getProvider, isProviderConfigured } from "@/lib/oauth/providers";
import { isTokenEncryptionConfigured } from "@/lib/crypto";
import { DisconnectButton } from "@/components/social-media/DisconnectButton";

export const dynamic = "force-dynamic";

const PLATFORM_INTEGRATION_KEY: Record<string, string> = {
  YOUTUBE: "youtube",
  INSTAGRAM: "instagram",
  TIKTOK: "tiktok",
  LINKEDIN: "linkedin",
  FACEBOOK: "facebook",
};

export default async function SocialMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; oauth_error?: string; platform?: string }>;
}) {
  const { connected, oauth_error: oauthError, platform: errorPlatform } = await searchParams;
  const t = await getTranslations("socialMedia");
  const ti = await getTranslations("common.integrationStatus");
  const locale = await getLocale();
  const workspaceId = await getCurrentWorkspaceId();
  const accounts = await prisma.platformAccount.findMany({
    where: { workspaceId },
    orderBy: { platform: "asc" },
  });

  const credentialStatuses = await Promise.all(
    INTEGRATIONS.filter((i) => Object.values(PLATFORM_INTEGRATION_KEY).includes(i.key)).map(
      (i) => checkIntegration(i, ti)
    )
  );
  const credentialByKey = new Map(credentialStatuses.map((s) => [s.key, s]));
  const encryptionReady = isTokenEncryptionConfigured();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("pageTitle")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("subtitle")}</p>
      </div>

      {connected && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          {t("connectedBanner", { platform: PLATFORM_LABELS[connected] ?? connected })}
        </div>
      )}
      {oauthError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
          {oauthError === "not_configured" &&
            t("errorNotConfigured", { platform: PLATFORM_LABELS[errorPlatform ?? ""] ?? errorPlatform ?? "" })}
          {oauthError === "encryption_key_missing" && t("errorEncryptionMissing")}
          {oauthError === "denied" && t("errorDenied")}
          {oauthError === "invalid_state" && t("errorInvalidState")}
          {oauthError === "exchange_failed" && t("errorExchangeFailed")}
          {oauthError === "unknown_platform" && t("errorUnknownPlatform")}
        </div>
      )}
      {!encryptionReady && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning">
          {t("encryptionKeyMissingNotice")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {accounts.map((acc) => {
          const credKey = PLATFORM_INTEGRATION_KEY[acc.platform];
          const cred = credKey ? credentialByKey.get(credKey) : undefined;
          const provider = getProvider(acc.platform);
          const credentialsReady = provider ? isProviderConfigured(provider) : false;
          const canConnect = provider && credentialsReady && encryptionReady;

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
                  <dt className="text-muted">{t("credentialsLabel")}</dt>
                  <dd>
                    <StatusBadge status={cred?.status ?? "NOT_CONFIGURED"} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">{t("accountLabel")}</dt>
                  <dd className="text-foreground">{acc.accountName || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">{t("lastPublishedLabel")}</dt>
                  <dd className="text-foreground">
                    {acc.lastPublishedAt
                      ? new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(
                          acc.lastPublishedAt
                        )
                      : "—"}
                  </dd>
                </div>
                {acc.lastError && (
                  <div className="flex justify-between">
                    <dt className="text-muted">{t("lastErrorLabel")}</dt>
                    <dd className="text-danger">{acc.lastError}</dd>
                  </div>
                )}
              </dl>

              {acc.status === "CONNECTED" ? (
                <DisconnectButton accountId={acc.id} />
              ) : canConnect ? (
                <Link
                  href={`/api/oauth/${acc.platform}/start`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white"
                >
                  {t("connectButton")}
                </Link>
              ) : (
                <div className="space-y-1.5">
                  <button
                    disabled
                    title={!credentialsReady ? t("connectButtonTitleNoCreds") : t("connectButtonTitleNoEncryption")}
                    className="w-full cursor-not-allowed rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted"
                  >
                    {t("connectButtonUnavailable")}
                  </button>
                  {!credentialsReady && provider && (
                    <p className="text-[11px] text-muted">
                      {t("needsCredentialsNote", {
                        idVar: provider.clientIdEnv,
                        secretVar: provider.clientSecretEnv,
                      })}{" "}
                      <Link href="/integrations" className="inline-flex items-center gap-0.5 text-accent-2 hover:underline">
                        {t("goToIntegrations")} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </p>
                  )}
                </div>
              )}

              {provider?.publishingCaveat && (
                <p className="text-[11px] text-muted">{provider.publishingCaveat}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
