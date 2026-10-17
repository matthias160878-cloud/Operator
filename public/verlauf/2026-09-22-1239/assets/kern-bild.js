/**
 * Das Kernbild — die Plattform als Zeichnung.
 *
 * In der Mitte der Kern, darum die Bereiche der Registratur. Ein Impuls
 * wandert KERN -> BEREICH -> zurueck und zeigt, wie eine Aufgabe durchs
 * Haus geht.
 *
 * ---- Was hier echt ist und was nicht ----
 *
 * ECHT sind die Bereiche und ihre Zahlen: sie kommen aus /api/agenten, also
 * aus derselben Registratur, die auch die Agentenseite speist. Steht dort ein
 * Agent mehr, steht er hier auch.
 *
 * EINE DARSTELLUNG ist der wandernde Impuls. Er zeigt den Weg, nicht einen
 * laufenden Auftrag. Das steht auch unter dem Bild --- auf dieser Seite hat
 * schon einmal eine Animation Betriebszahlen vorgetaeuscht, und das kommt
 * nicht wieder.
 *
 * ---- Ruecksichten ----
 *
 * Ohne Antwort der Schnittstelle zeichnet das Bild gar nicht: lieber nichts
 * als erfundene Bereiche. Bei prefers-reduced-motion steht ein Einzelbild.
 * Im verborgenen Tab und ausserhalb des Sichtfelds wird nicht gerechnet.
 * Beschriftungen sind leise und werden erst beim Daraufzeigen deutlich.
 *
 * Ohne Abhaengigkeit, ohne Bilddatei.
 */
