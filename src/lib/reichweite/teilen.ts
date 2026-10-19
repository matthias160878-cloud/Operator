/**
 * Offizielle Teilen-Adressen der Plattformen. Sie öffnen nur das jeweilige
 * Teilen-Fenster; die Person wählt Empfänger selbst aus. Ob danach wirklich
 * geteilt wurde, erfährt die App nicht — deshalb wird ein geöffneter
 * Teilen-Dialog nie als Weiterempfehlung gezählt.
 */
export interface TeilenZiel {
  key: string;
  label: string;
  href: string;
}

export function teilenZiele(url: string, text: string): TeilenZiel[] {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const tu = encodeURIComponent(text ? `${text} ${url}` : url);
  return [
    { key: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${tu}` },
    { key: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
    { key: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "linkedin", label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: "x", label: "X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { key: "email", label: "E-Mail", href: `mailto:?subject=${t}&body=${tu}` },
  ];
}

/** Öffentliche Adresse eines Empfehlungslinks. */
export function empfehlungsUrl(basis: string, code: string): string {
  return `${basis.replace(/\/$/, "")}/e/${code}`;
}
