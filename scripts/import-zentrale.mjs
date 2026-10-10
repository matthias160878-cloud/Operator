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
for (const asset of ["seite.css", "archivo-latin.woff2", "og-image.png", "kern-bild.js", "demo-plan.js", "gehirn.jpg"]) {
  copyFileSync(path.join(src, "assets", asset), path.join(out, "assets", asset));
}
for (const [file, route] of Object.entries(PAGES)) {
  let html = readFileSync(path.join(src, `${file}.html`), "utf8");
  for (const [from, to] of LINKS) html = html.split(from).join(to);
  writeFileSync(path.join(out, "seiten", `${file}.html`), html);
  console.log(`${file}.html → ${route}`);
}

/*
 * Startseite (index.html → „/“ für Besucher ohne Konto). Zusätzlich:
 *  - Asset-Pfade /assets/ → /zentrale/assets/
 *  - Links auf Systemseiten der alten Zentrale auf App-Gegenstücke
 *  - Presse/Rechte/Sicherheit-Links entfernt (Seiten nicht übernommen)
 *  - Alle Funktionen laufen über Schnittstellen der App: /api/kontakt,
 *    /api/agenten, /api/demo/plan, /api/chat, /api/skill-agent,
 *    /api/termine/…, /api/newsletter/… (Double-Opt-in). Die Skill-Anfrage
 *    erscheint nur mit freigeschalteter KI, der Newsletter nur mit
 *    eingerichtetem E-Mail-Versand (/api/webseite/status).
 */
const START_LINKS = [
  ...LINKS,
  ['"/assets/', '"/zentrale/assets/'],
  ["'/assets/", "'/zentrale/assets/"],
  ['href="agenten.html"', 'href="/ki-agenten"'],
  ['href="dashboard.html"', 'href="/login"'],
  ['href="paket.html"', 'href="/buy"'],
  ['href="social-media-ki.html"', 'href="/buy"'],
  ['href="praesentationen.html"', 'href="/praesentationen"'],
  ['        <a href="presse.html">Presse</a>\n', ""],
  ['        <a href="rechte.html">Rechte</a>\n', ""],
  ['        <a href="/sicherheit">Sicherheit</a>\n', ""], // lädt Daten vom alten Zentrale-Server
];
const AUSGEBLENDET = `<style id="app-ausgeblendet">
/* Newsletter nur sichtbar, wenn der E-Mail-Versand für die Bestätigungs-Mail (Double-Opt-in) eingerichtet ist. */
html:not(.nl-an) div:has(> #newsletterform) { display: none !important; }
</style>
<script id="app-webseite-status">
/* Skill-Anfrage nur mit freigeschalteter KI (WEBSITE_KI=true), Newsletter nur mit E-Mail-Versand. */
addEventListener("DOMContentLoaded", function () {
  fetch("/api/webseite/status", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (d) {
    if (!d.ki) { var f = document.getElementById("skillagentform"); if (f) f.style.display = "none"; }
    if (d.newsletter) document.documentElement.classList.add("nl-an");
  }).catch(function () {});
});
</script>
</head>`;
let start = readFileSync(path.join(src, "index.html"), "utf8");
// Fehler der Zentrale (seit 17.09., ed64696): dieser @media-Block wird nie
// geschlossen — dadurch gilt am Desktop die gesamte Gestaltung ab „Ablauf“
// (inkl. Chat und Seitenfuß) nicht. Eine fehlende Klammer ergänzen.
const OFFENER_BLOCK = "@media(max-width:52rem){\n  .brain-sec .port{max-width:8.5rem; font-size:.68rem; padding:.32rem .5rem;}\n";
if (!start.includes(OFFENER_BLOCK)) throw new Error("Bekannter CSS-Fehler nicht gefunden — Startseite geändert? Bitte prüfen.");
start = start.replace(OFFENER_BLOCK, OFFENER_BLOCK + "}\n");
for (const [from, to] of START_LINKS) start = start.split(from).join(to);
start = start.replace("</head>", AUSGEBLENDET);

writeFileSync(path.join(out, "seiten", "start.html"), start);
console.log("index.html → / (Besucher)");
