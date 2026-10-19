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
