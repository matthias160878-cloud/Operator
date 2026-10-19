/** Gemeinsamer JSON-Aufruf für die Messaging-Adapter mit lesbaren Fehlern. */
export async function requestJson<T>(url: string, init: RequestInit, context: string): Promise<{ data: T; res: Response }> {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(30_000) });
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (res.ok) throw new Error(`${context}: ungültige Antwort (${res.status}).`);
  }
  if (!res.ok) {
    const apiMessage =
      (data as { error?: { message?: string } })?.error?.message ??
      (data as { message?: string })?.message ??
      text.slice(0, 300);
    throw new Error(`${context} fehlgeschlagen (${res.status}): ${apiMessage}`);
  }
  return { data: data as T, res };
}

const TIKTOK_BUSINESS_API = "https://business-api.tiktok.com/open_api/v1.3";

/**
 * TikTok API for Business: Token im `Access-Token`-Header, Fehler kommen
 * als HTTP 200 mit `code` != 0 — beides wird hier vereinheitlicht.
 */
export async function tiktokBusinessRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit,
  context: string
): Promise<T> {
  const { data } = await requestJson<{ code?: number; message?: string; data?: T }>(
    `${TIKTOK_BUSINESS_API}${path}`,
    { ...init, headers: { "Access-Token": accessToken, "Content-Type": "application/json", ...(init.headers ?? {}) } },
    context
  );
  if (data.code !== undefined && data.code !== 0) {
    throw new Error(`${context} fehlgeschlagen (Code ${data.code}): ${data.message ?? "unbekannter Fehler"}`);
  }
  return (data.data ?? {}) as T;
}
