"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search, X } from "lucide-react";
import clsx from "clsx";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="flex items-center gap-3 border-b border-border bg-surface/60 px-4 py-3 backdrop-blur-xl lg:px-6">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-border p-2 text-muted hover:text-foreground lg:hidden"
          aria-label="Menü öffnen"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Suche nach Inhalten, Projekten, Kampagnen …"
            className="w-full rounded-lg border border-border bg-surface-2 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="relative rounded-lg border border-border p-2 text-muted hover:text-foreground"
            aria-label="Benachrichtigungen"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-2" />
          </button>
          <div className="hidden items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted sm:flex">
            🇩🇪 DE
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-3 to-accent text-xs font-semibold text-white">
            MM
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
              <span className="font-semibold">SECRET 58</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Menü schließen">
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
                    {item.label}
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
