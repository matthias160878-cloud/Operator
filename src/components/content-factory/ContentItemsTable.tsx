"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import type { ContentItem } from "@prisma/client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PLATFORM_LABELS } from "@/lib/format";

export function ContentItemsTable({ items }: { items: ContentItem[] }) {
  const router = useRouter();

  async function duplicate(id: string) {
    const res = await fetch(`/api/content-items/${id}/duplicate`, { method: "POST" });
    if (res.ok) router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Content-Item wirklich löschen?")) return;
    const res = await fetch(`/api/content-items/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-muted">
        Noch keine Content-Items — erstelle eines manuell oder über Content Brain.
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th className="px-4 py-3 font-medium">Titel</th>
            <th className="px-4 py-3 font-medium">Plattform</th>
            <th className="px-4 py-3 font-medium">Format</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Aktualisiert</th>
            <th className="px-4 py-3 font-medium text-right">Aktionen</th>
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
                    title="Duplizieren"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="rounded-lg border border-border p-1.5 text-muted hover:text-danger"
                    title="Löschen"
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
