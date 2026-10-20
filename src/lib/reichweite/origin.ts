import { headers } from "next/headers";

/** Öffentliche Adresse für Empfehlungslinks (PUBLIC_APP_URL hat Vorrang). */
export async function seitenOrigin(): Promise<string> {
  const configured = process.env.PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return /^[A-Za-z0-9.-]+(:\d+)?$/.test(host) ? `${proto}://${host}` : "http://localhost:3000";
}
