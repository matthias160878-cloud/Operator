import Image from "next/image";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { isPackagePriceConfigured, getConfiguredPrice, isSetupServiceConfigured } from "@/lib/stripe";
import { formatSetupServicePrice, formatEur, AUTOPILOT_TIERS } from "@/lib/pricing";
import { PACKAGES, PACKAGE_IDS, formatPackagePriceEur, type PackageId } from "@/lib/packages";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { BuyButton } from "@/components/buy/BuyButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "SECRET 58 — Pro & Maxi",
    description: "Zwei Pakete, ein Komplettumfang: SECRET 58 Pro und Maxi.",
  };
}

export default async function BuyPage() {
  const localeRaw = await getLocale();
  const locale = isLocale(localeRaw) ? localeRaw : DEFAULT_LOCALE;
  const t = await getTranslations("buy");
  const features = t.raw("features") as string[];

  const packageData = await Promise.all(
    PACKAGE_IDS.map(async (id) => {
      const pkg = PACKAGES[id];
      const configured = isPackagePriceConfigured(id);
      const configuredPrice = await getConfiguredPrice(id, locale);
      const priceDisplay = configuredPrice?.formatted ?? formatPackagePriceEur(id, locale);
      return { id, pkg, configured, configuredPrice, priceDisplay };
    })
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-grid px-4 py-12">
      <div className="mx-auto max-w-4xl text-center">
        <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full shadow-[0_0_40px_rgba(109,91,255,0.5)]">
          <Image src="/brand/brain-core.png" alt="SECRET 58" fill sizes="96px" className="object-cover" priority />
        </div>
        <div className="text-xs uppercase tracking-[0.25em] text-accent-2">{t("kicker")}</div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">SECRET 58 — Pro & Maxi</h1>
        <p className="mt-3 text-base font-medium text-accent-2">{t("claim")}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2">
        {packageData.map(({ id, pkg, configured, configuredPrice, priceDisplay }) => (
          <div key={id} className="card relative overflow-hidden p-8 text-center">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent-2/20 blur-3xl" />

            <div className="relative">
              <h2 className="text-xl font-semibold text-foreground">{pkg.name}</h2>

              <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left text-sm text-foreground">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
                <li className="flex items-start gap-2 border-t border-border pt-2 mt-2 text-muted">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-2" />
                  {t("packageQuota", {
                    ideas: pkg.quotas.ideasPerMonth,
                    videos: pkg.quotas.videosPerMonth,
                    voice: pkg.quotas.voiceGenerationsPerMonth,
                  })}
                </li>
              </ul>

              <div className="mt-6 text-3xl font-semibold text-foreground">
                {priceDisplay}
                <span className="ml-1 text-sm font-normal text-muted">{t("priceOnetime")}</span>
              </div>
              {!configuredPrice && (
                <p className="mt-1 text-xs text-muted">{t("priceRecommendedNote")}</p>
              )}

              <div className="mt-6 flex justify-center">
                <BuyButton
                  packageId={id as PackageId}
                  configured={configured}
                  priceDisplay={priceDisplay}
                  setupServiceAvailable={isSetupServiceConfigured()}
                  setupServicePrice={formatSetupServicePrice(locale)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mx-auto max-w-xl text-center text-xs text-muted">{t("costDisclosure")}</p>

      <section className="w-full max-w-4xl text-center">
        <div className="text-xs uppercase tracking-[0.25em] text-accent-2">{t("autopilot.kicker")}</div>
        <h2 className="mt-2 text-xl font-semibold text-foreground">{t("autopilot.title")}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">{t("autopilot.subtitle")}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {AUTOPILOT_TIERS.map((tier) => (
            <div key={tier.key} className="card p-5 text-left">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">{t(`autopilot.tiers.${tier.key}`)}</h3>
                <span className="shrink-0 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                  {t("autopilot.comingSoon")}
                </span>
              </div>
              <div className="mt-3 text-2xl font-semibold text-foreground">
                {formatEur(locale, tier.priceEur)}
                <span className="ml-1 text-sm font-normal text-muted">{t("autopilot.perMonth")}</span>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-foreground">
                <li>{t("autopilot.brands", { count: tier.brands })}</li>
                <li>{t("autopilot.ideas", { count: tier.ideas })}</li>
                <li>{t("autopilot.videos", { count: tier.videos })}</li>
                <li>{t("autopilot.voiceMinutes", { count: tier.voiceMinutes })}</li>
              </ul>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-xs text-muted">{t("autopilot.note")}</p>
      </section>
    </div>
  );
}
