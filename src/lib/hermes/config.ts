/**
 * Hermes-Anbindung (Nous Research „Hermes Agent“, OpenAI-kompatibler API-Server).
 * Alles ist standardmäßig AUS. Zwei getrennte Profile:
 *  - Pilot (intern, nur Betreiber): HERMES_PILOT_ENABLED, HERMES_API_URL, HERMES_API_KEY, HERMES_MODEL
 *  - Öffentlicher Besucherchat: HERMES_PUBLIC_*  (eigener Dienst, eigener Schlüssel)
 * Schlüssel werden nur auf dem Server gelesen und nie an den Browser gegeben.
 */
const isTrue = (v: string | undefined) => (v ?? "").trim().toLowerCase() === "true";

/** Erlaubt: https; http nur für Loopback in Test/Entwicklung (oder mit ALLOW_PRIVATE_SITE_FETCH). Keine Zugangsdaten in der URL. */
export function parseHermesUrl(raw: string | undefined): URL | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password || url.search || url.hash) return null;
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (url.protocol === "https:") return url;
  if (url.protocol === "http:" && loopback && (process.env.NODE_ENV !== "production" || process.env.ALLOW_PRIVATE_SITE_FETCH === "true")) return url;
  return null;
}

export interface HermesProfile {
  baseUrl: string; // ohne abschließenden Schrägstrich
  key: string;
  model: string;
}

export type PilotState =
  | { ok: true; profile: HermesProfile }
  | { ok: false; missing: string[] };

export function pilotState(): PilotState {
  const missing: string[] = [];
  if (!isTrue(process.env.HERMES_PILOT_ENABLED)) missing.push("HERMES_PILOT_ENABLED=true");
  const url = parseHermesUrl(process.env.HERMES_API_URL);
  if (!url) missing.push("HERMES_API_URL (https)");
  const key = (process.env.HERMES_API_KEY ?? "").trim();
  if (!key) missing.push("HERMES_API_KEY");
  const model = (process.env.HERMES_MODEL ?? "").trim() || "hermes-agent";
  if (missing.length || !url) return { ok: false, missing };
  return { ok: true, profile: { baseUrl: url.toString().replace(/\/+$/, ""), key, model } };
}

export type PublicState =
  | { ok: true; profile: HermesProfile; rateSecret: string; dailyLimit: number }
  | { ok: false; missing: string[] };

/** Öffentlicher Chat: nur wenn ALLE Bedingungen erfüllt sind (sonst bleibt er aus). */
export function publicState(): PublicState {
  const missing: string[] = [];
  if (!isTrue(process.env.HERMES_PUBLIC_CHAT_ENABLED)) missing.push("HERMES_PUBLIC_CHAT_ENABLED=true");
  if (!isTrue(process.env.HERMES_PUBLIC_CHAT_PRIVACY_APPROVED)) missing.push("HERMES_PUBLIC_CHAT_PRIVACY_APPROVED=true (Datenschutzhinweis ergänzt)");
  if (!isTrue(process.env.HERMES_PUBLIC_TOOLS_ATTESTED)) missing.push("HERMES_PUBLIC_TOOLS_ATTESTED=true (Profil ohne Werkzeuge geprüft)");
  const url = parseHermesUrl(process.env.HERMES_PUBLIC_API_URL);
  if (!url) missing.push("HERMES_PUBLIC_API_URL (https)");
  const key = (process.env.HERMES_PUBLIC_API_KEY ?? "").trim();
  if (!key) missing.push("HERMES_PUBLIC_API_KEY");
  const model = (process.env.HERMES_PUBLIC_MODEL ?? "").trim() || "hermes-agent";
  const rateSecret = (process.env.HERMES_PUBLIC_RATE_LIMIT_SECRET ?? "").trim();
  if (rateSecret.length < 16) missing.push("HERMES_PUBLIC_RATE_LIMIT_SECRET (mind. 16 Zeichen)");
  // Getrennter Dienst/Profil und getrennter Schlüssel zum internen Pilot.
  const pilotUrl = parseHermesUrl(process.env.HERMES_API_URL);
  if (url && pilotUrl && url.toString().replace(/\/+$/, "") === pilotUrl.toString().replace(/\/+$/, "")) missing.push("HERMES_PUBLIC_API_URL muss sich von HERMES_API_URL unterscheiden (eigener Dienst/Profil)");
  if (key && key === (process.env.HERMES_API_KEY ?? "").trim()) missing.push("HERMES_PUBLIC_API_KEY muss sich von HERMES_API_KEY unterscheiden");
  const limit = Number(process.env.HERMES_PUBLIC_DAILY_LIMIT ?? "300");
  const dailyLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 5000) : 300;
  if (missing.length || !url) return { ok: false, missing };
  return { ok: true, profile: { baseUrl: url.toString().replace(/\/+$/, ""), key, model }, rateSecret, dailyLimit };
}
