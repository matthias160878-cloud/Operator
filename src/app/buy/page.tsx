import Image from "next/image";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { isStripeConfigured, getConfiguredPrice } from "@/lib/stripe";
import { getPackageName, formatPackagePrice } from "@/lib/pricing";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { BuyButton } from "@/components/buy/BuyButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const localeRaw = await getLocale();
  const locale = isLocale(localeRaw) ? localeRaw : DEFAULT_LOCALE;
  const packageName = getPackageName(locale);
  const priceDisplay = formatPackagePrice(locale);
  return {
    title: `${packageName} — SECRET 58`,
    description: `${priceDisplay} — SECRET 58`,
  };
}

export default async function BuyPage() {
  const localeRaw = await getLocale();
  const locale = isLocale(localeRaw) ? localeRaw : DEFAULT_LOCALE;
  const t = await getTranslations("buy");
  const configured = isStripeConfigured();
  const configuredPrice = await getConfiguredPrice(locale);
  const packageName = getPackageName(locale);
  // Ein Paket, ein Preis, kein Staffelsystem: solange Stripe noch nicht
  // eingerichtet ist, zeigen wir den empfohlenen Preis als Ankündigung —
  // der Kaufen-Button bleibt trotzdem ehrlich deaktiviert, bis Stripe
  // wirklich konfiguriert ist.
  const priceDisplay = configuredPrice?.formatted ?? formatPackagePrice(locale);
  const features = t.raw("features") as string[];

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-4 py-12">
      <div className="card relative w-full max-w-xl overflow-hidden p-8 text-center">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent-2/20 blur-3xl" />

        <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full shadow-[0_0_40px_rgba(109,91,255,0.5)]">
          <Image src="/brand/brain-core.png" alt="SECRET 58" fill sizes="96px" className="object-cover" priority />
        </div>

        <div className="relative">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-2">{t("kicker")}</div>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            {t("title", { packageName })}
          </h1>
          <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>

          <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-foreground">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-6 text-3xl font-semibold text-foreground">
            {priceDisplay}
            <span className="ml-1 text-sm font-normal text-muted">{t("priceOnetime")}</span>
          </div>
          {!configuredPrice && (
            <p className="mt-1 text-xs text-muted">{t("priceRecommendedNote")}</p>
          )}

          <div className="mt-6 flex justify-center">
            <BuyButton configured={configured} priceDisplay={priceDisplay} />
          </div>

          <p className="mx-auto mt-4 max-w-sm text-xs text-muted">{t("costDisclosure")}</p>
        </div>
      </div>
    </div>
  );
}
