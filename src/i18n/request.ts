import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  LOCALE_COOKIE_NAME,
  isLocale,
  resolveLocaleFromAcceptLanguage,
} from "@/i18n/config";

async function resolveLocale(): Promise<string> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  const headerStore = await headers();
  return resolveLocaleFromAcceptLanguage(headerStore.get("accept-language"));
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  const namespaces = [
    "common",
    "dashboard",
    "contentBrain",
    "brandDna",
    "ideas",
    "contentFactory",
    "scriptStudio",
    "voiceStudio",
    "videoStudio",
    "designStudio",
    "socialMedia",
    "calendar",
    "analytics",
    "growth",
    "revenue",
    "inbox",
    "agents",
    "integrations",
    "settings",
    "buy",
    "schulung",
    "chatbot",
  ];

  const messages: Record<string, unknown> = {};
  for (const ns of namespaces) {
    try {
      messages[ns] = (await import(`../../messages/${locale}/${ns}.json`)).default;
    } catch {
      // Namespace für diese Sprache noch nicht übersetzt — Fallback auf
      // Deutsch, statt die Seite mit fehlenden Keys abstürzen zu lassen.
      try {
        messages[ns] = (await import(`../../messages/de/${ns}.json`)).default;
      } catch {
        messages[ns] = {};
      }
    }
  }

  return { locale, messages };
});
