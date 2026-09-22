import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getMonthGrid, isSameDay } from "@/lib/calendarGrid";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PLATFORM_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; platform?: string }>;
}) {
  const t = await getTranslations("calendar");
  const locale = await getLocale();
  const WEEKDAYS = t.raw("weekdays") as string[];
  const MONTH_NAMES = t.raw("months") as string[];
  const { year: yearParam, month: monthParam, platform } = await searchParams;
  const now = new Date();
  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const month = monthParam ? Number(monthParam) - 1 : now.getMonth();

  const workspaceId = await getCurrentWorkspaceId();
  const weeks = getMonthGrid(year, month);
  const rangeStart = weeks[0][0].date;
  const rangeEnd = weeks[weeks.length - 1][6].date;

  const items = await prisma.contentItem.findMany({
    where: {
      workspaceId,
      scheduledAt: { gte: rangeStart, lte: rangeEnd },
      ...(platform ? { platform: platform as never } : {}),
    },
    orderBy: { scheduledAt: "asc" },
  });

  const prevDate = new Date(year, month - 1, 1);
  const nextDate = new Date(year, month + 1, 1);
  const today = new Date();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?year=${prevDate.getFullYear()}&month=${prevDate.getMonth() + 1}`}
            className="rounded-lg border border-border p-2 text-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[140px] text-center text-sm font-medium text-foreground">
            {MONTH_NAMES[month]} {year}
          </span>
          <Link
            href={`/calendar?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}`}
            className="rounded-lg border border-border p-2 text-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/calendar?year=${year}&month=${month + 1}`}
          className={clsx(
            "rounded-full border px-3 py-1 text-xs",
            !platform ? "border-accent bg-accent/15 text-foreground" : "border-border bg-surface-2 text-muted"
          )}
        >
          {t("allPlatforms")}
        </Link>
        {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/calendar?year=${year}&month=${month + 1}&platform=${key}`}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs",
              platform === key ? "border-accent bg-accent/15 text-foreground" : "border-border bg-surface-2 text-muted"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border text-center text-xs text-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="border-r border-border py-2 last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.flat().map((day, idx) => {
            const dayItems = items.filter((i) => i.scheduledAt && isSameDay(i.scheduledAt, day.date));
            return (
              <div
                key={idx}
                className={clsx(
                  "min-h-[110px] border-b border-r border-border p-1.5 last:border-r-0",
                  !day.inCurrentMonth && "bg-surface-2/40",
                  isSameDay(day.date, today) && "bg-accent/5"
                )}
              >
                <div
                  className={clsx(
                    "text-[11px]",
                    day.inCurrentMonth ? "text-foreground" : "text-muted/50",
                    isSameDay(day.date, today) && "font-semibold text-accent-2"
                  )}
                >
                  {day.date.getDate()}
                </div>
                <div className="mt-1 space-y-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href={`/content-factory/${item.id}`}
                      className="block truncate rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-foreground hover:border-accent/40"
                      title={item.title}
                    >
                      {item.title}
                    </Link>
                  ))}
                  {dayItems.length > 3 && (
                    <div className="text-[10px] text-muted">{t("moreItems", { count: dayItems.length - 3 })}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("listTitle")}</h3>
        <div className="space-y-2">
          {items.length === 0 && <p className="text-xs text-muted">{t("emptyMonth")}</p>}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
              <div>
                <Link href={`/content-factory/${item.id}`} className="text-foreground hover:text-accent-2">
                  {item.title}
                </Link>
                <div className="text-xs text-muted">
                  {PLATFORM_LABELS[item.platform] ?? item.platform} ·{" "}
                  {item.scheduledAt
                    ? new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(item.scheduledAt)
                    : "—"}
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
