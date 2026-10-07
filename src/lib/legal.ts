/**
 * Impressum (§ 5 DDG) und Verweise auf AGB/Datenschutz — ausschließlich aus
 * der Server-Konfiguration, nie im Code erfunden. Fehlen Pflichtangaben,
 * zeigt die Seite das offen an und der Paketverkauf bleibt gesperrt.
 *
 * Mehrzeilige Anschrift: Zeilen mit " | " trennen, z. B.
 * IMPRESSUM_ANSCHRIFT="Musterstraße 1 | 12345 Musterstadt | Deutschland"
 */
export interface Impressum {
  anbieter: string;
  firma: string | null;
  anschrift: string[];
  email: string;
  telefon: string | null;
  ustId: string | null;
  register: string | null;
  aufsicht: string | null;
  verantwortlich: string;
  streitbeilegung: string | null;
}

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export function getImpressum(): Impressum | null {
  const anbieter = env("IMPRESSUM_NAME");
  const anschrift = env("IMPRESSUM_ANSCHRIFT");
  const email = env("IMPRESSUM_EMAIL");
  if (!anbieter || !anschrift || !email) return null;
  return {
    anbieter,
    firma: env("IMPRESSUM_FIRMA"),
    anschrift: anschrift.split("|").map((z) => z.trim()).filter(Boolean),
    email,
    telefon: env("IMPRESSUM_TELEFON"),
    ustId: env("IMPRESSUM_UST_ID"),
    register: env("IMPRESSUM_REGISTER"),
    aufsicht: env("IMPRESSUM_AUFSICHT"),
    verantwortlich: env("IMPRESSUM_VERANTWORTLICH") ?? anbieter,
    streitbeilegung: env("IMPRESSUM_STREITBEILEGUNG"),
  };
}

/** Externe Seiten für AGB und Datenschutzerklärung (z. B. auf secret58.com). */
export function legalLinks() {
  return { agb: env("AGB_URL"), datenschutz: env("DATENSCHUTZ_URL") };
}

/** Verkauf erst, wenn Impressum, AGB und Datenschutzerklärung erreichbar sind. */
export function legalInfoComplete(): boolean {
  const links = legalLinks();
  return Boolean(getImpressum() && links.agb && links.datenschutz);
}
