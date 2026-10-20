import { prisma } from "@/lib/db";
import { decryptToken, encryptToken, isTokenEncryptionConfigured } from "@/lib/crypto";
import { SCHLUESSEL_SEITEN } from "@/lib/integrations/links";

/**
 * Zugänge, die der Betreiber in der App statt im Render-Dashboard hinterlegen
 * kann (Betreiberbereich → „Zugänge“). Werte liegen verschlüsselt in der
 * Datenbank (TOKEN_ENCRYPTION_KEY) und werden beim Start sowie nach jedem
 * Speichern in process.env übernommen, damit der übrige Code unverändert
 * weiter aus der Umgebung liest.
 *
 * Vorrang: Eine Variable, die der Server selbst mitbringt (Render →
 * Environment), gewinnt immer und ist in der App nicht änderbar. So kann ein
 * Betreiberkonto keinen vom Hoster gesetzten Live-Schlüssel überschreiben.
 *
 * Werte werden nie an den Browser gegeben (geheime gar nicht, andere nur zur
 * Anzeige), nie geloggt.
 */
export type SettingGroup = "composio" | "ki" | "email" | "zahlung" | "hermes";

export interface SettingDef {
  key: string;
  label: string;
  group: SettingGroup;
  /** Geheim: Eingabefeld maskiert, Wert wird nie zurückgegeben. */
  secret: boolean;
  hint: string;
  /** Prüfmuster für die Eingabe (nach trim). */
  pattern?: RegExp;
  patternHint?: string;
  /** Offizielle Seite des Anbieters, auf der man diesen Wert erstellt bzw. findet. */
  keyLink?: string;
}

export const SETTING_GROUPS: Record<SettingGroup, { title: string; text: string }> = {
  composio: {
    title: "Composio (Plattformen verbinden)",
    text: "Schlüssel aus platform.composio.dev → Settings → API Keys. Je Plattform eine Auth-Config-ID (ac_…) aus „Auth Configs“.",
  },
  ki: {
    title: "KI-Texte und Webseiten-Chat",
    text: "Anthropic (Claude), OpenAI (GPT) oder Google Gemini — einer reicht, mehrere sind Ersatz füreinander. Ohne Schlüssel arbeitet die App mit Vorlagen. Der Webseiten-Chat nutzt KI nur, wenn zusätzlich WEBSITE_KI auf „true“ steht.",
  },
  email: {
    title: "E-Mail (Newsletter-Bestätigung)",
    text: "Resend-Schlüssel und Absender. Die Absenderdomain muss bei Resend bestätigt sein. Erst dann erscheint das Newsletter-Formular.",
  },
  hermes: {
    title: "Hermes (interner Pilot und öffentlicher Besucherchat)",
    text: "Alles standardmäßig aus. Der öffentliche Chat braucht einen EIGENEN Hermes-Dienst/ein eigenes Profil ohne Werkzeuge und läuft erst nach Datenschutz-Freigabe, Bestätigung und bestandener Prüfung. Anleitung: docs/HERMES.md.",
  },
  zahlung: {
    title: "Zahlung (Stripe)",
    text: "Testmodus zuerst (sk_test_…). Preise müssen in Stripe als Nettopreise (Steuer exklusiv) in EUR angelegt sein; die App prüft Betrag und Intervall.",
  },
};

