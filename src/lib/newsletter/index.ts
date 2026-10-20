import { createHash, randomBytes } from "crypto";
import { escapeHtml } from "@/lib/email";

/** Wortlaut der Einwilligung auf der Startseite (als Nachweis gespeichert). */
export const NEWSLETTER_CONSENT_TEXT =
  "Ich möchte den Newsletter erhalten und bin mit der Verarbeitung meiner E-Mail-Adresse dafür einverstanden. Abmeldung jederzeit möglich.";

export const CONFIRM_TTL_MS = 48 * 60 * 60 * 1000;

export function newToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function confirmationMail(confirmUrl: string, unsubscribeUrl: string) {
  const text =
    "Guten Tag,\n\n" +
    "bitte bestätigen Sie Ihre Anmeldung zum Newsletter von Secret 58:\n" +
    `${confirmUrl}\n\n` +
    "Der Link ist 48 Stunden gültig. Wenn Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail einfach; " +
    "ohne Bestätigung erhalten Sie nichts von uns.\n\n" +
    `Abmelden können Sie sich jederzeit hier: ${unsubscribeUrl}\n\n` +
    "Secret 58 · Spittelweg 5 · 79730 Murg";
  const html =
    `<p>Guten Tag,</p><p>bitte bestätigen Sie Ihre Anmeldung zum Newsletter von Secret 58:</p>` +
    `<p><a href="${escapeHtml(confirmUrl)}">Anmeldung bestätigen</a></p>` +
    `<p>Der Link ist 48 Stunden gültig. Wenn Sie sich nicht angemeldet haben, ignorieren Sie diese E-Mail einfach; ` +
    `ohne Bestätigung erhalten Sie nichts von uns.</p>` +
    `<p style="font-size:12px;color:#666">Abmelden: <a href="${escapeHtml(unsubscribeUrl)}">${escapeHtml(unsubscribeUrl)}</a><br>Secret 58 · Spittelweg 5 · 79730 Murg</p>`;
  return { subject: "Bitte bestätigen Sie Ihre Newsletter-Anmeldung", text, html };
}

/** Kleine Antwortseite im Stil der Zentrale (für Bestätigen/Abmelden per Link). */
export function resultPage(title: string, text: string): Response {
  const body = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${escapeHtml(title)} — Secret 58</title><link rel="stylesheet" href="/zentrale/assets/seite.css"></head>
<body><main class="wrap seite-inhalt"><p class="brotkrumen"><a href="/">Start</a> / Newsletter</p><h1>${escapeHtml(title)}</h1>
<p class="lead">${escapeHtml(text)}</p><p><a href="/">Zur Startseite</a></p></main></body></html>`;
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
