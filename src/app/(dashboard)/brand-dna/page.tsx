import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { BrandForm } from "@/components/brand-dna/BrandForm";

export const dynamic = "force-dynamic";

export default async function BrandDnaPage() {
  const t = await getTranslations("brandDna");
  const workspaceId = await getCurrentWorkspaceId();
  const brand = await prisma.brand.findUnique({ where: { workspaceId } });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>
      <BrandForm brand={brand} />
    </div>
  );
}
