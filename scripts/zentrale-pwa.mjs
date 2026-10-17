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


export const SMK_SECTION = `<!-- s58-smk -->
<section class="s58-pricing" id="social-media-ki" aria-labelledby="smk-titel">
    <div class="wrap">
      <div class="sec-head rv">
        <div>
          <span class="eyebrow">Software &amp; App</span>
          <h2 class="sec-title" id="smk-titel">Social Media KI — als App nutzen.</h2>
        </div>
        <p class="sec-sub">Die eigenständige Software von SECRET 58, im Monats- oder Jahresabo. Jeder Kunde erhält einen eigenen, privaten Arbeitsbereich.</p>
      </div>
      <div class="s58-price-grid rv" style="grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));">
        <article class="s58-price">
          <small>PRO</small><h3>Social Media KI Pro</h3>
          <div class="amount">590 € <span>netto / Monat, zzgl. Steuer</span></div>
          <p>Jahresabo: 6.018 € netto / Jahr, im Voraus bezahlt.</p>
          <a class="s58-btn" href="/buy?plan=pro#paket-pro">Pro ansehen &amp; wählen</a>
        </article>
        <article class="s58-price featured">
          <div class="s58-badge">Empfohlen</div>
          <small>MAXI</small><h3>Social Media KI Maxi</h3>
          <div class="amount">797 € <span>netto / Monat, zzgl. Steuer</span></div>
          <p>Jahresabo: 8.129,40 € netto / Jahr, im Voraus bezahlt.</p>
          <a class="s58-btn" href="/buy?plan=maxi#paket-maxi">Maxi ansehen &amp; wählen</a>
        </article>
        <article class="s58-price">
          <img src="/icons/apple-touch-icon.png" alt="SECRET 58 App-Symbol" width="72" height="72" style="border-radius:16px;margin-bottom:.6rem;">
          <small>APP</small><h3>Als App installieren</h3>
          <p>Auf Handy oder Computer wie eine App öffnen — ohne App-Store.</p>
          <span data-s58-install class="s58-install-slot" style="margin-top:auto;"></span>
        </article>
      </div>
      <p class="price-note">Der Kauf erfolgt erst nach Ihrem ausdrücklichen Klick im Bestellvorgang. Kontingente sind feste Obergrenzen, es gibt keine automatischen Zusatzkäufe. Ob der Kauf bereits freigeschaltet ist, zeigt die Seite <a href="/buy">Social Media KI</a>.</p>
    </div>
  </section>
<!-- /s58-smk -->
`;

export function patchPage(html, file) {
  if (!html.includes("<!-- s58-pwa -->")) html = html.replace("</head>", HEAD_TAGS + "</head>");
  // Platz in der Hauptnavigation der Startseite (vor „Kundenbereich“); andere Seiten bekommen die feste Schaltfläche.
  if (file === "start.html" && !html.includes("data-s58-install")) {
    html = html.replace('<a href="/login" class="nav-login">', '<span data-s58-install data-s58-float class="s58-install-slot"></span>\n      <a href="/login" class="nav-login">');
  }
  if (file === "start.html" && !html.includes("<!-- s58-smk -->")) {
    html = html.replace('<section class="s58-pricing" id="preise">', SMK_SECTION + '\n  <section class="s58-pricing" id="preise">');
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
