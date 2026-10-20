/**
 * Eigene Zugänge eines Kunden (Workspace): welche Dienste es gibt, welche
 * Felder sie brauchen und wo der Kunde den Schlüssel bekommt. Reine Daten,
 * auch im Browser nutzbar.
 */
export interface ZugangFeld {
  key: string;
  label: string;
  geheim: boolean;
  platzhalter: string;
  muster: RegExp;
  musterHinweis: string;
}

export type AnbieterKey = "RESEND" | "ANTHROPIC" | "OPENAI" | "GEMINI";

export interface ZugangAnbieter {
  key: AnbieterKey;
  art: "EMAIL" | "KI";
  name: string;
  wofuer: string;
  felder: ZugangFeld[];
  schritte: { text: string; link?: { href: string; label: string } }[];
  preise: { href: string; text: string };
  hinweise: string[];
}

/** „Name <adresse@domain.tld>“ oder nur „adresse@domain.tld“. */
export const ABSENDER_MUSTER = /^(?:[^<>\r\n]{1,80}\s<)?[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})>?$/;

export function absenderDomain(absender: string): string | null {
  const m = absender.trim().match(ABSENDER_MUSTER);
  return m ? m[1].toLowerCase() : null;
}

const KI_HINWEISE = [
  "Ein KI-Zugang reicht. Sind mehrere eingetragen, nutzt die App zuerst Anthropic, dann OpenAI, dann Gemini.",
  "Der Schlüssel wird verschlüsselt gespeichert, gilt nur für diesen Workspace und wird nie wieder angezeigt (nur die letzten vier Zeichen).",
  "Kosten entstehen nur bei Ihrem KI-Anbieter nach dessen Preisen; SECRET 58 berechnet dafür nichts. Legen Sie dort am besten ein Ausgabenlimit fest.",
  "Ohne eigenen KI-Zugang arbeitet die App mit gekennzeichneten Vorlagen (Template-Modus).",
  "Datenschutz: Mit Ihrem KI-Anbieter schließen Sie selbst die Auftragsverarbeitung (Data Processing Addendum) ab; geben Sie keine besonders sensiblen Daten ein.",
];

