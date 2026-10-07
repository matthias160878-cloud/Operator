import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { randomBytes } from "node:crypto";

/**
 * "Meine Webseite verbinden": Domainprüfung und Ursprungs-Regeln.
 *
 * Freigegebene Assistenten: derzeit nur "CHAT" — ein Webseiten-Chat, der
 * ausschließlich öffentliche Markenangaben (Name, Beschreibung, Tonalität)
 * kennt. Private Inhalte des Arbeitsbereichs (Ideen, Skripte, Nachrichten,
 * Dateien, Einnahmen) sind für das Widget nicht erreichbar.
 *
 * Ein Telefonassistent ist etwas anderes und hier NICHT umgesetzt: Er braucht
 * eine Telefonie-Anbindung, Rufnummern und eigene Einwilligungs- und
 * Datenschutzabläufe.
 */
export const ALLOWED_ASSISTANTS = ["CHAT"] as const;
export type AssistantKind = (typeof ALLOWED_ASSISTANTS)[number];

export const VERIFY_PATH = "/.well-known/secret58-verify.txt";

export function newPublicKey(): string {
  return `s58w_${randomBytes(18).toString("base64url")}`;
}

export function newVerifyToken(): string {
  return `secret58-verify=${randomBytes(18).toString("base64url")}`;
}

/** Nur https (http nur für localhost außerhalb der Produktion); liefert "https://host[:port]". */
export function normalizeOrigin(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim().includes("://") ? input.trim() : `https://${input.trim()}`);
  } catch {
    return null;
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const allowLocalHttp = process.env.NODE_ENV !== "production" || process.env.ALLOW_PRIVATE_SITE_FETCH === "true";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local && allowLocalHttp)) {
    return null;
  }
  if (url.username || url.password) return null;
  if (!url.hostname.includes(".") && !local) return null;
  return url.origin;
}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6.startsWith("::ffff:");
}

/**
 * Holt eine kleine Textdatei von der Kundendomain. Schutz vor
 * Server-Side-Request-Forgery: keine internen Adressen, keine Weiterleitungen,
 * Zeitlimit, Größenlimit. ALLOW_PRIVATE_SITE_FETCH nur für lokale Tests.
 */
export async function fetchFromSite(origin: string, path: string, maxBytes = 200_000): Promise<string | null> {
  const url = new URL(path, origin);
  if (process.env.ALLOW_PRIVATE_SITE_FETCH !== "true") {
    const addresses = await lookup(url.hostname, { all: true }).catch(() => []);
    if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) return null;
  }
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } catch {
    return null;
  }
}

export async function verifyDomain(origin: string, token: string): Promise<boolean> {
  const body = await fetchFromSite(origin, VERIFY_PATH, 10_000);
  return body !== null && body.split(/\r?\n/).some((line) => line.trim() === token);
}

/** Prüft, ob die Startseite das Einbindungs-Skript mit genau diesem Schlüssel enthält. */
export async function embedPresent(origin: string, publicKey: string): Promise<boolean> {
  const html = await fetchFromSite(origin, "/");
  return html !== null && html.includes(`data-secret58-key="${publicKey}"`);
}

export function embedCode(appOrigin: string, publicKey: string): string {
  return `<script src="${appOrigin}/widget.js" data-secret58-key="${publicKey}" async></script>`;
}
