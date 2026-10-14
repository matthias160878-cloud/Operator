/*
 * „App installieren“ für SECRET 58 — für die öffentliche Zentrale und die App.
 * - beforeinstallprompt: Klick öffnet den echten Installationsdialog; ein Abbruch gilt nie als Erfolg.
 * - appinstalled / Standalone-Modus: Schaltfläche verschwindet.
 * - iPhone/iPad (Safari): kurze Anleitung „Teilen → Zum Home-Bildschirm“.
 * - Sonst: ehrliche Browserhinweise; lokale Datei / ohne HTTPS: Erklärung statt Dialog.
 * Plätze: Elemente mit data-s58-install; fehlt eines, erscheint eine kleine feste Schaltfläche unten links.
 * Texte: /api/installieren/<sprache> (Sprache aus Cookie s58_locale oder Browser), mit eingebautem Notfalltext.
 */
(function () {
  "use strict";
  if (window.__s58Install) return;
  window.__s58Install = true;

  var ua = navigator.userAgent || "";
  var secure = window.isSecureContext === true && location.protocol !== "file:";
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isSafariIOS = isIOS && /safari/i.test(ua) && !/crios|fxios|edgios|opios|gsa\//i.test(ua);
  var isFirefox = /firefox|fxios/i.test(ua);
  var isChromium = /chrome|crios|chromium|edg\/|edga|opr\/|samsungbrowser/i.test(ua) && !/edgios/i.test(ua);
  var isSafariMac = !isIOS && /safari/i.test(ua) && !isChromium && !isFirefox;

  function lang() {
    var m = document.cookie.match(/(?:^|; )s58_locale=([a-z]{2})/);
    if (m) return m[1];
    var b = (navigator.language || "de").slice(0, 2).toLowerCase();
    return b === "nb" || b === "nn" ? "no" : b;
  }
  var L = lang();
  var NOT = {
    button: L === "de" ? "App installieren" : "Install app",
    buttonHint: L === "de" ? "SECRET 58 als App auf dem Gerät installieren" : "Install SECRET 58 as an app on this device",
    close: L === "de" ? "Schließen" : "Close",
    otherTitle: L === "de" ? "So installierst du die App" : "How to install the app",
    otherGeneric: L === "de" ? "Dieser Browser bietet gerade keinen Installationsdialog an. Versuche es in Chrome, Edge oder Safari." : "This browser does not offer an install dialog right now. Try Chrome, Edge or Safari.",
    insecureTitle: L === "de" ? "Installation hier nicht möglich" : "Installation not possible here",
    insecureText: L === "de" ? "Die Installation braucht eine bereitgestellte Website über HTTPS." : "Installation needs a published website over HTTPS.",
    canceled: L === "de" ? "Installation abgebrochen. Du kannst sie jederzeit erneut starten." : "Installation canceled. You can start it again at any time.",
  };
  var T = NOT;
  var deferred = null;
  var installed = false;
  var toastTimer = null;

  function standalone() {
    return (window.matchMedia && (matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches || matchMedia("(display-mode: minimal-ui)").matches)) || navigator.standalone === true;
  }
  function hidden() { return installed || standalone(); }

  var style = document.createElement("style");
  style.textContent =
    ".s58-ib{font:inherit;font-size:.78rem;line-height:1.2;cursor:pointer;color:inherit;background:transparent;border:1px solid rgba(255,255,255,.22);border-radius:.55rem;padding:.38rem .7rem;white-space:nowrap}" +
    ".s58-ib:hover{background:rgba(255,255,255,.08)}.s58-ib:focus-visible{outline:2px solid #ffc800;outline-offset:2px}" +
    ".s58-ib.s58-fl{position:fixed;left:14px;bottom:14px;z-index:2147483000;background:#0b1020;color:#fff;border-color:#7c6cff;box-shadow:0 6px 24px rgba(0,0,0,.45);padding:.55rem .9rem;font-size:.85rem}" +
    ".s58-note{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:2147483001;max-width:min(92vw,28rem);background:#0b1020;color:#fff;border:1px solid #7c6cff;border-radius:.6rem;padding:.6rem .9rem;font:500 .85rem/1.35 system-ui,sans-serif}" +
    "dialog.s58-dlg{border:1px solid #7c6cff;border-radius:.8rem;background:#0b1020;color:#fff;max-width:min(92vw,26rem);padding:1.1rem 1.2rem;font:400 .92rem/1.45 system-ui,sans-serif}" +
    "dialog.s58-dlg::backdrop{background:rgba(0,0,0,.6)}dialog.s58-dlg h2{margin:0 0 .6rem;font-size:1.05rem}dialog.s58-dlg ol{margin:.2rem 0 .2rem 1.2rem;padding:0}dialog.s58-dlg p{margin:.2rem 0}" +
    "dialog.s58-dlg button{margin-top:.9rem;font:inherit;cursor:pointer;color:#fff;background:#6d5bff;border:0;border-radius:.5rem;padding:.45rem .9rem}dialog.s58-dlg button:focus-visible{outline:2px solid #ffc800;outline-offset:2px}";
  document.head.appendChild(style);

  function labelAll() {
    document.querySelectorAll(".s58-ib").forEach(function (b) { b.textContent = T.button; b.title = T.buttonHint; b.setAttribute("aria-label", T.buttonHint); });
  }
  function toast(text) {
    var n = document.getElementById("s58-note");
    if (!n) { n = document.createElement("div"); n.id = "s58-note"; n.className = "s58-note"; n.setAttribute("role", "status"); document.body.appendChild(n); }
    n.textContent = text; n.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 6000);
  }
  function dialog(title, bodyNodes) {
    var d = document.createElement("dialog"); d.className = "s58-dlg"; d.setAttribute("aria-labelledby", "s58-dt");
    var h = document.createElement("h2"); h.id = "s58-dt"; h.textContent = title; d.appendChild(h);
    bodyNodes.forEach(function (n) { d.appendChild(n); });
    var c = document.createElement("button"); c.type = "button"; c.textContent = T.close;
    c.addEventListener("click", function () { d.close(); }); d.appendChild(c);
    d.addEventListener("close", function () { d.remove(); });
    document.body.appendChild(d);
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    c.focus();
  }
  function p(text) { var e = document.createElement("p"); e.textContent = text; return e; }

  function onClick() {
    if (deferred) {
      var ev = deferred; deferred = null;
      ev.prompt();
      Promise.resolve(ev.userChoice).then(function (choice) {
        if (choice && choice.outcome === "dismissed") toast(T.canceled || NOT.canceled);
        /* „accepted“: Erfolg erst melden, wenn appinstalled kommt */
      }).catch(function () {});
      return;
    }
    if (!secure) return dialog(T.insecureTitle, [p(T.insecureText)]);
    if (isIOS) {
      if (!isSafariIOS) return dialog(T.iosTitle || T.otherTitle, [p(T.iosNotSafari || T.otherGeneric)]);
      var ol = document.createElement("ol");
      [T.iosStep1, T.iosStep2, T.iosStep3].forEach(function (s) { if (s) { var li = document.createElement("li"); li.textContent = s; ol.appendChild(li); } });
      return dialog(T.iosTitle || T.otherTitle, ol.children.length ? [ol] : [p(T.iosShort || "Safari: Share → Add to Home Screen")]);
    }
    var msg = isFirefox ? T.otherFirefox : isSafariMac ? T.otherSafariMac : isChromium ? T.otherChromium : T.otherGeneric;
    dialog(T.otherTitle, [p(msg || NOT.otherGeneric)]);
  }

  function seen(h) {
    var r = h.getClientRects()[0];
    return !!r && r.width > 0 && r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight;
  }
  function ensureButtons() {
    if (hidden()) { document.querySelectorAll(".s58-ib").forEach(function (b) { b.remove(); }); return; }
    var hosts = document.querySelectorAll("[data-s58-install]");
    var anySeen = false, wantsFloat = false;
    hosts.forEach(function (h) {
      if (!h.querySelector(".s58-ib")) {
        var b = document.createElement("button"); b.type = "button"; b.className = "s58-ib"; b.addEventListener("click", onClick); h.appendChild(b);
        b.textContent = T.button; b.title = T.buttonHint; b.setAttribute("aria-label", T.buttonHint);
      }
      if (seen(h)) anySeen = true;
      if (h.hasAttribute("data-s58-float")) wantsFloat = true;
    });
    /* Feste Schaltfläche, wenn es keinen Platz gibt oder der Platz (z. B. eingeklapptes Handy-Menü) nicht zu sehen ist. */
    var needFloat = !hosts.length || (!anySeen && wantsFloat);
    var fl = document.querySelector(".s58-ib.s58-fl");
    if (needFloat && !fl && document.body) {
      var f = document.createElement("button"); f.type = "button"; f.className = "s58-ib s58-fl"; f.addEventListener("click", onClick); document.body.appendChild(f);
      f.textContent = T.button; f.title = T.buttonHint; f.setAttribute("aria-label", T.buttonHint);
    } else if (!needFloat && fl) fl.remove();
  }

  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });
  window.addEventListener("appinstalled", function () {
    installed = true; deferred = null; ensureButtons(); toast(T.installedNote || "OK");
  });
  window.addEventListener("resize", ensureButtons);
  if (window.matchMedia) {
    var mq = matchMedia("(display-mode: standalone)");
    if (mq.addEventListener) mq.addEventListener("change", ensureButtons);
  }

  function start() {
    ensureButtons();
    new MutationObserver(function () { ensureButtons(); }).observe(document.body, { childList: true, subtree: true });
    fetch("/api/installieren/" + encodeURIComponent(L)).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (t) { T = Object.assign({}, NOT, t); labelAll(); }).catch(function () {});
    if (secure && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
