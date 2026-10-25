/* Web-Motion-Kit — das JavaScript zu motion.css. Keine Abhängigkeiten.
   Alles läuft über data-Attribute; neue Elemente nach dem Laden: WebMotion.init(element). */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("m-js");

  var ruhig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var feinZeiger = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  function alle(bereich, selektor) {
    var liste = Array.prototype.slice.call(bereich.querySelectorAll(selektor));
    if (bereich !== document && bereich.matches && bereich.matches(selektor)) liste.unshift(bereich);
    return liste;
  }

  function zahl(wert, ersatz) {
    var n = parseFloat(wert);
    return isFinite(n) ? n : ersatz;
  }

  /* ---------- Einblenden: data-motion, data-motion-delay, data-motion-stagger ---------- */

  var beobachter = null;
  if (!ruhig && "IntersectionObserver" in window) {
    beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting) {
          el.classList.add("m-sichtbar");
          if (!el.hasAttribute("data-motion-repeat")) beobachter.unobserve(el);
        } else if (el.hasAttribute("data-motion-repeat")) {
          el.classList.remove("m-sichtbar");
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  }

  function einblenden(bereich) {
    alle(bereich, "[data-motion-stagger]").forEach(function (eltern) {
      var schritt = zahl(eltern.getAttribute("data-motion-stagger"), 90);
      var art = eltern.getAttribute("data-motion-stagger-art") || "fade-up";
      Array.prototype.forEach.call(eltern.children, function (kind, i) {
        if (!kind.hasAttribute("data-motion")) kind.setAttribute("data-motion", art);
        if (!kind.hasAttribute("data-motion-delay")) kind.setAttribute("data-motion-delay", String(i * schritt));
      });
    });

    alle(bereich, "[data-motion]").forEach(function (el) {
      var v = el.getAttribute("data-motion-delay");
      if (v) el.style.setProperty("--m-verzoegerung", zahl(v, 0) + "ms");
      var d = el.getAttribute("data-motion-duration");
      if (d) el.style.setProperty("--m-dauer", zahl(d, 700) + "ms");
      if (beobachter) beobachter.observe(el);
      else el.classList.add("m-sichtbar");
    });
  }

  /* ---------- Wörter einzeln einblenden: data-split="fade-up" ---------- */

  function zerlegen(bereich) {
    alle(bereich, "[data-split]").forEach(function (el) {
      if (el.getAttribute("data-split-fertig")) return;
      el.setAttribute("data-split-fertig", "1");
      el.setAttribute("aria-label", el.textContent.trim());
      var art = el.getAttribute("data-split") || "fade-up";
      var schritt = zahl(el.getAttribute("data-split-stagger"), 70);
      var woerter = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      woerter.forEach(function (wort, i) {
        var span = document.createElement("span");
        span.className = "m-split-wort";
        span.setAttribute("aria-hidden", "true");
        span.setAttribute("data-motion", art);
        span.setAttribute("data-motion-delay", String(i * schritt));
        span.textContent = wort + (i < woerter.length - 1 ? " " : "");
        el.appendChild(span);
      });
    });
  }

  /* ---------- Zähler: data-count-to="1200" (+ data-count-prefix, data-count-suffix, data-count-dauer) ---------- */

  function zaehler(bereich) {
    alle(bereich, "[data-count-to]").forEach(function (el) {
      var ziel = zahl(el.getAttribute("data-count-to"), 0);
      var nachkomma = (String(el.getAttribute("data-count-to")).split(".")[1] || "").length;
      var prefix = el.getAttribute("data-count-prefix") || "";
      var suffix = el.getAttribute("data-count-suffix") || "";
      var dauer = zahl(el.getAttribute("data-count-dauer"), 1800);
      var format = new Intl.NumberFormat(document.documentElement.lang || "de-DE", {
        minimumFractionDigits: nachkomma, maximumFractionDigits: nachkomma
      });
      function zeigen(w) { el.textContent = prefix + format.format(w) + suffix; }
      if (ruhig || !("IntersectionObserver" in window)) { zeigen(ziel); return; }
      zeigen(0);
      var io = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return;
        io.disconnect();
        var start = performance.now();
        (function bild(jetzt) {
          var t = Math.min(1, (jetzt - start) / dauer);
          zeigen(ziel * (1 - Math.pow(1 - t, 3)));
          if (t < 1) requestAnimationFrame(bild);
        })(start);
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

  /* ---------- Schreibmaschine: data-typewriter="Wort eins|Wort zwei|Wort drei" ---------- */

  function schreibmaschine(bereich) {
    alle(bereich, "[data-typewriter]").forEach(function (el) {
      var woerter = el.getAttribute("data-typewriter").split("|").map(function (w) { return w.trim(); }).filter(Boolean);
      if (!woerter.length) return;
      el.setAttribute("aria-label", woerter.join(", "));
      if (ruhig) { el.textContent = woerter[0]; return; }
      var tempo = zahl(el.getAttribute("data-typewriter-speed"), 80);
      var pause = zahl(el.getAttribute("data-typewriter-pause"), 1600);
      var i = 0, n = 0, loeschen = false;
      (function tick() {
        var wort = woerter[i];
        n += loeschen ? -1 : 1;
        el.textContent = wort.slice(0, n);
        var warte = loeschen ? tempo / 2 : tempo;
        if (!loeschen && n === wort.length) { loeschen = true; warte = pause; }
        else if (loeschen && n === 0) { loeschen = false; i = (i + 1) % woerter.length; warte = tempo * 4; }
        setTimeout(tick, warte);
      })();
    });
  }

  /* ---------- Farbzyklus: data-color-cycle="#f00,#0f0,#00f" (+ data-color-cycle-prop, -dauer) ---------- */

  function farbzyklus(bereich) {
    alle(bereich, "[data-color-cycle]").forEach(function (el) {
      var farben = el.getAttribute("data-color-cycle").split(",").map(function (f) { return f.trim(); }).filter(Boolean);
      if (farben.length < 2) return;
      var eigenschaft = el.getAttribute("data-color-cycle-prop") || "background-color";
      var dauer = zahl(el.getAttribute("data-color-cycle-dauer"), 3000);
      el.style.setProperty(eigenschaft, farben[0]);
      if (ruhig) return;
      el.style.transition = eigenschaft + " " + Math.round(dauer * 0.8) + "ms ease-in-out";
      var i = 0;
      setInterval(function () {
        i = (i + 1) % farben.length;
        el.style.setProperty(eigenschaft, farben[i]);
      }, dauer);
    });
  }

  /* ---------- Farbwechsel beim Scrollen: Abschnitte mit data-scroll-color="#hintergrund" (+ data-scroll-text) ---------- */

  function scrollFarben(bereich) {
    var abschnitte = alle(bereich, "[data-scroll-color]");
    if (!abschnitte.length || !("IntersectionObserver" in window)) return;
    var ziel = document.querySelector("[data-scroll-color-target]") || document.body;
    ziel.classList.add("m-scroll-color");
    var io = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        ziel.style.backgroundColor = e.target.getAttribute("data-scroll-color");
        var text = e.target.getAttribute("data-scroll-text");
        if (text) ziel.style.color = text;
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    abschnitte.forEach(function (a) { io.observe(a); });
  }

  /* ---------- Parallax: data-parallax="0.3" (negativ = gegenläufig) ---------- */

  var parallaxListe = [];
  function parallax(bereich) {
    if (ruhig) return;
    alle(bereich, "[data-parallax]").forEach(function (el) {
      parallaxListe.push({ el: el, faktor: zahl(el.getAttribute("data-parallax"), 0.2) });
    });
  }

  /* ---------- Fortschrittsbalken: <div class="m-scroll-progress"></div> ---------- */

  var fortschritt = [];
  function fortschrittsbalken(bereich) {
    fortschritt = fortschritt.concat(alle(bereich, ".m-scroll-progress"));
  }

  var geplant = false;
  function beimScrollen() {
    if (geplant) return;
    geplant = true;
    requestAnimationFrame(function () {
      geplant = false;
      var hoehe = window.innerHeight;
      // Ganz unten angekommen: Was knapp über dem Seitenende steht, erreicht den Einblend-Bereich nie — jetzt zeigen.
      if (beobachter && window.scrollY + hoehe >= document.documentElement.scrollHeight - 2) {
        document.querySelectorAll("[data-motion]:not(.m-sichtbar)").forEach(function (el) {
          el.classList.add("m-sichtbar");
          if (!el.hasAttribute("data-motion-repeat")) beobachter.unobserve(el);
        });
      }
      parallaxListe.forEach(function (p) {
        var r = p.el.getBoundingClientRect();
        var mitte = r.top + r.height / 2 - hoehe / 2;
        p.el.style.transform = "translate3d(0," + (mitte * -p.faktor).toFixed(1) + "px,0)";
      });
      if (fortschritt.length) {
        var max = document.documentElement.scrollHeight - hoehe;
        var wert = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        fortschritt.forEach(function (b) { b.style.setProperty("--m-fortschritt", wert.toFixed(4)); });
      }
    });
  }

  // Elemente mit data-motion bekommen den kurzen Folge-Übergang erst jetzt, sonst würde er das Einblenden verdrängen.
  function folgeUebergang(el) {
    if (el.hasAttribute("data-motion")) el.style.transition = "transform 300ms cubic-bezier(.22, 1, .36, 1), opacity 300ms";
  }

  /* ---------- 3D-Kippen: data-tilt="10" (Grad) ---------- */

  function kippen(bereich) {
    if (ruhig || !feinZeiger) return;
    alle(bereich, "[data-tilt]").forEach(function (el) {
      var grad = zahl(el.getAttribute("data-tilt"), 10) || 10;
      el.addEventListener("pointerenter", function () { folgeUebergang(el); });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(900px) rotateX(" + (-y * grad).toFixed(2) + "deg) rotateY(" + (x * grad).toFixed(2) + "deg)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Magnetischer Button: data-magnetic="0.35" ---------- */

  function magnet(bereich) {
    if (ruhig || !feinZeiger) return;
    alle(bereich, "[data-magnetic]").forEach(function (el) {
      var staerke = zahl(el.getAttribute("data-magnetic"), 0.35) || 0.35;
      el.addEventListener("pointerenter", function () { folgeUebergang(el); });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (x * staerke).toFixed(1) + "px," + (y * staerke).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Laufband: .m-marquee > .m-marquee-spur ---------- */

  function laufband(bereich) {
    alle(bereich, ".m-marquee-spur").forEach(function (spur) {
      if (spur.getAttribute("data-m-verdoppelt")) return;
      spur.setAttribute("data-m-verdoppelt", "1");
      Array.prototype.slice.call(spur.children).forEach(function (k) {
        var kopie = k.cloneNode(true);
        kopie.setAttribute("aria-hidden", "true");
        spur.appendChild(kopie);
      });
    });
  }

  function init(bereich) {
    bereich = bereich || document;
    zerlegen(bereich);
    einblenden(bereich);
    zaehler(bereich);
    schreibmaschine(bereich);
    farbzyklus(bereich);
    scrollFarben(bereich);
    parallax(bereich);
    fortschrittsbalken(bereich);
    kippen(bereich);
    magnet(bereich);
    laufband(bereich);
    beimScrollen();
  }

  window.addEventListener("scroll", beimScrollen, { passive: true });
  window.addEventListener("resize", beimScrollen);

  window.WebMotion = { init: init, reduziert: ruhig };

  // Seiten, die ihren Inhalt selbst per JS aufbauen, setzen <html data-motion-manuell> und rufen WebMotion.init(bereich) selbst auf.
  if (root.hasAttribute("data-motion-manuell")) return;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); });
  else init();
})();
