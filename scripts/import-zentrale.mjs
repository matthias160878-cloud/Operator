/**
 * Übernimmt die Inhaltsseiten der Zentrale (secret58-web/public) unverändert
 * in Inhalt und Gestaltung nach public/zentrale/. Nur Links und Asset-Pfade
 * werden auf die gemeinsame Anwendung umgestellt. Systemseiten der alten
 * Zentrale (eigener Login, Dashboard, Aufträge, Rechte …) werden NICHT
 * übernommen — dafür hat die App eigene Seiten.
 *
 *   node scripts/import-zentrale.mjs <pfad/zu/secret58-web/public>
 *
 * Quelle bei der Übernahme: desktop-tutorial @ fcc6ab7 (letzter Stand vor der
 * nicht freigegebenen Hell-Umgestaltung).
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("Pfad zu secret58-web/public angeben.");
  process.exit(1);
}
const out = new URL("../public/zentrale/", import.meta.url).pathname;

/** Zentrale-Datei → Pfad in der App. */
export const PAGES = {
  "ueber-uns": "/ueber-uns",
  "ki-dienstleistungen": "/ki-dienstleistungen",
  "ki-agenten": "/ki-agenten",
  "ki-automation": "/ki-automation",
  "ki-beratung": "/ki-beratung",
  schulung: "/ki-schulung", // /schulung ist in der App die Kunden-Schulung
  webdesign: "/webdesign",
  "webseiten-aufbau": "/webseiten-aufbau",
  "content-erstellung": "/content-erstellung",
  "social-media": "/social-media-betreuung", // /social-media ist in der App die Kontenverbindung
  referenz: "/referenz",
  portfolio: "/portfolio",
  preise: "/preise",
  faq: "/faq",
  kontakt: "/kontakt",
  demo: "/demo",
  praesentationen: "/praesentationen",
  agb: "/agb",
  datenschutz: "/datenschutz",
};

const LINKS = [
  ['href="/social-media"', `href="${PAGES["social-media"]}"`],
  ['href="/schulung"', `href="${PAGES.schulung}"`],
  ['href="index.html"', 'href="/"'],
  ['href="datenschutz.html"', 'href="/datenschutz"'],
  ['href="impressum.html"', 'href="/impressum"'],
  ['href="agb.html"', 'href="/agb"'],
  ['href="/assets/seite.css"', 'href="/zentrale/assets/seite.css"'],
  ['href="assets/seite.css"', 'href="/zentrale/assets/seite.css"'],
  // Kanonische Adresse: Zieldomain der gemeinsamen Anwendung
  ["https://secret58-web.onrender.com", "https://www.secret58.com"],
];

mkdirSync(path.join(out, "seiten"), { recursive: true });
mkdirSync(path.join(out, "assets"), { recursive: true });
for (const asset of ["seite.css", "archivo-latin.woff2", "og-image.png"]) {
  copyFileSync(path.join(src, "assets", asset), path.join(out, "assets", asset));
}
for (const [file, route] of Object.entries(PAGES)) {
  let html = readFileSync(path.join(src, `${file}.html`), "utf8");
  for (const [from, to] of LINKS) html = html.split(from).join(to);
  writeFileSync(path.join(out, "seiten", `${file}.html`), html);
  console.log(`${file}.html → ${route}`);
}
