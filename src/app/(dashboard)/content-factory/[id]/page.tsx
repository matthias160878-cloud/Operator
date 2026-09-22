import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { ContentItemDetail } from "@/components/content-factory/ContentItemDetail";

export const dynamic = "force-dynamic";

export default async function ContentItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.contentItem.findUnique({
    where: { id },
    include: { scripts: true, mediaAssets: true },
  });

  if (!item) notFound();

  const t = await getTranslations("contentFactory");

  return (
    <div className="space-y-5">
      <Link href="/content-factory" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("detail.backLink")}
      </Link>
      <h1 className="text-xl font-semibold text-foreground">{item.title}</h1>
      <ContentItemDetail item={item} />
    </div>
  );
}
