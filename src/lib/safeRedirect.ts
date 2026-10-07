/**
 * Nur interne Ziele — keine offene Weiterleitung auf fremde Seiten (auch nicht
 * über "/\evil.example", das Browser wie "//evil.example" behandeln).
 */
export function safeInternalPath(next: string | undefined | null, origin: string, fallback: string): string {
  if (!next || !next.startsWith("/") || next.includes("\\")) return fallback;
  try {
    const url = new URL(next, origin);
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
