import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import clsx from "clsx";
import type { SetupGuide as SetupGuideData } from "@/lib/integrations/setup";
import { CopyValue } from "@/components/integrations/CopyValue";
import { VerifyButton } from "@/components/integrations/VerifyButton";

interface Props {
  guide: SetupGuideData;
  portalUrl?: string;
  envDashboardUrl: string;
}

/**
 * Aufklappbarer Einrichtungs-Assistent je Integration: welche Variablen
 * fehlen (nur Namen), welche Redirect-URL ins Entwicklerportal gehört und ein
 * Prüfknopf. Schlüssel werden hier weder angezeigt noch entgegengenommen.
 */
export async function SetupGuide({ guide, portalUrl, envDashboardUrl }: Props) {
  const t = await getTranslations("integrations.setup");
  const missing = guide.envVars.filter((v) => !v.set && !v.optional).length;

  return (
    <details className="group mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs">
      <summary className="cursor-pointer select-none text-foreground">
        {t("toggle")}
        {missing > 0 && <span className="ml-2 text-warning">{t("missingCount", { count: missing })}</span>}
      </summary>

      <div className="mt-3 space-y-3">
        <section>
          <div className="mb-1 font-medium text-foreground">{t("envTitle")}</div>
          <ul className="space-y-1">
            {guide.envVars.map((v) => (
              <li key={v.name} className="flex items-center gap-2">
                <span
                  className={clsx("inline-block h-2 w-2 rounded-full", v.set ? "bg-success" : "bg-warning")}
                  aria-hidden
                />
                <code className="text-foreground">{v.name}</code>
                <span className="text-muted">
                  {v.set ? t("envSet") : t("envMissing")}
                  {v.optional && ` · ${t("optional")}`}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {portalUrl && (
              <a href={portalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent-2 hover:underline">
                {t("openPortal")} <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <a href={envDashboardUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent-2 hover:underline">
              {t("openEnvDashboard")} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="mt-1.5 text-muted">{t("localHint")}</p>
        </section>

        {guide.redirects.length > 0 && (
          <section>
            <div className="mb-1 font-medium text-foreground">{t("redirectTitle")}</div>
            <div className="space-y-1.5">
              {guide.redirects.map((r) => (
                <div key={r.platformKey}>
                  {r.messaging && <div className="mb-0.5 text-muted">{t("redirectMessaging")}</div>}
                  <CopyValue value={r.url} />
                </div>
              ))}
            </div>
            {!guide.encryptionKeySet && <p className="mt-1.5 text-warning">{t("encryptionNote")}</p>}
            <p className="mt-1.5 text-muted">{t("connectHint")}</p>
          </section>
        )}

        <section>
          <VerifyButton integrationKey={guide.key} />
          {!guide.liveCheck && <p className="mt-1 text-muted">{t("noLiveCheckHint")}</p>}
        </section>
      </div>
    </details>
  );
}
