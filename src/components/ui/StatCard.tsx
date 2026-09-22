import type { LucideIcon } from "lucide-react";

const ACCENT_CLASSES = {
  accent: "bg-accent/15 text-accent",
  "accent-2": "bg-accent-2/15 text-accent-2",
  "accent-3": "bg-accent-3/15 text-accent-3",
  success: "bg-success/15 text-success",
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  accent = "accent",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  accent?: keyof typeof ACCENT_CLASSES;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${ACCENT_CLASSES[accent]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {delta && (
          <span className="text-xs font-medium text-success">{delta}</span>
        )}
      </div>
      <div className="mt-3 text-xl font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
