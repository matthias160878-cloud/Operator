export const LOCALES = [
  "de", "en", "fr", "es",
  "bg", "hr", "cs", "da", "nl", "et", "fi", "el", "hu", "ga", "it", "lv", "lt", "mt",
  "pl", "pt", "ro", "sk", "sl", "sv",
  "no", "is", "uk", "ru", "tr", "sq", "sr", "mk", "bs", "ca",
] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_COOKIE_NAME = "s58_locale";

export const LOCALE_LABELS: Record<Locale, { flag: string; name: string }> = {
  de: { flag: "🇩🇪", name: "Deutsch" },
  en: { flag: "🇬🇧", name: "English" },
  fr: { flag: "🇫🇷", name: "Français" },
  es: { flag: "🇪🇸", name: "Español" },
  bg: { flag: "🇧🇬", name: "Български" },
  hr: { flag: "🇭🇷", name: "Hrvatski" },
  cs: { flag: "🇨🇿", name: "Čeština" },
  da: { flag: "🇩🇰", name: "Dansk" },
  nl: { flag: "🇳🇱", name: "Nederlands" },
  et: { flag: "🇪🇪", name: "Eesti" },
  fi: { flag: "🇫🇮", name: "Suomi" },
  el: { flag: "🇬🇷", name: "Ελληνικά" },
  hu: { flag: "🇭🇺", name: "Magyar" },
  ga: { flag: "🇮🇪", name: "Gaeilge" },
  it: { flag: "🇮🇹", name: "Italiano" },
  lv: { flag: "🇱🇻", name: "Latviešu" },
  lt: { flag: "🇱🇹", name: "Lietuvių" },
  mt: { flag: "🇲🇹", name: "Malti" },
  pl: { flag: "🇵🇱", name: "Polski" },
  pt: { flag: "🇵🇹", name: "Português" },
  ro: { flag: "🇷🇴", name: "Română" },
  sk: { flag: "🇸🇰", name: "Slovenčina" },
  sl: { flag: "🇸🇮", name: "Slovenščina" },
  sv: { flag: "🇸🇪", name: "Svenska" },
  no: { flag: "🇳🇴", name: "Norsk" },
  is: { flag: "🇮🇸", name: "Íslenska" },
  uk: { flag: "🇺🇦", name: "Українська" },
  ru: { flag: "🇷🇺", name: "Русский" },
  tr: { flag: "🇹🇷", name: "Türkçe" },
  sq: { flag: "🇦🇱", name: "Shqip" },
  sr: { flag: "🇷🇸", name: "Српски" },
  mk: { flag: "🇲🇰", name: "Македонски" },
  bs: { flag: "🇧🇦", name: "Bosanski" },
  ca: { flag: "🇦🇩", name: "Català" },
};

/** Sprachcode für die Browser-Vorlesestimme (Web Speech API). */
export const SPEECH_LANG: Partial<Record<Locale, string>> = { no: "nb-NO" };
export function speechLang(locale: Locale): string {
  return SPEECH_LANG[locale] ?? locale;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Ordnet den Accept-Language-Header (Browser/Land-Einstellung des Besuchers)
 * einer unterstützten Sprache zu — reines Best-effort-Raten beim ersten
 * Besuch, solange noch kein manuelles Cookie gesetzt ist.
 */
export function resolveLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const preferred = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const tag of preferred) {
    const raw = tag.split("-")[0];
    const base = raw === "nb" || raw === "nn" ? "no" : raw;
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
