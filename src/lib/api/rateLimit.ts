/**
 * Einfaches Fenster-Limit im Speicher dieses Server-Prozesses (kein Redis).
 * Reicht für eine einzelne Instanz; bei mehreren Instanzen gilt das Limit
 * pro Instanz.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Zählt einen Treffer. Gibt `null` zurück, wenn erlaubt, sonst die Wartezeit in Sekunden. */
export function hitRateLimit(key: string, limit: number, windowMs: number): number | null {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (bucket.count >= limit) return Math.ceil((bucket.resetAt - now) / 1000);
  bucket.count++;
  return null;
}
