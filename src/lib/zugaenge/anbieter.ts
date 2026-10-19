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

export interface ZugangAnbieter {
  key: "RESEND";
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

export const ZUGANG_ANBIETER: Record<ZugangAnbieter["key"], ZugangAnbieter> = {
  RESEND: {
    key: "RESEND",
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
        text: "Domains → „Add Domain“: eigene (Sub-)Domain eintragen, z. B. news.ihre-firma.de. Die angezeigten DNS-Einträge (SPF, DKIM) beim Domain-Anbieter setzen und warten, bis die Domain „Verified“ ist.",
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
