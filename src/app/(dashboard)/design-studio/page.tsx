import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { checkIntegration, INTEGRATIONS } from "@/lib/integrations/registry";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ThumbnailGenerator } from "@/components/design-studio/ThumbnailGenerator";

export const dynamic = "force-dynamic";

export default async function DesignStudioPage() {
  const t = await getTranslations("designStudio");
  const workspaceId = await getCurrentWorkspaceId();
  const [images, canva] = await Promise.all([
    prisma.mediaAsset.findMany({
      where: { workspaceId, type: { in: ["IMAGE", "THUMBNAIL"] } },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    checkIntegration(INTEGRATIONS.find((i) => i.key === "canva")!),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="card flex items-center justify-between p-4">
        <div>
          <div className="text-sm font-medium text-foreground">Canva</div>
          <div className="text-xs text-muted">{canva.message}</div>
        </div>
        <StatusBadge status={canva.status} />
      </div>

      <ThumbnailGenerator />

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("imageAssetsTitle")}</h3>
        {images.length === 0 ? (
          <p className="text-xs text-muted">{t("imageAssetsEmpty")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.url} alt="" className="aspect-square w-full rounded-lg border border-border object-cover" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
