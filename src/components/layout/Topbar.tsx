"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, LogOut, Menu, Search, X } from "lucide-react";
import clsx from "clsx";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Topbar({ user }: { user: { name: string; email: string } }) {
  const t = useTranslations("common");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border bg-surface/60 px-4 py-3 backdrop-blur-xl lg:px-6">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-border p-2 text-muted hover:text-foreground lg:hidden"
          aria-label={t("topbar.menuOpen")}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder={t("topbar.searchPlaceholder")}
            className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-16 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted sm:block">
            ⌘K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="relative rounded-lg border border-border p-2 text-muted hover:text-foreground"
            aria-label={t("topbar.notifications")}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-2" />
          </button>
          <LanguageSwitcher />
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-3 to-accent text-xs font-semibold text-white"
              aria-label={user.name}
            >
              {initialsOf(user.name)}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-border bg-surface p-2 shadow-xl">
                  <div className="px-2 py-1.5">
                    <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-danger hover:bg-surface-2 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Abmelden
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex h-full w-72 flex-col bg-surface border-r border-border">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <span className="font-semibold">{t("appName")}</span>
              <button onClick={() => setMobileOpen(false)} aria-label={t("topbar.menuClose")}>
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                      active
                        ? "bg-accent/15 text-foreground border border-accent/30"
                        : "text-muted hover:bg-surface-2 hover:text-foreground border border-transparent"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t(`nav.${item.labelKey}`)}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
