import Link from "next/link";
import clsx from "clsx";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { NewContentItemForm } from "@/components/content-factory/NewContentItemForm";
import { ContentItemsTable } from "@/components/content-factory/ContentItemsTable";

export const dynamic = "force-dynamic";

const STATUS_TAB_VALUES = [
  undefined,
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

const STATUS_TAB_KEYS: Record<string, string> = {
  DRAFT: "draft",
  IN_REVIEW: "inReview",
  APPROVED: "approved",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

export default async function ContentFactoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const workspaceId = await getCurrentWorkspaceId();
  const t = await getTranslations("contentFactory");

  const items = await prisma.contentItem.findMany({
    where: { workspaceId, ...(status ? { status: status as never } : {}) },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <NewContentItemForm />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TAB_VALUES.map((value) => (
          <Link
            key={value ?? "all"}
            href={value ? `/content-factory?status=${value}` : "/content-factory"}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs",
              status === value || (!status && !value)
                ? "border-accent bg-accent/15 text-foreground"
                : "border-border bg-surface-2 text-muted"
            )}
          >
            {value ? t(`statusTabs.${STATUS_TAB_KEYS[value]}`) : t("statusTabs.all")}
          </Link>
        ))}
      </div>

      <ContentItemsTable items={items} />
    </div>
  );
}
