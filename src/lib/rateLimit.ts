/**
 * Einfaches In-Memory-Rate-Limiting pro Schlüssel (z.B. IP+Route) — als
 * Startpunkt für Abschnitt 9 des Auftrags ("Schutz vor missbräuchlichen
 * Anfragen"). Bewusst einfach gehalten: ein gleitendes Zeitfenster pro
 * Prozess, ohne externe Abhängigkeit (kein Redis).
 *
 * Bekannte Grenze, ehrlich benannt: Auf mehreren Server-Instanzen (z.B.
 * horizontal skaliertes Deployment) zählt jede Instanz separat — der
 * tatsächliche Limit kann sich dadurch mit der Instanzzahl multiplizieren.
 * Für einen einzelnen Windows-VPS-Prozess (wie in diesem Projekt vorgesehen)
 * ist das unkritisch; bei horizontaler Skalierung auf einen gemeinsamen
 * Speicher (Redis o.ä.) umstellen.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Verhindert unbegrenztes Wachstum des Maps bei vielen unterschiedlichen
// IPs/Keys — alte Einträge regelmäßig entfernen.
let lastSweep = Date.now();
function sweep(maxAgeMs: number) {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > maxAgeMs) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * @param key Eindeutiger Schlüssel, typischerweise `${route}:${ip}`.
 * @param limit Maximal erlaubte Aufrufe pro Fenster.
 * @param windowMs Fenstergröße in Millisekunden.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  sweep(windowMs);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - existing.windowStart),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterMs: 0 };
}

/** Bestmögliche Client-IP aus Request-Headern (Proxy-Header zuerst). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
