"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Copy, Trash2 } from "lucide-react";
import type { ContentItem } from "@prisma/client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PLATFORM_LABELS } from "@/lib/format";

export function ContentItemsTable({ items }: { items: ContentItem[] }) {
  const router = useRouter();
  const t = useTranslations("contentFactory");

  async function duplicate(id: string) {
    const res = await fetch(`/api/content-items/${id}/duplicate`, { method: "POST" });
    if (res.ok) router.refresh();
  }

  async function remove(id: string) {
    if (!confirm(t("table.confirmDelete"))) return;
    const res = await fetch(`/api/content-items/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-muted">
        {t("table.empty")}
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th className="px-4 py-3 font-medium">{t("table.title")}</th>
            <th className="px-4 py-3 font-medium">{t("table.platform")}</th>
            <th className="px-4 py-3 font-medium">{t("table.format")}</th>
            <th className="px-4 py-3 font-medium">{t("table.status")}</th>
            <th className="px-4 py-3 font-medium">{t("table.updated")}</th>
            <th className="px-4 py-3 font-medium text-right">{t("table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/60">
              <td className="px-4 py-3">
                <Link href={`/content-factory/${item.id}`} className="text-foreground hover:text-accent-2">
                  {item.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted">{PLATFORM_LABELS[item.platform] ?? item.platform}</td>
              <td className="px-4 py-3 text-muted">{item.format || "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3 text-muted">
                {new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(
                  item.updatedAt
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => duplicate(item.id)}
                    className="rounded-lg border border-border p-1.5 text-muted hover:text-foreground"
                    title={t("table.duplicate")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="rounded-lg border border-border p-1.5 text-muted hover:text-danger"
                    title={t("table.delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
