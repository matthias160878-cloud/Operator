/**
 * Öffentliche Adresse der Anwendung für Rückkehr-Links (Composio-Callback).
 * PUBLIC_APP_URL hat Vorrang und ist im Betrieb hinter einem Proxy Pflicht;
 * request.url enthält dort die interne Adresse. Ohne PUBLIC_APP_URL (lokale
 * Vorschau) wird die vom Browser angefragte Adresse verwendet.
 */
export function appOrigin(request: Request): string {
  const configured = process.env.PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  if (host && /^[A-Za-z0-9.-]+(:\d+)?$/.test(host) && (proto === "http" || proto === "https")) {
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}
