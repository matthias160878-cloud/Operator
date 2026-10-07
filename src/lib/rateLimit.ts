import { prisma } from "@/lib/db";

/**
 * Fester Zeitfenster-Zähler in der Datenbank. Damit wirkt die Grenze auch
 * über Neustarts hinweg und bei mehreren Prozessen auf derselben Datenbank.
 * Das Hochzählen ist ein einzelnes bedingtes UPDATE ("count < limit") —
 * parallele Anfragen können die Grenze daher nicht gemeinsam überspringen.
 * Gibt true zurück, wenn die Anfrage noch erlaubt ist.
 */
export async function hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const row = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, windowStart, count: 0 },
    update: {},
  });
  if (row.windowStart.getTime() !== windowStart.getTime()) {
    await prisma.rateLimit.updateMany({
      where: { key, windowStart: row.windowStart },
      data: { windowStart, count: 0 },
    });
  }
  const counted = await prisma.rateLimit.updateMany({
    where: { key, windowStart, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });
  return counted.count === 1;
}

/**
 * Client-Adresse für Missbrauchsschutz. Der erste X-Forwarded-For-Eintrag
 * stammt vom Client und ist fälschbar; maßgeblich ist der Eintrag, den der
 * eigene Reverse Proxy angehängt hat. TRUSTED_PROXY_HOPS = Anzahl eigener
 * Proxys vor der Anwendung (Standard 1, z. B. Caddy; 0 = direkt erreichbar).
 */
export function clientIp(request: Request): string {
  const hops = Number(process.env.TRUSTED_PROXY_HOPS ?? "1");
  const entries = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (hops > 0 && entries.length > 0) return entries[Math.max(0, entries.length - hops)];
  return "direct";
}