export const SETTINGS: SettingDef[] = [
  { key: "COMPOSIO_API_KEY", label: "Composio API-Schlüssel", group: "composio", secret: true, hint: "Beginnt meist mit „ak_“.", keyLink: SCHLUESSEL_SEITEN.composio },
  { key: "COMPOSIO_AUTH_CONFIG_LINKEDIN", label: "Auth-Config LinkedIn", group: "composio", secret: false, hint: "ac_…", pattern: /^ac_[A-Za-z0-9_-]{4,}$/, patternHint: "muss mit „ac_“ beginnen", keyLink: SCHLUESSEL_SEITEN.composio },
  { key: "COMPOSIO_AUTH_CONFIG_INSTAGRAM", label: "Auth-Config Instagram", group: "composio", secret: false, hint: "ac_…", pattern: /^ac_[A-Za-z0-9_-]{4,}$/, patternHint: "muss mit „ac_“ beginnen", keyLink: SCHLUESSEL_SEITEN.composio },
  { key: "COMPOSIO_AUTH_CONFIG_FACEBOOK", label: "Auth-Config Facebook", group: "composio", secret: false, hint: "ac_…", pattern: /^ac_[A-Za-z0-9_-]{4,}$/, patternHint: "muss mit „ac_“ beginnen", keyLink: SCHLUESSEL_SEITEN.composio },
  { key: "COMPOSIO_AUTH_CONFIG_YOUTUBE", label: "Auth-Config YouTube", group: "composio", secret: false, hint: "ac_…", pattern: /^ac_[A-Za-z0-9_-]{4,}$/, patternHint: "muss mit „ac_“ beginnen", keyLink: SCHLUESSEL_SEITEN.composio },
  { key: "COMPOSIO_AUTH_CONFIG_TIKTOK", label: "Auth-Config TikTok", group: "composio", secret: false, hint: "ac_… (braucht eigene TikTok-Entwickler-App mit Login Kit + Content Posting API)", pattern: /^ac_[A-Za-z0-9_-]{4,}$/, patternHint: "muss mit „ac_“ beginnen", keyLink: SCHLUESSEL_SEITEN.composio },
  { key: "COMPOSIO_USER_PREFIX", label: "Kundenkennung-Präfix", group: "composio", secret: false, hint: "z. B. s58test (Test) oder s58live (Betrieb)", pattern: /^[A-Za-z0-9-]{2,20}$/, patternHint: "nur Buchstaben, Ziffern, Bindestrich" },

  { key: "ANTHROPIC_API_KEY", label: "Anthropic API-Schlüssel (Claude)", group: "ki", secret: true, hint: "Beginnt mit „sk-ant-“. Wird bevorzugt genutzt.", pattern: /^sk-ant-[A-Za-z0-9_-]{10,}$/, patternHint: "muss mit „sk-ant-“ beginnen", keyLink: SCHLUESSEL_SEITEN.anthropic },
  { key: "OPENAI_API_KEY", label: "OpenAI API-Schlüssel (GPT)", group: "ki", secret: true, hint: "Beginnt mit „sk-“. Ersatz, wenn kein Anthropic-Schlüssel gesetzt ist.", pattern: /^sk-[A-Za-z0-9_-]{10,}$/, patternHint: "muss mit „sk-“ beginnen", keyLink: SCHLUESSEL_SEITEN.openai },
  { key: "GEMINI_API_KEY", label: "Google Gemini API-Schlüssel", group: "ki", secret: true, hint: "Beginnt mit „AIza“. Dritter Anbieter.", pattern: /^AIza[A-Za-z0-9_-]{20,}$/, patternHint: "muss mit „AIza“ beginnen", keyLink: SCHLUESSEL_SEITEN.gemini },
  { key: "GEMINI_MODEL", label: "Gemini-Modell", group: "ki", secret: false, hint: "leer = aktuelles Flash-Modell (gemini-flash-latest); z. B. gemini-3.5-flash", pattern: /^[a-z0-9.-]{3,60}$/, patternHint: "nur Kleinbuchstaben, Ziffern, Punkt, Bindestrich" },
  { key: "AI_PROVIDER", label: "Bevorzugter KI-Anbieter", group: "ki", secret: false, hint: "anthropic, openai oder gemini — leer = erster Anbieter mit Schlüssel", pattern: /^(anthropic|openai|gemini)$/, patternHint: "anthropic, openai oder gemini" },
  { key: "WEBSITE_KI", label: "Webseiten-Chat mit KI", group: "ki", secret: false, hint: "„true“ = an, leer = aus (Tageslimit WEBSITE_KI_TAGESLIMIT, Standard 200)", pattern: /^(true|false)$/, patternHint: "nur „true“ oder „false“" },

  { key: "HERMES_PILOT_ENABLED", label: "Hermes-Pilot (intern) an", group: "hermes", secret: false, hint: "„true“ schaltet den internen Pilot für Betreiber frei", pattern: /^(true|false)$/, patternHint: "nur „true“ oder „false“" },
  { key: "HERMES_API_URL", label: "Hermes-Pilot: Adresse", group: "hermes", secret: false, hint: "https://… (Hermes-API-Server, ggf. mit /p/<profil>)", pattern: /^https:\/\/[^\s?#@]+$/, patternHint: "https-Adresse ohne Zugangsdaten und Parameter" },
  { key: "HERMES_API_KEY", label: "Hermes-Pilot: Schlüssel", group: "hermes", secret: true, hint: "API_SERVER_KEY des internen Hermes-Dienstes" },
  { key: "HERMES_MODEL", label: "Hermes-Pilot: Modellname", group: "hermes", secret: false, hint: "leer = hermes-agent", pattern: /^[A-Za-z0-9._:\/-]{2,80}$/, patternHint: "Buchstaben, Ziffern, . _ : / -" },
  { key: "HERMES_PUBLIC_CHAT_ENABLED", label: "Hermes öffentlicher Chat an", group: "hermes", secret: false, hint: "„true“ — wirkt nur zusammen mit allen anderen Bedingungen", pattern: /^(true|false)$/, patternHint: "nur „true“ oder „false“" },
  { key: "HERMES_PUBLIC_CHAT_PRIVACY_APPROVED", label: "Datenschutzhinweis für Hermes ergänzt", group: "hermes", secret: false, hint: "„true“ erst, wenn der Datenschutzhinweis den eingesetzten Chat-/KI-Dienst nennt", pattern: /^(true|false)$/, patternHint: "nur „true“ oder „false“" },
  { key: "HERMES_PUBLIC_TOOLS_ATTESTED", label: "Öffentliches Profil ohne Werkzeuge geprüft", group: "hermes", secret: false, hint: "„true“ erst nach eigener Prüfung des Profils (kein Terminal, keine Dateien, kein Browser, kein Speicher)", pattern: /^(true|false)$/, patternHint: "nur „true“ oder „false“" },
  { key: "HERMES_PUBLIC_API_URL", label: "Hermes öffentlich: Adresse", group: "hermes", secret: false, hint: "https://… — anderer Dienst/anderes Profil als der Pilot", pattern: /^https:\/\/[^\s?#@]+$/, patternHint: "https-Adresse ohne Zugangsdaten und Parameter" },
  { key: "HERMES_PUBLIC_API_KEY", label: "Hermes öffentlich: Schlüssel", group: "hermes", secret: true, hint: "eigener API_SERVER_KEY, verschieden vom Pilot-Schlüssel" },
  { key: "HERMES_PUBLIC_MODEL", label: "Hermes öffentlich: Modellname", group: "hermes", secret: false, hint: "leer = hermes-agent", pattern: /^[A-Za-z0-9._:\/-]{2,80}$/, patternHint: "Buchstaben, Ziffern, . _ : / -" },
  { key: "HERMES_PUBLIC_RATE_LIMIT_SECRET", label: "Hermes öffentlich: Limit-Geheimnis", group: "hermes", secret: true, hint: "zufällig, mind. 16 Zeichen — damit Besucheradressen nur als Hash gezählt werden", pattern: /^[A-Za-z0-9_\-+=\/]{16,100}$/, patternHint: "mind. 16 Zeichen (Buchstaben, Ziffern, _ - + = /)" },

  { key: "RESEND_API_KEY", label: "Resend API-Schlüssel", group: "email", secret: true, hint: "Beginnt mit „re_“.", pattern: /^re_[A-Za-z0-9_-]{10,}$/, patternHint: "muss mit „re_“ beginnen", keyLink: SCHLUESSEL_SEITEN.resend },
  { key: "EMAIL_FROM", label: "Absender", group: "email", secret: false, hint: "z. B. SECRET 58 <newsletter@secret58.com>", pattern: /^[^<>@\s][^<>@]*<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$|^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/, patternHint: "Form: Name <adresse@domain.de> oder adresse@domain.de" },

  { key: "STRIPE_SECRET_KEY", label: "Stripe Secret Key", group: "zahlung", secret: true, hint: "sk_test_… (Test) oder sk_live_… (Betrieb)", pattern: /^sk_(test|live)_[A-Za-z0-9]{10,}$/, patternHint: "muss mit „sk_test_“ oder „sk_live_“ beginnen", keyLink: SCHLUESSEL_SEITEN.stripeSchluessel },
  { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe Webhook-Secret", group: "zahlung", secret: true, hint: "whsec_… — Webhook-Ziel: <Ihre Adresse>/api/stripe/webhook", pattern: /^whsec_[A-Za-z0-9]{10,}$/, patternHint: "muss mit „whsec_“ beginnen", keyLink: SCHLUESSEL_SEITEN.stripeWebhooks },
  { key: "STRIPE_PRICE_ID_PRO", label: "Preis-ID Pro monatlich (590 € netto)", group: "zahlung", secret: false, hint: "price_…", pattern: /^price_[A-Za-z0-9]{6,}$/, patternHint: "muss mit „price_“ beginnen", keyLink: SCHLUESSEL_SEITEN.stripeProdukte },
  { key: "STRIPE_PRICE_ID_MAXI", label: "Preis-ID Maxi monatlich (797 € netto)", group: "zahlung", secret: false, hint: "price_…", pattern: /^price_[A-Za-z0-9]{6,}$/, patternHint: "muss mit „price_“ beginnen", keyLink: SCHLUESSEL_SEITEN.stripeProdukte },
  { key: "STRIPE_PRICE_ID_PRO_YEAR", label: "Preis-ID Pro jährlich (6.018 € netto)", group: "zahlung", secret: false, hint: "price_…", pattern: /^price_[A-Za-z0-9]{6,}$/, patternHint: "muss mit „price_“ beginnen", keyLink: SCHLUESSEL_SEITEN.stripeProdukte },
  { key: "STRIPE_PRICE_ID_MAXI_YEAR", label: "Preis-ID Maxi jährlich (8.129,40 € netto)", group: "zahlung", secret: false, hint: "price_…", pattern: /^price_[A-Za-z0-9]{6,}$/, patternHint: "muss mit „price_“ beginnen", keyLink: SCHLUESSEL_SEITEN.stripeProdukte },
  { key: "PACKAGE_TERMS_CONFIRMED", label: "Paketkonditionen bestätigt (Verkauf freischalten)", group: "zahlung", secret: false, hint: "„true“ erst nach Abnahme — zusammen mit Stripe und Impressum öffnet das den Kauf.", pattern: /^(true|false)$/, patternHint: "nur „true“ oder „false“" },
];

const BY_KEY = new Map(SETTINGS.map((s) => [s.key, s]));

export function settingDef(key: string): SettingDef | null {
  return BY_KEY.get(key) ?? null;
}

/**
 * Prozessweiter Zustand (globalThis statt Modulvariablen): Next bündelt
 * Bibliotheksmodule je Route getrennt, ein Modul-Singleton wäre also pro
 * Route ein anderes — die Seite würde einen aus der DB übernommenen Wert
 * fälschlich für einen Server-Wert halten.
 */
interface State {
  /** Schlüssel, die der Server selbst mitbringt (vor dem ersten Übernehmen aus der DB). */
  platformKeys: Set<string>;
  /** Schlüssel, die aktuell aus der DB in process.env stehen. */
  appliedFromDb: Set<string>;
  initialized: boolean;
}
const g = globalThis as unknown as { __s58OperatorSettings?: State };
const state: State = (g.__s58OperatorSettings ??= { platformKeys: new Set(), appliedFromDb: new Set(), initialized: false });
const { platformKeys, appliedFromDb } = state;

function init() {
  if (state.initialized) return;
  for (const s of SETTINGS) if (process.env[s.key]?.trim()) platformKeys.add(s.key);
  state.initialized = true;
}

export function isPlatformManaged(key: string): boolean {
  init();
  return platformKeys.has(key);
}

export function canStoreSettings(): boolean {
  return isTokenEncryptionConfigured();
}

/**
 * Übernimmt alle in der App gespeicherten Zugänge in process.env — außer dort,
 * wo der Server den Wert selbst mitbringt. Idempotent; beim Start und nach
 * jedem Speichern aufrufen.
 */
export async function applyOperatorSettings(): Promise<void> {
  init();
  if (!canStoreSettings()) return;
  const rows = await prisma.operatorSecret.findMany();
  const seen = new Set<string>();
  for (const row of rows) {
    if (!BY_KEY.has(row.key) || platformKeys.has(row.key)) continue;
    try {
      process.env[row.key] = decryptToken(row.valueEnc);
      appliedFromDb.add(row.key);
      seen.add(row.key);
    } catch {
      console.error(`[zugaenge] ${row.key}: gespeicherter Wert lässt sich nicht entschlüsseln (TOKEN_ENCRYPTION_KEY geändert?).`);
    }
  }
  for (const key of appliedFromDb) {
    if (!seen.has(key)) {
      delete process.env[key];
      appliedFromDb.delete(key);
    }
  }
}

export interface SettingStatus {
  key: string;
  label: string;
  group: SettingGroup;
  secret: boolean;
  hint: string;
  source: "server" | "app" | "fehlt";
  updatedAt: string | null;
  /** Nur für nicht-geheime Werte aus der App. */
  value: string | null;
  keyLink: string | null;
}

export async function operatorSettingsStatus(): Promise<SettingStatus[]> {
  await applyOperatorSettings();
  const rows = canStoreSettings() ? await prisma.operatorSecret.findMany() : [];
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return SETTINGS.map((s) => {
    const row = byKey.get(s.key);
    const source: SettingStatus["source"] = platformKeys.has(s.key) ? "server" : row ? "app" : "fehlt";
    let value: string | null = null;
    if (source === "app" && !s.secret && row) {
      try {
        value = decryptToken(row.valueEnc);
      } catch {
        value = null;
      }
    }
    return {
      key: s.key,
      label: s.label,
      group: s.group,
      secret: s.secret,
      hint: s.hint,
      source,
      updatedAt: row?.updatedAt.toISOString() ?? null,
      value,
      keyLink: s.keyLink ?? null,
    };
  });
}

export class SettingError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

/**
 * Speichert oder löscht (leerer Wert) einen Zugang. Prüft Muster, verweigert
 * das Überschreiben vom Server gesetzter Werte und übernimmt sofort in
 * process.env. Protokolliert nur den Schlüsselnamen, nie den Wert.
 */
export async function saveOperatorSetting(input: {
  key: string;
  value: string;
  userId: string;
  workspaceId: string;
}): Promise<{ source: SettingStatus["source"] }> {
  init();
  const def = BY_KEY.get(input.key);
  if (!def) throw new SettingError("Unbekannter Zugang.", 400);
  if (!canStoreSettings()) {
    throw new SettingError("Speichern in der App ist nicht möglich: TOKEN_ENCRYPTION_KEY fehlt auf dem Server.", 503);
  }
  if (platformKeys.has(def.key)) {
    throw new SettingError("Dieser Wert ist in der Server-Umgebung gesetzt und kann nur dort geändert werden.", 409);
  }
  const value = input.value.trim().replace(/^["']|["']$/g, "");
  if (value.length > 500) throw new SettingError("Wert zu lang.", 400);

  if (!value) {
    await prisma.operatorSecret.deleteMany({ where: { key: def.key } });
    delete process.env[def.key];
    appliedFromDb.delete(def.key);
    await prisma.auditLog.create({
      data: { workspaceId: input.workspaceId, userId: input.userId, action: "operator.zugang.entfernt", detail: def.key },
    });
    afterChange(def.key);
    return { source: "fehlt" };
  }
  if (/\s/.test(value) && def.secret) throw new SettingError("Der Schlüssel enthält Leerzeichen — bitte vollständig und ohne Zeilenumbruch einfügen.", 400);
  if (def.pattern && !def.pattern.test(value)) {
    throw new SettingError(`Wert passt nicht: ${def.patternHint ?? "ungültiges Format"}.`, 400);
  }
  await prisma.operatorSecret.upsert({
    where: { key: def.key },
    create: { key: def.key, valueEnc: encryptToken(value), updatedById: input.userId },
    update: { valueEnc: encryptToken(value), updatedById: input.userId },
  });
  process.env[def.key] = value;
  appliedFromDb.add(def.key);
  await prisma.auditLog.create({
    data: { workspaceId: input.workspaceId, userId: input.userId, action: "operator.zugang.gesetzt", detail: def.key },
  });
  afterChange(def.key);
  return { source: "app" };
}

/** Zwischengespeicherte Clients verwerfen, damit der neue Wert sofort gilt. */
function afterChange(key: string) {
  if (key.startsWith("STRIPE_")) {
    // Lazy import vermeidet einen Zyklus (stripe.ts → plans.ts …).
    void import("@/lib/stripe").then((m) => m.resetStripeClient());
  }
}
