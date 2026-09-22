import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import clsx from "clsx";
import { getAllIntegrationStatuses } from "@/lib/integrations/registry";
import {
  API_KEY_SIGNUP_LINKS,
  RENDER_ENV_DASHBOARD_URL,
  INTEGRATION_PRICING,
  type PricingModel,
} from "@/lib/integrations/links";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { IntegrationCategory } from "@/lib/integrations/types";

const PRICING_STYLES: Record<PricingModel, string> = {
  free: "bg-success/15 text-success border-success/30",
  payAsYouGo: "bg-warning/15 text-warning border-warning/30",
  subscription: "bg-warning/15 text-warning border-warning/30",
  unknown: "bg-muted/15 text-muted border-border",
};

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const t = await getTranslations("integrations");
  const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
    AI: t("categories.AI"),
    VOICE: t("categories.VOICE"),
    PLATFORM: t("categories.PLATFORM"),
    DESIGN: t("categories.DESIGN"),
    VIDEO: t("categories.VIDEO"),
    TREND: t("categories.TREND"),
  };
  const ti = await getTranslations("common.integrationStatus");
  const statuses = await getAllIntegrationStatuses(ti);
  const byCategory = new Map<IntegrationCategory, typeof statuses>();
  for (const s of statuses) {
    const list = byCategory.get(s.category) ?? [];
    list.push(s);
    byCategory.set(s.category, list);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("description")}</p>
        <p className="mt-1 text-xs text-muted">{t("costNote")}</p>
      </div>

      {Array.from(byCategory.entries()).map(([category, items]) => (
        <div key={category} className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">{CATEGORY_LABELS[category]}</h2>
          <div className="space-y-2">
            {items.map((integ) => {
              const signupUrl = API_KEY_SIGNUP_LINKS[integ.key];
              const pricing = INTEGRATION_PRICING[integ.key];
              return (
                <div
                  key={integ.key}
                  className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{integ.name}</span>
                      {pricing && (
                        <span
                          className={clsx(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            PRICING_STYLES[pricing.model]
                          )}
                        >
                          {t(`pricing.${pricing.model}`)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">{integ.message}</div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {integ.status === "NOT_CONFIGURED" && signupUrl && (
                        <a
                          href={signupUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-accent-2 hover:underline"
                        >
                          {t("links.getKey")} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {integ.status === "NOT_CONFIGURED" && (
                        <a
                          href={RENDER_ENV_DASHBOARD_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-accent-2 hover:underline"
                        >
                          {t("links.setInRender")} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {pricing?.pricingUrl && (
                        <a
                          href={pricing.pricingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-muted hover:text-accent-2 hover:underline"
                        >
                          {t("links.viewPricing")} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={integ.status} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
