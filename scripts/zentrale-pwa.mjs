/**
 * Macht die Seiten der Zentrale (public/zentrale/seiten) installierbar: Manifest, Apple-Symbol,
 * Startfenster-Metadaten und das Skript für „App installieren“. Läuft idempotent und wird auch
 * von scripts/import-zentrale.mjs nach jeder Übernahme aufgerufen.
 *   node scripts/zentrale-pwa.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const HEAD_TAGS = `<!-- s58-pwa -->
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="SECRET 58">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<script src="/installieren.js" defer></script>
<!-- /s58-pwa -->
`;

export function patchPage(html, file) {
  if (!html.includes("<!-- s58-pwa -->")) html = html.replace("</head>", HEAD_TAGS + "</head>");
  // Platz in der Hauptnavigation der Startseite (vor „Kundenbereich“); andere Seiten bekommen die feste Schaltfläche.
  if (file === "start.html" && !html.includes("data-s58-install")) {
    html = html.replace('<a href="/login" class="nav-login">', '<span data-s58-install data-s58-float class="s58-install-slot"></span>\n      <a href="/login" class="nav-login">');
  }
  return html;
}

export function patchAll(dir) {
  let n = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".html"))) {
    const p = path.join(dir, f);
    const before = readFileSync(p, "utf8");
    const after = patchPage(before, f);
    if (after !== before) { writeFileSync(p, after); n++; }
  }
  return n;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = new URL("../public/zentrale/seiten/", import.meta.url).pathname;
  console.log(`Zentrale-PWA: ${patchAll(dir)} Seiten angepasst.`);
}
