/*
 * Sprachwahl der Zentrale (34 Sprachen wie in der App).
 * Übersetzt im Browser mit festen Wörterbüchern (i18n/<code>.json, maschinell
 * übersetzt) – es wird nichts an einen Übersetzungsdienst gesendet.
 * Schlüssel ist der deutsche Text (Leerraum zusammengefasst). Was nicht im
 * Wörterbuch steht (z. B. Rechtstexte: Impressum, Datenschutz, AGB), bleibt
 * deutsch. Gewählte Sprache: localStorage „s58-sprache“ und Cookie „s58_locale“
 * (gleicher Name wie in der App), sonst Browsersprache, sonst Deutsch.
 */
(function () {
  var SPRACHEN = [
    ["de", "🇩🇪", "Deutsch"], ["en", "🇬🇧", "English"], ["fr", "🇫🇷", "Français"], ["es", "🇪🇸", "Español"],
    ["it", "🇮🇹", "Italiano"], ["pt", "🇵🇹", "Português"], ["nl", "🇳🇱", "Nederlands"], ["pl", "🇵🇱", "Polski"],
    ["cs", "🇨🇿", "Čeština"], ["sk", "🇸🇰", "Slovenčina"], ["sl", "🇸🇮", "Slovenščina"], ["hr", "🇭🇷", "Hrvatski"],
    ["bs", "🇧🇦", "Bosanski"], ["sr", "🇷🇸", "Српски"], ["mk", "🇲🇰", "Македонски"], ["bg", "🇧🇬", "Български"],
    ["ro", "🇷🇴", "Română"], ["hu", "🇭🇺", "Magyar"], ["el", "🇬🇷", "Ελληνικά"], ["tr", "🇹🇷", "Türkçe"],
    ["sq", "🇦🇱", "Shqip"], ["da", "🇩🇰", "Dansk"], ["sv", "🇸🇪", "Svenska"], ["no", "🇳🇴", "Norsk"],
    ["is", "🇮🇸", "Íslenska"], ["fi", "🇫🇮", "Suomi"], ["et", "🇪🇪", "Eesti"], ["lv", "🇱🇻", "Latviešu"],
    ["lt", "🇱🇹", "Lietuvių"], ["ga", "🇮🇪", "Gaeilge"], ["mt", "🇲🇹", "Malti"], ["uk", "🇺🇦", "Українська"],
    ["ru", "🇷🇺", "Русский"], ["ca", "🇦🇩", "Català"]
  ];
  var CODES = SPRACHEN.map(function (s) { return s[0]; });
  var BASIS = (document.currentScript && document.currentScript.src || location.href).replace(/[^/]*$/, "");
  var ATTR = ["placeholder", "title", "aria-label", "alt"];
  var SKIP = "script,style,svg,iframe,textarea,code,pre,[data-nicht-uebersetzen],.sprachwahl-liste";

  function lesen() {
    try { var v = localStorage.getItem("s58-sprache"); if (v && CODES.indexOf(v) >= 0) return v; } catch (e) {}
    var m = document.cookie.match(/(?:^|;\s*)s58_locale=([a-z]{2})/);
    if (m && CODES.indexOf(m[1]) >= 0) return m[1];
    var b = (navigator.languages || [navigator.language || "de"]).map(function (l) { return String(l).slice(0, 2).toLowerCase(); });
    for (var i = 0; i < b.length; i++) { if (b[i] === "nb" || b[i] === "nn") b[i] = "no"; if (CODES.indexOf(b[i]) >= 0) return b[i]; }
    return "de";
  }
  function speichern(code) {
    try { localStorage.setItem("s58-sprache", code); } catch (e) {}
    document.cookie = "s58_locale=" + code + ";path=/;max-age=31536000;samesite=lax";
  }

  var sprache = lesen(), wb = null, cache = {};
  var origText = new WeakMap(), gesetztText = new WeakMap(), origAttr = new WeakMap();
  var norm = function (s) { return s.replace(/\s+/g, " ").trim(); };

  function laden(code) {
    if (code === "de") return Promise.resolve(null);
    if (cache[code]) return Promise.resolve(cache[code]);
    return fetch(BASIS + "i18n/" + code + ".json").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { cache[code] = d; return d; });
  }

  function text(n) {
    var e = n.parentElement;
    if (!e || e.closest(SKIP)) return;
    var jetzt = n.nodeValue;
    if (gesetztText.get(n) !== jetzt) origText.set(n, jetzt); // neuer Inhalt der Seite (deutsch)
    var de = origText.get(n);
    if (de == null) return;
    var ziel = de;
    if (wb) {
      var k = norm(de);
      var t = k && wb[k];
      if (t) { var m = de.match(/^(\s*)[\s\S]*?(\s*)$/); ziel = m[1] + t + m[2]; }
    }
    if (ziel !== jetzt) { gesetztText.set(n, ziel); n.nodeValue = ziel; } else gesetztText.set(n, jetzt);
  }
  function attrs(e) {
    if (e.closest(SKIP)) return;
    var o = origAttr.get(e);
    if (!o) { o = {}; origAttr.set(e, o); }
    ATTR.forEach(function (a) {
      if (!e.hasAttribute(a)) return;
      var v = e.getAttribute(a);
      if (o[a] == null || (o["_" + a] !== v)) o[a] = v;
      var t = wb && wb[norm(o[a])];
      var ziel = t || o[a];
      o["_" + a] = ziel;
      if (v !== ziel) e.setAttribute(a, ziel);
    });
  }
  function baum(root) {
    if (root.nodeType === 3) return text(root);
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches("[" + ATTR.join("],[") + "]")) attrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) text(n); else if (n.hasAttribute && ATTR.some(function (a) { return n.hasAttribute(a); })) attrs(n); }
  }

  var beobachter = new MutationObserver(function (liste) {
    beobachter.disconnect();
    liste.forEach(function (m) {
      if (m.type === "characterData") text(m.target);
      else if (m.type === "attributes") attrs(m.target);
      else m.addedNodes.forEach(baum);
    });
    knopfEinsetzen();
    beobachten();
  });
  function beobachten() {
    beobachter.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
  }

  function anwenden(code) {
    return laden(code).then(function (d) {
      sprache = code; wb = d;
      document.documentElement.lang = code;
      beobachter.disconnect();
      baum(document.body);
      knopfEinsetzen(true);
      beobachten();
    }).catch(function () {
      // Wörterbuch nicht erreichbar: deutsch weiter, Beobachter wieder an.
      sprache = "de"; wb = null; beobachter.disconnect(); knopfEinsetzen(true); beobachten();
    });
  }

  function aktuell() { for (var i = 0; i < SPRACHEN.length; i++) if (SPRACHEN[i][0] === sprache) return SPRACHEN[i]; return SPRACHEN[0]; }
  function knopfEinsetzen(neu) {
    // Zentrale: Kopfzeile #kopf; andere Seiten (z. B. /buy der App): Element mit data-sprachwahl-platz.
    var eigen = document.querySelector("[data-sprachwahl-platz]");
    var platz = eigen || document.querySelector("#kopf .kopf-in");
    if (!platz) return;
    var box = platz.querySelector(".sprachwahl");
    if (box && !neu) return;
    if (!box) {
      box = document.createElement("div");
      box.className = "sprachwahl";
      box.setAttribute("data-nicht-uebersetzen", "");
      // Mit dem Knopf „Erstgespräch“ zusammenfassen, damit beide im selben Rasterfeld der Kopfzeile stehen.
      var knopf = eigen ? null : platz.querySelector(".kopf-knopf");
      if (knopf) {
        var paar = document.createElement("span");
        paar.className = "kopf-paar";
        platz.insertBefore(paar, knopf);
        paar.appendChild(box);
        paar.appendChild(knopf);
      } else platz.appendChild(box);
    }
    var a = aktuell();
    box.innerHTML = '<button type="button" class="sprachwahl-knopf" aria-haspopup="listbox" aria-expanded="false" aria-label="Sprache / Language"><span aria-hidden="true">' + a[1] + "</span> " + a[0].toUpperCase() + ' <span aria-hidden="true">▾</span></button>' +
      '<ul class="sprachwahl-liste" role="listbox" hidden>' + SPRACHEN.map(function (s) {
        return '<li><button type="button" role="option" data-sprache="' + s[0] + '" aria-selected="' + (s[0] === sprache) + '"><span aria-hidden="true">' + s[1] + "</span> " + s[2] + "</button></li>";
      }).join("") + "</ul>";
  }
  document.addEventListener("click", function (e) {
    var k = e.target.closest && e.target.closest(".sprachwahl-knopf");
    var offen = document.querySelector(".sprachwahl-liste:not([hidden])");
    if (k) {
      var l = k.parentNode.querySelector(".sprachwahl-liste");
      var zu = !l.hidden;
      l.hidden = zu; k.setAttribute("aria-expanded", String(!zu));
      return;
    }
    var w = e.target.closest && e.target.closest("[data-sprache]");
    if (w) { speichern(w.getAttribute("data-sprache")); anwenden(w.getAttribute("data-sprache")); return; }
    if (offen) offen.hidden = true;
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { var o = document.querySelector(".sprachwahl-liste:not([hidden])"); if (o) o.hidden = true; }
  });

  var st = document.createElement("style");
  st.textContent =
    ".kopf-paar{display:inline-flex;align-items:center;gap:8px;justify-self:end}.sprachwahl{position:relative;display:inline-flex;align-items:center}" +
    ".sprachwahl-knopf{font:inherit;font-size:.82rem;line-height:1;padding:7px 10px;border-radius:999px;border:1px solid var(--line,rgba(127,127,127,.35));background:transparent;color:inherit;cursor:pointer;white-space:nowrap}" +
    ".sprachwahl-liste{position:absolute;right:0;top:calc(100% + 6px);z-index:80;margin:0;padding:6px;list-style:none;max-height:min(70vh,520px);overflow:auto;min-width:190px;border-radius:12px;border:1px solid var(--line,rgba(127,127,127,.35));background:var(--nacht-bg,#fff);box-shadow:0 18px 40px rgba(0,0,0,.25)}" +
    ".s-champagner .sprachwahl-liste{background:#faf6ee}" +
    ".sprachwahl-liste button{display:flex;gap:8px;width:100%;text-align:left;font:inherit;font-size:.86rem;padding:7px 10px;border:0;border-radius:8px;background:none;color:inherit;cursor:pointer}" +
    ".sprachwahl-liste button:hover,.sprachwahl-liste button[aria-selected=true]{background:color-mix(in srgb,var(--akzent,#888) 18%,transparent)}" +
    "@media (max-width:860px){.kopf-paar{gap:4px}.sprachwahl-knopf{padding:6px 8px;font-size:.76rem}}";
  document.head.appendChild(st);

  function start() { knopfEinsetzen(); if (sprache !== "de") anwenden(sprache); else { knopfEinsetzen(true); beobachten(); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.S58_SPRACHE = { setzen: function (c) { if (CODES.indexOf(c) >= 0) { speichern(c); return anwenden(c); } }, aktuell: function () { return sprache; } };
})();
