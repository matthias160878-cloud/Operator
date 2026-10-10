/**
 * Inhaltsseiten der Zentrale (übernommen per scripts/import-zentrale.mjs,
 * statisch unter public/zentrale/seiten/). Öffentliche Adresse → Datei.
 * Gemeinsame Quelle für next.config (Rewrites) und den Zugriffsschutz.
 */
export const ZENTRALE_PAGES: Record<string, string> = {
  "/ueber-uns": "ueber-uns",
  "/ki-dienstleistungen": "ki-dienstleistungen",
  "/ki-agenten": "ki-agenten",
  "/ki-automation": "ki-automation",
  "/ki-beratung": "ki-beratung",
  "/ki-schulung": "schulung",
  "/webdesign": "webdesign",
  "/webseiten-aufbau": "webseiten-aufbau",
  "/content-erstellung": "content-erstellung",
  "/social-media-betreuung": "social-media",
  "/referenz": "referenz",
  "/portfolio": "portfolio",
  "/preise": "preise",
  "/faq": "faq",
  "/kontakt": "kontakt",
  "/demo": "demo",
  "/praesentationen": "praesentationen",
  "/agb": "agb",
  "/datenschutz": "datenschutz",
};

/** Einstieg für nicht angemeldete Besucher, solange die Zentrale-Startseite noch nicht übernommen ist. */
export const VISITOR_HOME = "/ki-dienstleistungen";
