import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { NewContentItemForm } from "@/components/content-factory/NewContentItemForm";
import { ContentItemsTable } from "@/components/content-factory/ContentItemsTable";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { value: undefined, label: "Alle" },
  { value: "DRAFT", label: "Entwurf" },
  { value: "IN_REVIEW", label: "In Prüfung" },
  { value: "APPROVED", label: "Freigegeben" },
  { value: "SCHEDULED", label: "Geplant" },
  { value: "PUBLISHED", label: "Veröffentlicht" },
  { value: "ARCHIVED", label: "Archiviert" },
];

export default async function ContentFactoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const workspaceId = await getCurrentWorkspaceId();

  const items = await prisma.contentItem.findMany({
    where: { workspaceId, ...(status ? { status: status as never } : {}) },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Content Factory</h1>
          <p className="mt-1 text-sm text-muted">
            Alle Content-Items an einem Ort — erstellen, duplizieren, umschreiben, mit
            Voiceover/Untertiteln anreichern und durch den Freigabe-Workflow schleusen.
          </p>
        </div>
        <NewContentItemForm />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/content-factory?status=${tab.value}` : "/content-factory"}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs",
              status === tab.value || (!status && !tab.value)
                ? "border-accent bg-accent/15 text-foreground"
                : "border-border bg-surface-2 text-muted"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <ContentItemsTable items={items} />
    </div>
  );
}
