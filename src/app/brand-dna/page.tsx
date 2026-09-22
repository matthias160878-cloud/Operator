import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { BrandForm } from "@/components/brand-dna/BrandForm";

export const dynamic = "force-dynamic";

export default async function BrandDnaPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const brand = await prisma.brand.findUnique({ where: { workspaceId } });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Brand / Content DNA</h1>
        <p className="mt-1 text-sm text-muted">
          Deine Marke. Dein Stil. Überall. Diese Angaben fließen automatisch in Content
          Brain, Script-, Hook- und Hashtag-Agent ein.
        </p>
      </div>
      <BrandForm brand={brand} />
    </div>
  );
}
