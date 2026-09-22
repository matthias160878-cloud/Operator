"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Brain } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import clsx from "clsx";

export function Sidebar() {
  const t = useTranslations("common");
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-surface/60 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-2 shadow-[0_0_20px_rgba(109,91,255,0.45)]">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold tracking-wide text-foreground">{t("appName")}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted">
            {t("appTagline")}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/15 text-foreground border border-accent/30"
                  : "text-muted hover:bg-surface-2 hover:text-foreground border border-transparent"
              )}
            >
              <Icon className={clsx("h-4 w-4", active && "text-accent-2")} />
              {t(`nav.${item.labelKey}`)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4 space-y-3">
        <div className="card relative flex flex-col items-center gap-3 overflow-hidden p-5 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(109,91,255,0.25),transparent_65%)]" />
          <div className="relative h-16 w-16 overflow-hidden rounded-full shadow-[0_0_30px_rgba(109,91,255,0.5)]">
            <Image
              src="/brand/brain-core.png"
              alt="SECRET 58"
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <p className="relative text-xs leading-snug text-muted">
            {t("sidebar.footerLine1")}
            <br />
            {t("sidebar.footerLine2")}
          </p>
          <p className="relative text-[11px] font-semibold tracking-[0.2em] text-foreground">
            {t("appName")}
          </p>
        </div>

        <div className="card p-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="status-dot bg-success" />
            {t("sidebar.workspace")}
          </div>
          <div className="mt-1 text-sm font-medium text-foreground">Secret 58 Media</div>
        </div>
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-3 to-accent text-xs font-semibold text-white">
            MM
          </div>
          <div className="leading-tight">
            <div className="text-sm text-foreground">Max Mustermann</div>
            <div className="text-xs text-muted">{t("sidebar.role")}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
