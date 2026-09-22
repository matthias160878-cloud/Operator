"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";

const STATUS_STYLES: Record<string, string> = {
  CONNECTED: "bg-success/15 text-success border-success/30",
  ACTIVE: "bg-accent-2/15 text-accent-2 border-accent-2/30",
  COMPLETED: "bg-success/15 text-success border-success/30",
  RUNNING: "bg-accent-2/15 text-accent-2 border-accent-2/30",
  SUCCESS: "bg-success/15 text-success border-success/30",
  PUBLISHED: "bg-success/15 text-success border-success/30",
  APPROVED: "bg-success/15 text-success border-success/30",
  SCHEDULED: "bg-accent/15 text-accent border-accent/30",
  WAITING: "bg-warning/15 text-warning border-warning/30",
  IN_REVIEW: "bg-warning/15 text-warning border-warning/30",
  NOT_CONFIGURED: "bg-warning/15 text-warning border-warning/30",
  IDLE: "bg-muted/15 text-muted border-border",
  DRAFT: "bg-muted/15 text-muted border-border",
  ARCHIVED: "bg-muted/15 text-muted border-border",
  ERROR: "bg-danger/15 text-danger border-danger/30",
  REJECTED: "bg-danger/15 text-danger border-danger/30",
  RECEIVED: "bg-success/15 text-success border-success/30",
  PENDING: "bg-warning/15 text-warning border-warning/30",
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("common.statusBadge");
  const hasLabel = t.has(status);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-muted/15 text-muted border-border"
      )}
    >
      {hasLabel ? t(status) : status}
    </span>
  );
}
