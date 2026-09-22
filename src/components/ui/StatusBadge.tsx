import clsx from "clsx";

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
};

const STATUS_LABELS: Record<string, string> = {
  CONNECTED: "Verbunden",
  ACTIVE: "Aktiv",
  COMPLETED: "Abgeschlossen",
  RUNNING: "Läuft",
  SUCCESS: "Erfolgreich",
  PUBLISHED: "Veröffentlicht",
  APPROVED: "Freigegeben",
  SCHEDULED: "Geplant",
  WAITING: "Wartet",
  IN_REVIEW: "In Prüfung",
  NOT_CONFIGURED: "Nicht konfiguriert",
  IDLE: "Bereit",
  DRAFT: "Entwurf",
  ARCHIVED: "Archiviert",
  ERROR: "Fehler",
  REJECTED: "Abgelehnt",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-muted/15 text-muted border-border"
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
