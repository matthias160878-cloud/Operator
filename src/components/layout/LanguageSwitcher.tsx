"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const t = useTranslations("common.topbar");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function selectLocale(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-label={t("language")}
        aria-expanded={open}
        className="hidden items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-foreground sm:flex disabled:opacity-60"
      >
        {LOCALE_LABELS[locale].flag} {locale.toUpperCase()}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => selectLocale(code)}
                className={clsx(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-surface-2",
                  code === locale ? "text-foreground" : "text-muted"
                )}
              >
                <span>{LOCALE_LABELS[code].flag}</span>
                <span>{LOCALE_LABELS[code].name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