export const ZUGANG_ANBIETER: Record<AnbieterKey, ZugangAnbieter> = {
  RESEND: {
    key: "RESEND",
    art: "EMAIL",
    name: "Resend (E-Mail-Versand)",
    wofuer: "Newsletter: Bestätigungs-Mails (Double-Opt-in) und Ausgaben an Ihre bestätigten Kontakte – über Ihr eigenes Resend-Konto und Ihre eigene Absenderdomain.",
    felder: [
      { key: "apiKey", label: "Resend API-Schlüssel", geheim: true, platzhalter: "re_…", muster: /^re_[A-Za-z0-9_]{8,}$/, musterHinweis: "beginnt mit „re_“" },
      {
        key: "absender",
        label: "Absender",
        geheim: false,
        platzhalter: "Ihre Firma <newsletter@news.ihre-firma.de>",
        muster: ABSENDER_MUSTER,
        musterHinweis: "E-Mail-Adresse Ihrer bei Resend bestätigten Domain, optional mit Namen: Firma <adresse@domain.de>",
      },
    ],
    schritte: [
      { text: "Konto bei Resend anlegen.", link: { href: "https://resend.com/signup", label: "resend.com/signup" } },
      {
        text: "Domains → „Add Domain“: eigene (Sub-)Domain eintragen, z. B. news.ihre-firma.de. Die angezeigten DNS-Einträge (SPF, DKIM) beim Domain-Anbieter setzen und warten, bis die Domain „Verified“ ist. Zusätzlich einen DMARC-Eintrag anlegen: TXT-Eintrag „_dmarc.ihre-firma.de“ mit dem Wert „v=DMARC1; p=none;“ – Gmail und Yahoo verlangen ihn.",
        link: { href: "https://resend.com/domains", label: "resend.com/domains" },
      },
      {
        text: "API Keys → „Create API Key“: Berechtigung „Sending access“ wählen, auf Ihre Domain beschränken, Schlüssel (re_…) kopieren. Er wird nur einmal angezeigt.",
        link: { href: "https://resend.com/api-keys", label: "resend.com/api-keys" },
      },
      { text: "Schlüssel und Absender hier eintragen und „Speichern und prüfen“ klicken." },
    ],
    preise: { href: "https://resend.com/pricing", text: "Preise bei Resend (kostenloser Einstieg mit Tageslimit)" },
    hinweise: [
      "Der Schlüssel wird verschlüsselt gespeichert, gilt nur für diesen Workspace und wird nie wieder angezeigt (nur die letzten vier Zeichen).",
      "Kosten und Versandlimits richten sich nach Ihrem Resend-Tarif. SECRET 58 berechnet dafür nichts.",
      "Versendet wird nur an Personen, die sich selbst angemeldet und per Link bestätigt haben. Jede E-Mail enthält Ihren Abmeldelink (auch per Ein-Klick) und Ihre Anbieterangaben.",
    ],
  },
  ANTHROPIC: {
    key: "ANTHROPIC",
    art: "KI",
    name: "Anthropic (Claude)",
    wofuer: "KI-Texte in der App: Content Brain, Ideen, Skripte, Hooks, Hashtags, Antwortentwürfe und der Chat-Assistent auf Ihrer Webseite.",
    felder: [{ key: "apiKey", label: "Anthropic API-Schlüssel", geheim: true, platzhalter: "sk-ant-…", muster: /^sk-ant-[A-Za-z0-9_-]{20,}$/, musterHinweis: "beginnt mit „sk-ant-“" }],
    schritte: [
      { text: "Konto in der Anthropic Console anlegen.", link: { href: "https://console.anthropic.com/", label: "console.anthropic.com" } },
      { text: "Unter Billing Guthaben aufladen und ein Ausgabenlimit setzen – ohne Guthaben lehnt Anthropic Anfragen ab.", link: { href: "https://console.anthropic.com/settings/billing", label: "Billing" } },
      { text: "Unter API Keys → „Create Key“ einen Schlüssel erstellen und kopieren (sk-ant-…).", link: { href: "https://console.anthropic.com/settings/keys", label: "console.anthropic.com/settings/keys" } },
      { text: "Schlüssel hier eintragen und „Speichern und prüfen“ klicken." },
    ],
    preise: { href: "https://www.anthropic.com/pricing", text: "Preise bei Anthropic" },
    hinweise: KI_HINWEISE,
  },
  OPENAI: {
    key: "OPENAI",
    art: "KI",
    name: "OpenAI (GPT)",
    wofuer: "Alternative oder Ersatz für Anthropic – dieselben KI-Funktionen der App.",
    felder: [{ key: "apiKey", label: "OpenAI API-Schlüssel", geheim: true, platzhalter: "sk-…", muster: /^sk-(?!ant-)[A-Za-z0-9_-]{20,}$/, musterHinweis: "beginnt mit „sk-“ (z. B. sk-proj-…)" }],
    schritte: [
      { text: "Konto auf der OpenAI-Plattform anlegen.", link: { href: "https://platform.openai.com/signup", label: "platform.openai.com" } },
      { text: "Unter Billing Guthaben aufladen und ein Limit festlegen.", link: { href: "https://platform.openai.com/settings/organization/billing/overview", label: "Billing" } },
      { text: "Unter API keys → „Create new secret key“ einen Schlüssel erstellen und kopieren (sk-…).", link: { href: "https://platform.openai.com/api-keys", label: "platform.openai.com/api-keys" } },
      { text: "Schlüssel hier eintragen und „Speichern und prüfen“ klicken." },
    ],
    preise: { href: "https://openai.com/api/pricing/", text: "Preise bei OpenAI" },
    hinweise: KI_HINWEISE,
  },
  GEMINI: {
    key: "GEMINI",
    art: "KI",
    name: "Google Gemini",
    wofuer: "Alternative oder Ersatz für Anthropic und OpenAI – dieselben KI-Funktionen der App.",
    felder: [{ key: "apiKey", label: "Gemini API-Schlüssel", geheim: true, platzhalter: "AIza…", muster: /^AIza[0-9A-Za-z_-]{30,}$/, musterHinweis: "beginnt mit „AIza“" }],
    schritte: [
      { text: "In Google AI Studio mit Ihrem Google-Konto anmelden.", link: { href: "https://aistudio.google.com/", label: "aistudio.google.com" } },
      { text: "Abrechnung (Cloud Billing) für das Projekt aktivieren. Wichtig: Im kostenlosen Tarif darf Google Eingaben zur Verbesserung seiner Produkte verwenden – für Kundendaten nur den kostenpflichtigen Tarif nutzen." },
      { text: "„Get API key“ → „Create API key“ und den Schlüssel kopieren (AIza…).", link: { href: "https://aistudio.google.com/apikey", label: "aistudio.google.com/apikey" } },
      { text: "Schlüssel hier eintragen und „Speichern und prüfen“ klicken." },
    ],
    preise: { href: "https://ai.google.dev/gemini-api/docs/pricing", text: "Preise der Gemini API" },
    hinweise: KI_HINWEISE,
  },
};

/** Werbeplattformen: keine Schlüssel nötig – Pläne werden exportiert und selbst im Werbekonto angelegt. */
export const WERBE_WEGWEISER = [
  { name: "Meta (Facebook/Instagram)", href: "https://adsmanager.facebook.com/", label: "Meta Werbeanzeigenmanager" },
  { name: "Google Ads (YouTube)", href: "https://ads.google.com/", label: "Google Ads" },
  { name: "LinkedIn", href: "https://www.linkedin.com/campaignmanager/", label: "LinkedIn Campaign Manager" },
  { name: "TikTok", href: "https://ads.tiktok.com/", label: "TikTok Ads Manager" },
];

export function zugangFehler(anbieter: ZugangAnbieter, werte: Record<string, unknown>): string | null {
  for (const f of anbieter.felder) {
    const v = typeof werte[f.key] === "string" ? (werte[f.key] as string).trim() : "";
    if (!v) return `Bitte „${f.label}“ angeben.`;
    if (v.length > 300 || !f.muster.test(v)) return `„${f.label}“: ${f.musterHinweis}.`;
  }
  return null;
}
