import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { ContentItemDetail } from "@/components/content-factory/ContentItemDetail";

export const dynamic = "force-dynamic";

export default async function ContentItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.contentItem.findFirst({
    where: { id, workspaceId: await getCurrentWorkspaceId() },
    include: { scripts: true, mediaAssets: true },
  });

  if (!item) notFound();

  const t = await getTranslations("contentFactory");
  const locale = await getLocale();
  const lastJob = await prisma.publishJob.findFirst({
    where: { contentItemId: item.id },
    orderBy: { createdAt: "desc" },
  });
  const jobTone: Record<string, string> = {
    QUEUED: "border-accent/40 bg-accent/10 text-foreground",
    RUNNING: "border-accent/40 bg-accent/10 text-foreground",
    SUCCEEDED: "border-success/40 bg-success/10 text-success",
    FAILED: "border-danger/40 bg-danger/10 text-danger",
    UNKNOWN: "border-warning/40 bg-warning/10 text-warning",
    CANCELED: "border-border bg-surface-2 text-muted",
  };

  return (
    <div className="space-y-5">
      <Link href="/content-factory" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("detail.backLink")}
      </Link>
      <h1 className="text-xl font-semibold text-foreground">{item.title}</h1>
      {lastJob && (
        <div role="status" className={`rounded-lg border px-4 py-2 text-sm ${jobTone[lastJob.status] ?? jobTone.CANCELED}`}>
          {t(`detail.job.${lastJob.status}` as "detail.job.QUEUED", {
            when: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(lastJob.scheduledFor),
          })}
          {lastJob.message && lastJob.status !== "QUEUED" ? ` ${lastJob.message}` : ""}
        </div>
      )}
      <ContentItemDetail item={item} />
    </div>
  );
}
