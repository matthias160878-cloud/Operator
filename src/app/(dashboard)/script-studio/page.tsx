import { getTranslations } from "next-intl/server";
import { ScriptStudio } from "@/components/script-studio/ScriptStudio";

export default async function ScriptStudioPage() {
  const t = await getTranslations("scriptStudio");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>
      <ScriptStudio />
    </div>
  );
}