(function () {
  "use strict";

  var leinwand = document.getElementById("kernbild");
  if (!leinwand || !leinwand.getContext) return;

  var ctx = leinwand.getContext("2d");
  var ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FARBE = {
    grund: "#070A14", linie: "#2A3350", kern: "#F2C14E",
    knoten: "#8A7BFF", text: "#E8E6E1", leise: "#7C8399", impuls: "#4CC38A",
  };
  var SCHRIFT = "600 11px system-ui, sans-serif";
  var ZEILE = 13;          // Hoehe einer Beschriftungszeile
  var RAND = 5;            // so viel Luft bleibt zum Bildrand

  var bereiche = [];       // { name, kurz, zahl, winkel, x, y }
  var laeuft = false, sichtbar = true, imBild = true;
  var t = 0, impuls = null, gewaehlt = -1;
  var breite = 0, hoehe = 0, mitte = { x: 0, y: 0 }, radius = 0;

  function schmal() { return breite < 560; }

  /* Wo eine Beschriftung liegt. Eine einzige Stelle, damit das Nachmessen und
     das Zeichnen nie auseinanderlaufen --- sonst steht am Ende doch wieder ein
     Wort halb ausserhalb des Bildes. */
  function beschriftung(b, r, hell) {
    var c = Math.cos(b.winkel), s = Math.sin(b.winkel);
    var x = mitte.x + c * r, y = mitte.y + s * r;
    var eng = schmal();
    var raus = eng ? 17 : 20;
    var text = (eng ? b.kurz : b.name) + (hell ? " · " + b.zahl : "");
    ctx.font = SCHRIFT;
    var w = ctx.measureText(text).width;

    /* Schmal steht jede Beschriftung mittig ueber oder unter ihrem Knoten:
       so braucht sie nur die halbe Breite seitlich und nichts wird abgeschnitten. */
    var ausricht = eng ? "center"
      : (c < -0.25 ? "right" : c > 0.25 ? "left" : "center");
    var grund = eng ? (s >= 0 ? "top" : "bottom")
      : (s > 0.5 ? "top" : s < -0.5 ? "bottom" : "middle");
    var tx = eng ? x : x + c * raus;
    var ty = eng ? y + (s >= 0 ? raus : -raus) : y + s * raus;

    var links = ausricht === "left" ? tx : ausricht === "right" ? tx - w : tx - w / 2;
    var oben = grund === "top" ? ty : grund === "bottom" ? ty - ZEILE : ty - ZEILE / 2;
    return {
      text: text, x: tx, y: ty, ausricht: ausricht, grund: grund,
      links: links, rechts: links + w, oben: oben, unten: oben + ZEILE,
      knotenX: x, knotenY: y,
    };
  }

  /* Passt der Ring mit allen Beschriftungen ins Bild? Gemessen wird die
     hervorgehobene Fassung, die ist die breiteste. */
  function passt(r) {
    for (var i = 0; i < bereiche.length; i++) {
      var l = beschriftung(bereiche[i], r, true);
      if (l.links < RAND || l.rechts > breite - RAND) return false;
      if (l.oben < RAND || l.unten > hoehe - RAND) return false;
    }
    return true;
  }

  function messen() {
    var kasten = leinwand.getBoundingClientRect();
    var dpr = Math.min(devicePixelRatio || 1, 2);
    breite = Math.max(280, Math.round(kasten.width));
    hoehe = Math.max(240, Math.round(kasten.height));
    leinwand.width = Math.round(breite * dpr);
    leinwand.height = Math.round(hoehe * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mitte.x = breite / 2;
    mitte.y = hoehe / 2;
    stellen();
  }

  function stellen() {
    var n = bereiche.length || 1;
    for (var i = 0; i < bereiche.length; i++) {
      bereiche[i].winkel = -Math.PI / 2 + (i / n) * Math.PI * 2;
    }
    var r = Math.min(breite, hoehe) * (schmal() ? 0.31 : 0.34);
    while (r > 52 && !passt(r)) r -= 2;
    radius = r;
    for (var j = 0; j < bereiche.length; j++) {
      bereiche[j].x = mitte.x + Math.cos(bereiche[j].winkel) * radius;
      bereiche[j].y = mitte.y + Math.sin(bereiche[j].winkel) * radius;
    }
  }

  function naechster(x, y) {
    var beste = -1, kurzWeg = 44 * 44;
    for (var i = 0; i < bereiche.length; i++) {
      var dx = bereiche[i].x - x, dy = bereiche[i].y - y;
      var d = dx * dx + dy * dy;
      if (d < kurzWeg) { kurzWeg = d; beste = i; }
    }
    return beste;
  }

  function kreis(x, y, r, farbe, alpha) {
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = farbe;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function zeichnen() {
    ctx.clearRect(0, 0, breite, hoehe);
    var puls = ruhig ? 0.5 : (Math.sin(t / 34) + 1) / 2;

    /* Verbindungen. Der gewaehlte Strang wird deutlich, die uebrigen leise. */
    for (var i = 0; i < bereiche.length; i++) {
      var b = bereiche[i];
      var aktiv = gewaehlt === i || (impuls && impuls.ziel === i && impuls.t > 0.45);
      ctx.strokeStyle = aktiv ? FARBE.kern : FARBE.linie;
      ctx.globalAlpha = aktiv ? 0.85 : 0.5;
      ctx.lineWidth = aktiv ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(mitte.x, mitte.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* Der Kern. */
    kreis(mitte.x, mitte.y, 30 + puls * 7, FARBE.kern, 0.1 + puls * 0.06);
    kreis(mitte.x, mitte.y, 19, FARBE.kern, 0.95);
    ctx.fillStyle = FARBE.grund;
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Kern", mitte.x, mitte.y + 0.5);

    /* Die Bereiche. */
    for (var j = 0; j < bereiche.length; j++) {
      var s = bereiche[j];
      var hell = gewaehlt === j;
      kreis(s.x, s.y, hell ? 11 : 7, hell ? FARBE.kern : FARBE.knoten, hell ? 1 : 0.8);

      var l = beschriftung(s, radius, hell);
      ctx.font = SCHRIFT;
      ctx.textAlign = l.ausricht;
      ctx.textBaseline = l.grund;
      ctx.globalAlpha = hell ? 1 : 0.55;
      ctx.fillStyle = hell ? FARBE.text : FARBE.leise;
      ctx.fillText(l.text, l.x, l.y);
      ctx.globalAlpha = 1;
    }

    /* Der Impuls: Kern -> Bereich -> zurueck. */
    if (impuls) {
      var z = bereiche[impuls.ziel];
      var p = impuls.t <= 0.5 ? impuls.t * 2 : (1 - impuls.t) * 2;
      var px = mitte.x + (z.x - mitte.x) * p;
      var py = mitte.y + (z.y - mitte.y) * p;
      kreis(px, py, 4.5, FARBE.impuls, 0.95);
      kreis(px, py, 11, FARBE.impuls, 0.16);
    }
  }

  function schritt() {
    if (!laeuft) return;
    t++;
    if (!impuls && t % 46 === 0 && bereiche.length) {
      impuls = { ziel: Math.floor(Math.random() * bereiche.length), t: 0 };
    }
    if (impuls) {
      impuls.t += 0.014;
      if (impuls.t >= 1) impuls = null;
    }
    zeichnen();
    requestAnimationFrame(schritt);
  }

  function anhalten() {
    var soll = sichtbar && imBild && !ruhig;
    if (soll && !laeuft) { laeuft = true; requestAnimationFrame(schritt); }
    else if (!soll) { laeuft = false; if (ruhig) zeichnen(); }
  }

  leinwand.addEventListener("pointermove", function (e) {
    var k = leinwand.getBoundingClientRect();
    var neu = naechster(e.clientX - k.left, e.clientY - k.top);
    if (neu !== gewaehlt) { gewaehlt = neu; if (!laeuft) zeichnen(); }
  });
  leinwand.addEventListener("pointerleave", function () {
    gewaehlt = -1; if (!laeuft) zeichnen();
  });
  leinwand.addEventListener("pointerdown", function (e) {
    var k = leinwand.getBoundingClientRect();
    gewaehlt = naechster(e.clientX - k.left, e.clientY - k.top);
    if (!laeuft) zeichnen();
  });

  addEventListener("resize", function () { messen(); if (!laeuft) zeichnen(); });
  document.addEventListener("visibilitychange", function () {
    sichtbar = !document.hidden; anhalten();
  });
  if (typeof IntersectionObserver === "function") {
    new IntersectionObserver(function (e) {
      imBild = e[0].isIntersecting; anhalten();
    }, { threshold: 0.05 }).observe(leinwand);
  }

  /* Ein kurzer Name fuer schmale Bilder. Erst das Wort vor dem "und", und
     wenn das immer noch zu lang ist, der Schluessel der Registratur ---
     beides steht so in den Daten, erfunden wird nichts. */
  function kurzName(name, schluessel) {
    var erstes = String(name).split(" und ")[0].split(" ")[0];
    if (erstes.length <= 13) return erstes;
    var s = String(schluessel || erstes);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* Erst die Registratur, dann zeichnen. Ohne Antwort bleibt das Bild leer
     --- erfundene Bereiche waeren schlimmer als gar keine. */
  /* "knapp=1": nur Bereiche und Zahlen. Die volle Registratur waere 41 KB
     fuer sieben Beschriftungen. */
  fetch("api/agenten?knapp=1", { cache: "no-store" }).then(function (a) {
    if (!a.ok) throw new Error(a.status);
    return a.json();
  }).then(function (d) {
    /* Die knappe Form bringt die Zahl gleich mit. Kommt doch einmal die volle
       Antwort, wird gezaehlt --- dasselbe Ergebnis, nur umstaendlicher. */
    var jeKat = {};
    (d.agenten || []).forEach(function (x) { jeKat[x.kategorie] = (jeKat[x.kategorie] || 0) + 1; });
    bereiche = (d.kategorien || []).map(function (k) {
      var wieviele = typeof k.anzahl === "number" ? k.anzahl : (jeKat[k.schluessel] || 0);
      return {
        name: k.name,
        kurz: kurzName(k.name, k.schluessel),
        anzahl: wieviele,
        zahl: wieviele + " Agenten",
        winkel: 0, x: 0, y: 0,
      };
    }).filter(function (b) { return b.anzahl > 0; });
    if (!bereiche.length) return;

    /* Der Kopf der Startseite nennt die Gesamtzahl, das Bild hier die
       Registratur. Beide aus DIESER einen Antwort, damit die Startseite dafuer
       keinen zweiten Aufruf braucht --- und damit sie nie auseinanderlaufen.
       Fehlt die Angabe (aelterer Stand), bleibt stehen, was im HTML steht:
       lieber die Ortsangabe als eine geratene Zahl. */
    var zaehler = document.getElementById("r-agents");
    var kopf = document.getElementById("hero-agenten");
    if (typeof d.gesamt_alle === "number" && d.gesamt_alle > 0) {
      if (zaehler) zaehler.textContent = String(d.gesamt_alle);
      /* Vorangestellt, nicht ersetzend: die Ortsangabe steht im HTML und
         bleibt stehen. Ohne Messung bleibt das Element leer und die Zeile
         liest sich wie zuvor. */
      if (kopf) kopf.textContent = d.gesamt_alle + " Agenten · ";
    } else if (zaehler && zaehler.parentNode) {
      /* Kein Platzhalterstrich stehen lassen --- der sieht aus wie ein Fehler. */
      zaehler.parentNode.remove();
    }

    leinwand.hidden = false;
    var fuss = document.getElementById("kernbild-fuss");
    if (fuss) {
      fuss.textContent = d.gesamt + " Agenten in " + bereiche.length +
        " Bereichen — aus der Registratur gelesen. Der wandernde Punkt zeigt den Weg einer Aufgabe; er ist eine Darstellung, keine Betriebsdaten.";
    }
    messen();
    zeichnen();
    anhalten();
  }).catch(function () {
    var fuss = document.getElementById("kernbild-fuss");
    if (fuss) fuss.textContent = "Die Agentenliste ist gerade nicht abrufbar.";
  });
})();
