import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Schlüssel werden vor dem Speichern pseudonymisiert: Der Teil vor dem ersten
 * „:“ (Art der Grenze) bleibt lesbar, alles danach (z. B. IP-Adresse,
 * Besucherkennung) wird mit einem geheimen Server-Wert per HMAC verkürzt.
 * So steht keine IP-Adresse und kein umkehrbarer einfacher Hash in der
 * Datenbank. Geheimnis: RATE_LIMIT_SECRET, sonst abgeleitet aus
 * TOKEN_ENCRYPTION_KEY, sonst zufällig je Prozess (dann gelten Grenzen nur
 * bis zum Neustart).
 */
let geheim: Buffer | null = null;
function schluesselGeheimnis(): Buffer {
  if (geheim) return geheim;
  const basis = process.env.RATE_LIMIT_SECRET?.trim() || process.env.TOKEN_ENCRYPTION_KEY?.trim();
  geheim = basis ? createHmac("sha256", "secret58-ratenbegrenzung").update(basis).digest() : randomBytes(32);
  return geheim;
}

export function gespeicherterSchluessel(key: string): string {
  const i = key.indexOf(":");
  if (i < 0) return key;
  return `${key.slice(0, i)}:${createHmac("sha256", schluesselGeheimnis()).update(key.slice(i + 1)).digest("hex").slice(0, 32)}`;
}

/** Abgelaufene Zähler (älter als 2 Tage) höchstens einmal pro Stunde je Prozess löschen. */
let letzteBereinigung = 0;
async function alteZaehlerLoeschen() {
  const jetzt = Date.now();
  if (jetzt - letzteBereinigung < 3_600_000) return;
  letzteBereinigung = jetzt;
  await prisma.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(jetzt - 2 * 86_400_000) } } }).catch(() => undefined);
}

/**
 * Fester Zeitfenster-Zähler in der Datenbank. Damit wirkt die Grenze auch
 * über Neustarts hinweg und bei mehreren Prozessen auf derselben Datenbank.
 * Das Hochzählen ist ein einzelnes bedingtes UPDATE ("count < limit") —
 * parallele Anfragen können die Grenze daher nicht gemeinsam überspringen.
 * Gibt true zurück, wenn die Anfrage noch erlaubt ist.
 */
export async function hitRateLimit(rohSchluessel: string, limit: number, windowSeconds: number): Promise<boolean> {
  const key = gespeicherterSchluessel(rohSchluessel);
  await alteZaehlerLoeschen();
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
