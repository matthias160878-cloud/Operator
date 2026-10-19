import { getTranslations } from "next-intl/server";
import { SeoAnalyzer } from "@/components/seo/SeoAnalyzer";

export default async function SeoPage() {
  const t = await getTranslations("seo");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("subtitle")}</p>
      </div>
      <SeoAnalyzer />
    </div>
  );
}
