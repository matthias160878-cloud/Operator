import { APP_TIME_ZONE } from "@/lib/timezone";

/**
 * Hilfen für die Terminbuchung der Startseite. Datum und Uhrzeit werden wie
 * in der Zentrale als Ortszeit (APP_TIME_ZONE) eingegeben und angezeigt;
 * gespeichert wird zusätzlich der UTC-Zeitpunkt.
 */
export function validDatum(datum: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(datum) && !Number.isNaN(Date.parse(`${datum}T00:00:00Z`));
}

export function validUhrzeit(uhrzeit: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(uhrzeit);
}

/** Ortszeit (z. B. Europe/Berlin) → UTC-Zeitpunkt, inkl. Sommer-/Winterzeit. */
export function zonedToUtc(datum: string, uhrzeit: string, timeZone = APP_TIME_ZONE): Date {
  const [y, m, d] = datum.split("-").map(Number);
  const [h, mi] = uhrzeit.split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d, h, mi);
  const offsetAt = (ms: number) => {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
      }).formatToParts(new Date(ms)).map((p) => [p.type, p.value])
    );
    const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
    return local - ms;
  };
  let ms = asUtc - offsetAt(asUtc);
  ms = asUtc - offsetAt(ms); // zweiter Schritt für Zeitpunkte nahe der Umstellung
  return new Date(ms);
}
