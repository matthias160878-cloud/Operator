/**
 * Lebender Seitenhintergrund.
 *
 * Vierzehn Motive. Nur ausgewählte Seiten bekommen einen Hintergrund. Die Seite wählt über `data-grund` am <body>:
 *
 *     <body data-grund="leiterbahnen" data-grund-staerke="40">
 *
 * Gezeichnet wird auf ein <canvas id="grund">, das per CSS hinter allem liegt
 * (`z-index:-1`). Es gibt keine Bilddateien — alles entsteht beim Aufruf.
 *
 * Zwei Dinge sind nicht verhandelbar und stehen deshalb am Anfang:
 * bei `prefers-reduced-motion` steht das Bild still, und im verborgenen Tab
 * wird gar nicht gezeichnet. Beides kostet sonst Menschen bzw. Akku.
 */
(function () {
  "use strict";

  var cv = document.getElementById("grund");
  if (!cv || !cv.getContext) return;

  var motiv = document.body.getAttribute("data-grund") || "aus";
  /* "aus" heisst hier nicht abbrechen: der Griff unten kann spaeter
     ein Motiv setzen. Gezeichnet wird solange nichts. */

  /* Der Besucher darf die Bewegung fuer sich abstellen. Seine Wahl gilt vor
     allem anderen und bleibt im Browser stehen — auch ueber Seitenwechsel. */
  var SCHLUESSEL = "s58-grund-aus";
  function besucherAus() {
    try { return localStorage.getItem(SCHLUESSEL) === "1"; } catch (e) { return false; }
  }
  function besucherSetzen(aus) {
    try { localStorage.setItem(SCHLUESSEL, aus ? "1" : "0"); } catch (e) { /* egal */ }
  }

  var cx = cv.getContext("2d");

  /* Heller oder dunkler Grund? Die Zentrale ist hell, die Webseite dunkel —
     dieselben Motive brauchen dafuer verschiedene Farben, sonst sind sie auf
     einer der beiden unsichtbar. Gemessen wird die Helligkeit des Grundes. */
  var HELL = (function () {
    var bg = getComputedStyle(document.body).backgroundColor || "";
    var m = bg.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) return false;
    var l = (0.299 * +m[1] + 0.587 * +m[2] + 0.114 * +m[3]);
    return l > 128;
  })();

  var T = {
    f0: HELL ? "rgba(16,120,110," : "rgba(79,214,200,",
    f1: HELL ? "rgba(92,78,190," : "rgba(200,190,255,",
    f2: HELL ? "rgba(20,130,78," : "rgba(46,212,122,",
    f3: HELL ? "rgba(170,108,8," : "rgba(245,174,60,",
    f4: HELL ? "rgba(70,90,115," : "rgba(210,225,245,",
    f5: HELL ? "rgba(165,105,20," : "rgba(245,190,110,",
    f6: HELL ? "rgba(18,132,96," : "rgba(160,255,210,",
    f7: HELL ? "rgba(88,76,200," : "rgba(123,108,246,",
    f8: HELL ? "rgba(55,75,100," : "rgba(235,245,255,",
    f9: HELL ? "rgba(60,85,110," : "rgba(225,240,255,",
    f10: HELL ? "rgba(52,88,118," : "rgba(210,240,255,",
    f11: HELL ? "rgba(38,108,138," : "rgba(190,240,255,",
    f12: HELL ? "rgba(24,122,88," : "rgba(160,240,200,",
    f13: HELL ? "rgba(44,92,148," : "rgba(143,200,255,",
    h0: HELL ? "#1E8A80" : "#4FD6C8",
    h1: HELL ? "#5A4CC8" : "#7B6CF6",
    h2: HELL ? "#B8760A" : "#F5AE3C",
    h3: HELL ? "#B04E77" : "#E58BB0",
    h4: HELL ? "#17864E" : "#2ED47A",
  };


  var reduziert = window.matchMedia &&
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var staerke = (parseFloat(document.body.getAttribute("data-grund-staerke")) || 45) / 100;
  var tempo = (parseFloat(document.body.getAttribute("data-grund-tempo")) || 100) / 100;
  var laeuft = !reduziert;

  var B = 0, H = 0, dpr = 1, t = 0, teile = {};
  var aus = besucherAus();   // zusammengefasster Zustand: an oder aus

  function messen() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    B = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(B * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    aufbauen();
  }

  function menge(n) {
    var mp = (B * H) / 1000000;
    return Math.round(Math.min(n, n * mp * 1.4));
  }

  function aufbauen() {
    teile = {
      knoten: reihe(menge(90), function () {
        return { x: Math.random() * B, y: Math.random() * H,
                 vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
                 r: Math.random() * 1.4 + .5 };
      }),
      bahnen: reihe(menge(26), function () {
        var y1 = Math.random() * H;
        return { x1: -40, y1: y1, x2: Math.random() * B,
                 y2: y1 + (Math.random() - .5) * H * .5, x3: B + 40,
                 puls: Math.random(), v: Math.random() * .004 + .0015 };
      }),
      faeden: reihe(menge(34), fadenBauen),
      funken: reihe(menge(230), function () {
        return { x: Math.random() * B, y: Math.random() * H,
                 v: Math.random() * .9 + .25, r: Math.random() * 1.6 + .5,
                 s: Math.random() * .9 + .2, ph: Math.random() * 6.3 };
      }),
      orbiter: reihe(menge(70), function () {
        return { ring: Math.floor(Math.random() * 5), w: Math.random() * 6.3,
                 v: (Math.random() * .0035 + .0012) * (Math.random() < .5 ? 1 : -1),
                 r: Math.random() * 1.6 + .8 };
      }),
      zellen: reihe(menge(44), function () {
        return { x: Math.random() * B, y: Math.random() * H,
                 vx: (Math.random() - .5) * .10, vy: (Math.random() - .5) * .10 };
      }),
      gitterpunkte: reihe(menge(72), function () {
        return { x: Math.random() * B, y: Math.random() * H,
                 vx: (Math.random() - .5) * .16, vy: (Math.random() - .5) * .16 };
      }),
      bauteile: reihe(menge(300), function () {
        return { x: Math.random() * B, y: Math.random() * H,
                 w: Math.random() * 16 + 8, h: Math.random() * 8 + 4,
                 quer: Math.random() < .5, ph: Math.random() * 6.3 };
      }),
      wurzeln: reihe(menge(58), wurzelBauen),
      kugeln: reihe(menge(20), function (i) {
        var f = [T.h0, T.h1, T.h2, T.h3, T.h4][i % 5];
        return { x: Math.random() * B, y: Math.random() * H, r: Math.random() * 26 + 10,
                 vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .18, f: f };
      }),
      tropfen: reihe(menge(700), function () {
        return { x: Math.random() * B, y: Math.random() * H,
                 v: Math.random() * 2.2 + .8, r: Math.random() * 1.9 + .9,
                 o: Math.random() * .6 + .3 };
      }),
      wolken: reihe(7, function (i) {
        var f = [T.h0, T.h1, T.h2, T.h3, T.h4][i % 5];
        return { x: Math.random() * B, y: Math.random() * H,
                 r: Math.random() * 260 + 180,
                 vx: (Math.random() - .5) * .14, vy: (Math.random() - .5) * .14, f: f };
      })
    };
  }

  function reihe(n, bau) {
    var out = [], i;
    for (i = 0; i < n; i++) out.push(bau(i));
    return out;
  }

  function fadenBauen() {
    var aeste = [];
    function zweig(x, y, w, len, tiefe) {
      if (tiefe > 3 || len < 12) return;
      var ex = x + Math.cos(w) * len, ey = y + Math.sin(w) * len;
      aeste.push({ x: x, y: y, ex: ex, ey: ey, tiefe: tiefe });
      zweig(ex, ey, w + (Math.random() * .9 - .2), len * .72, tiefe + 1);
      if (Math.random() > .35) zweig(ex, ey, w - (Math.random() * .9 - .2), len * .66, tiefe + 1);
    }
    zweig(Math.random() * B, Math.random() * H, Math.random() * Math.PI * 2,
          Math.random() * 70 + 50, 0);
    return { aeste: aeste, ph: Math.random() * Math.PI * 2 };
  }

  /** Wurzeln wachsen vom unteren Rand nach oben — feiner und dichter
      verzweigt als die Nervenfäden, und sie haben eine Richtung. */
  function wurzelBauen() {
    var aeste = [];
    function zweig(x, y, w, len, tiefe) {
      if (tiefe > 5 || len < 6) return;
      var ex = x + Math.cos(w) * len, ey = y + Math.sin(w) * len;
      aeste.push({ x: x, y: y, ex: ex, ey: ey, tiefe: tiefe });
      zweig(ex, ey, w + (Math.random() * .6 - .3), len * .78, tiefe + 1);
      if (Math.random() > .3) zweig(ex, ey, w - (Math.random() * .7 - .25), len * .7, tiefe + 1);
    }
    zweig(Math.random() * B, H + 10, -Math.PI / 2 + (Math.random() - .5) * .8,
          Math.random() * 46 + 30, 0);
    return { aeste: aeste, ph: Math.random() * 6.3 };
  }

  /* ---------- die Motive ---------- */

  function konstellation(a) {
    var k = teile.knoten, i, j, p;
    for (i = 0; i < k.length; i++) {
      p = k[i];
      if (laeuft) {
        p.x += p.vx * tempo; p.y += p.vy * tempo;
        if (p.x < 0) p.x += B; if (p.x > B) p.x -= B;
        if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;
      }
    }
    cx.lineWidth = 1;
    for (i = 0; i < k.length; i++) for (j = i + 1; j < k.length; j++) {
      var dx = k[i].x - k[j].x, dy = k[i].y - k[j].y, d2 = dx * dx + dy * dy;
      if (d2 < 15000) {
        cx.strokeStyle = T.f0 + "" + (a * .30 * (1 - d2 / 15000)).toFixed(3) + ")";
        cx.beginPath(); cx.moveTo(k[i].x, k[i].y); cx.lineTo(k[j].x, k[j].y); cx.stroke();
      }
    }
    var mx = B * .68, my = H * .38;
    var g = cx.createRadialGradient(mx, my, 0, mx, my, Math.min(B, H) * .30);
    g.addColorStop(0, T.f0 + "" + (a * .20).toFixed(3) + ")");
    g.addColorStop(1, T.f0 + "0)");
    cx.fillStyle = g; cx.fillRect(0, 0, B, H);
    for (i = 0; i < 26; i++) {
      var w = (i / 26) * Math.PI * 2 + t * .0006 * tempo;
      var l = Math.min(B, H) * (.18 + .12 * Math.sin(t * .008 + i));
      cx.strokeStyle = T.f13 + "" + (a * .16).toFixed(3) + ")";
      cx.beginPath(); cx.moveTo(mx, my);
      cx.lineTo(mx + Math.cos(w) * l, my + Math.sin(w) * l); cx.stroke();
    }
    cx.fillStyle = T.f10 + "" + (a * .55).toFixed(3) + ")";
    for (i = 0; i < k.length; i++) {
      cx.beginPath(); cx.arc(k[i].x, k[i].y, k[i].r, 0, 7); cx.fill();
    }
  }

  function leiterbahnen(a) {
    cx.lineWidth = 1.3; cx.lineJoin = "round";
    for (var i = 0; i < teile.bahnen.length; i++) {
      var b = teile.bahnen[i];
      var ri = (b.y2 - b.y1) >= 0 ? 1 : -1;
      cx.strokeStyle = T.f2 + "" + (a * .20).toFixed(3) + ")";
      cx.beginPath();
      cx.moveTo(b.x1, b.y1); cx.lineTo(b.x2 - 14, b.y1);
      cx.lineTo(b.x2, b.y1 + 14 * ri); cx.lineTo(b.x2, b.y2 - 14 * ri);
      cx.lineTo(b.x2 + 14, b.y2); cx.lineTo(b.x3, b.y2);
      cx.stroke();
      cx.fillStyle = T.f3 + "" + (a * .40).toFixed(3) + ")";
      cx.beginPath(); cx.arc(b.x2, (b.y1 + b.y2) / 2, 2.4, 0, 7); cx.fill();

      if (laeuft) { b.puls += b.v * tempo; if (b.puls > 1) b.puls -= 1; }
      var px, py;
      if (b.puls < .5) { px = b.x1 + (b.x2 - b.x1) * (b.puls / .5); py = b.y1; }
      else { px = b.x2 + (b.x3 - b.x2) * ((b.puls - .5) / .5); py = b.y2; }
      var gg = cx.createRadialGradient(px, py, 0, px, py, 11);
      gg.addColorStop(0, T.f6 + "" + (a * .75).toFixed(3) + ")");
      gg.addColorStop(1, T.f6 + "0)");
      cx.fillStyle = gg; cx.beginPath(); cx.arc(px, py, 11, 0, 7); cx.fill();
    }
  }

  function faeden(a) {
    for (var i = 0; i < teile.faeden.length; i++) {
      var f = teile.faeden[i];
      var atem = laeuft ? (.7 + .3 * Math.sin(t * .012 * tempo + f.ph)) : .85;
      for (var j = 0; j < f.aeste.length; j++) {
        var s = f.aeste[j];
        cx.lineWidth = Math.max(.6, 2.4 - s.tiefe * .6);
        cx.strokeStyle = T.f7 + "" +
          (a * .60 * atem / (s.tiefe * .5 + 1)).toFixed(3) + ")";
        cx.beginPath(); cx.moveTo(s.x, s.y); cx.lineTo(s.ex, s.ey); cx.stroke();
        if (s.tiefe >= 2) {
          var g = cx.createRadialGradient(s.ex, s.ey, 0, s.ex, s.ey, 7);
          g.addColorStop(0, T.f1 + "" + (a * .55 * atem).toFixed(3) + ")");
          g.addColorStop(1, T.f1 + "0)");
          cx.fillStyle = g; cx.beginPath(); cx.arc(s.ex, s.ey, 7, 0, 7); cx.fill();
        }
      }
    }
  }

  function nebel(a) {
    cx.globalCompositeOperation = "lighter";
    for (var i = 0; i < teile.wolken.length; i++) {
      var w = teile.wolken[i];
      if (laeuft) {
        w.x += w.vx * tempo; w.y += w.vy * tempo;
        if (w.x < -w.r) w.x = B + w.r; if (w.x > B + w.r) w.x = -w.r;
        if (w.y < -w.r) w.y = H + w.r; if (w.y > H + w.r) w.y = -w.r;
      }
      var hex = Math.round(a * 46).toString(16);
      if (hex.length < 2) hex = "0" + hex;
      var g = cx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r);
      g.addColorStop(0, w.f + hex);
      g.addColorStop(1, w.f + "00");
      cx.fillStyle = g; cx.beginPath(); cx.arc(w.x, w.y, w.r, 0, 7); cx.fill();
    }
    cx.globalCompositeOperation = "source-over";
  }

  /* ---------- sieben weitere Motive ----------
     Damit keine Seite dieselbe Zeichnung bekommt wie eine andere. Jedes
     bewegt sich anders: waagrecht, senkrecht, kreisend, aufsteigend. */

  /** Funken — steigen auf, im Gegensatz zum fallenden Datenstrom. */
  function funken(a) {
    for (var i = 0; i < teile.funken.length; i++) {
      var f = teile.funken[i];
      if (laeuft) {
        f.y -= f.v * tempo;
        f.x += Math.sin(t * .01 * tempo + f.ph) * .25 * f.s;
        if (f.y < -10) { f.y = H + 10; f.x = Math.random() * B; }
      }
      var g = cx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 5);
      g.addColorStop(0, T.f5 + "" + (a * 1.35 * f.s).toFixed(3) + ")");
      g.addColorStop(1, T.f3 + "0)");
      cx.fillStyle = g; cx.beginPath(); cx.arc(f.x, f.y, f.r * 5, 0, 7); cx.fill();
    }
  }

  /** Umlaufbahnen — konzentrische Ellipsen mit wandernden Punkten. */
  function orbits(a) {
    var mx = B / 2, my = H / 2, gr = Math.min(B, H) * .11, i;
    for (i = 1; i <= 5; i++) {
      cx.strokeStyle = T.f7 + "" + (a * .45).toFixed(3) + ")";
      cx.lineWidth = 1;
      cx.beginPath(); cx.ellipse(mx, my, gr * i * 1.5, gr * i * .95, 0, 0, 7); cx.stroke();
    }
    for (i = 0; i < teile.orbiter.length; i++) {
      var o = teile.orbiter[i];
      if (laeuft) o.w += o.v * tempo;
      var rr = gr * (o.ring + 1);
      var x = mx + Math.cos(o.w) * rr * 1.5, y = my + Math.sin(o.w) * rr * .95;
      var g = cx.createRadialGradient(x, y, 0, x, y, 9);
      g.addColorStop(0, T.f1 + "" + (a * .75).toFixed(3) + ")");
      g.addColorStop(1, T.f1 + "0)");
      cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, 9, 0, 7); cx.fill();
    }
  }

  /** Zellen — Punkte, die ihre Nachbarn in einem Netz aus Häuten halten. */
  function zellen(a) {
    var z = teile.zellen, i, j;
    for (i = 0; i < z.length; i++) {
      if (laeuft) {
        z[i].x += z[i].vx * tempo; z[i].y += z[i].vy * tempo;
        if (z[i].x < 0 || z[i].x > B) z[i].vx *= -1;
        if (z[i].y < 0 || z[i].y > H) z[i].vy *= -1;
      }
    }
    cx.lineWidth = 1;
    for (i = 0; i < z.length; i++) {
      var nah = [];
      for (j = 0; j < z.length; j++) {
        if (i === j) continue;
        var dx = z[i].x - z[j].x, dy = z[i].y - z[j].y;
        nah.push({ d: dx * dx + dy * dy, p: z[j] });
      }
      nah.sort(function (u, v) { return u.d - v.d; });
      for (j = 0; j < Math.min(3, nah.length); j++) {
        cx.strokeStyle = T.f2 + "" + (a * .62).toFixed(3) + ")";
        cx.beginPath(); cx.moveTo(z[i].x, z[i].y);
        cx.lineTo(nah[j].p.x, nah[j].p.y); cx.stroke();
      }
      cx.fillStyle = T.f12 + "" + (a * .95).toFixed(3) + ")";
      cx.beginPath(); cx.arc(z[i].x, z[i].y, 2, 0, 7); cx.fill();
    }
  }

  /** Punktraster — regelmäßig, mit einer Welle, die hindurchläuft. */
  function gitter(a) {
    var schritt = 24, x, y;
    for (y = schritt / 2; y < H; y += schritt) {
      for (x = schritt / 2; x < B; x += schritt) {
        var d = Math.sin((x + y) * .012 - t * .02 * tempo);
        var hell = a * (.18 + .42 * Math.max(0, d));
        cx.fillStyle = T.f4 + "" + hell.toFixed(3) + ")";
        cx.beginPath(); cx.arc(x, y, 1.1 + Math.max(0, d) * 1.5, 0, 7); cx.fill();
      }
    }
  }

  /* ---------- sechs Motive nach den kleinen Vorschaubildern ---------- */

  /** Drahtgitter — ein Netz aus Dreiecken, das langsam wandert. */
  function drahtgitter(a) {
    var g = teile.gitterpunkte, i, j, k;
    for (i = 0; i < g.length; i++) {
      if (laeuft) {
        g[i].x += g[i].vx * tempo; g[i].y += g[i].vy * tempo;
        if (g[i].x < 0 || g[i].x > B) g[i].vx *= -1;
        if (g[i].y < 0 || g[i].y > H) g[i].vy *= -1;
      }
    }
    cx.lineWidth = 1;
    for (i = 0; i < g.length; i++) {
      var nah = [];
      for (j = 0; j < g.length; j++) {
        if (i === j) continue;
        var dx = g[i].x - g[j].x, dy = g[i].y - g[j].y;
        nah.push({ d: dx * dx + dy * dy, p: g[j] });
      }
      nah.sort(function (u, v) { return u.d - v.d; });
      /* Dreiecke statt einzelner Linien: Nachbar 1 und 2 auch untereinander. */
      for (k = 0; k < Math.min(2, nah.length); k++) {
        cx.strokeStyle = T.f4 + "" + (a * .62).toFixed(3) + ")";
        cx.beginPath(); cx.moveTo(g[i].x, g[i].y);
        cx.lineTo(nah[k].p.x, nah[k].p.y); cx.stroke();
      }
      if (nah.length > 1) {
        cx.strokeStyle = T.f4 + "" + (a * .34).toFixed(3) + ")";
        cx.beginPath(); cx.moveTo(nah[0].p.x, nah[0].p.y);
        cx.lineTo(nah[1].p.x, nah[1].p.y); cx.stroke();
      }
      cx.fillStyle = T.f8 + "" + (a * 1.0).toFixed(3) + ")";
      cx.beginPath(); cx.arc(g[i].x, g[i].y, 1.6, 0, 7); cx.fill();
    }
  }

  /** Strahlenbündel — Linien laufen auf einen Punkt zu, mit Knoten darauf. */
  function strahlen(a) {
    var mx = B * .30, my = H * .52, i;
    for (i = 0; i < 44; i++) {
      var w = (i / 44) * Math.PI * 2 + (laeuft ? t * .0004 * tempo : .3);
      var weit = Math.max(B, H) * 1.1;
      var g = cx.createLinearGradient(mx, my, mx + Math.cos(w) * weit, my + Math.sin(w) * weit);
      g.addColorStop(0, T.f0 + "" + (a * .40).toFixed(3) + ")");
      g.addColorStop(1, T.f0 + "0)");
      cx.strokeStyle = g; cx.lineWidth = 1.1;
      cx.beginPath(); cx.moveTo(mx, my);
      cx.lineTo(mx + Math.cos(w) * weit, my + Math.sin(w) * weit); cx.stroke();

      /* ein Knoten je Strahl, der langsam nach außen wandert */
      var lauf = ((t * .0009 * tempo + i * .137) % 1);
      var kx = mx + Math.cos(w) * weit * lauf * .55;
      var ky = my + Math.sin(w) * weit * lauf * .55;
      cx.fillStyle = T.f11 + "" + (a * .5 * (1 - lauf)).toFixed(3) + ")";
      cx.beginPath(); cx.arc(kx, ky, 2, 0, 7); cx.fill();
    }
  }

  /** Bauteile — Platine mit Chips und Pads, nicht nur mit Bahnen. */
  function bauteile(a) {
    var i;
    cx.lineWidth = 1;
    for (i = 0; i < teile.bauteile.length; i++) {
      var s = teile.bauteile[i];
      var w = s.quer ? s.w : s.h, h = s.quer ? s.h : s.w;
      cx.strokeStyle = T.f2 + "" + (a * .95).toFixed(3) + ")";
      cx.strokeRect(s.x - w / 2, s.y - h / 2, w, h);
      /* zwei Anschlussbeine */
      cx.beginPath();
      if (s.quer) {
        cx.moveTo(s.x - w / 2 - 7, s.y); cx.lineTo(s.x - w / 2, s.y);
        cx.moveTo(s.x + w / 2, s.y); cx.lineTo(s.x + w / 2 + 7, s.y);
      } else {
        cx.moveTo(s.x, s.y - h / 2 - 7); cx.lineTo(s.x, s.y - h / 2);
        cx.moveTo(s.x, s.y + h / 2); cx.lineTo(s.x, s.y + h / 2 + 7);
      }
      cx.stroke();
      var puls = laeuft ? (.4 + .6 * Math.abs(Math.sin(t * .014 * tempo + s.ph))) : .7;
      cx.fillStyle = T.f3 + "" + (a * 1.1 * puls).toFixed(3) + ")";
      cx.beginPath(); cx.arc(s.x, s.y, 1.8, 0, 7); cx.fill();
    }
  }

  /** Wurzelwerk — wächst vom unteren Rand nach oben, fein und golden. */
  function wurzeln(a) {
    for (var i = 0; i < teile.wurzeln.length; i++) {
      var f = teile.wurzeln[i];
      var atem = laeuft ? (.75 + .25 * Math.sin(t * .008 * tempo + f.ph)) : .9;
      for (var j = 0; j < f.aeste.length; j++) {
        var s = f.aeste[j];
        cx.lineWidth = Math.max(.5, 1.8 - s.tiefe * .3);
        cx.strokeStyle = T.f5 + "" +
          (a * .85 * atem / (s.tiefe * .35 + 1)).toFixed(3) + ")";
        cx.beginPath(); cx.moveTo(s.x, s.y); cx.lineTo(s.ex, s.ey); cx.stroke();
      }
    }
  }

  /** Kugeln — weiche Körper mit Licht von oben, nicht flache Wolken. */
  function kugeln(a) {
    for (var i = 0; i < teile.kugeln.length; i++) {
      var k = teile.kugeln[i];
      if (laeuft) {
        k.x += k.vx * tempo; k.y += k.vy * tempo;
        if (k.x < -k.r) k.x = B + k.r; if (k.x > B + k.r) k.x = -k.r;
        if (k.y < -k.r) k.y = H + k.r; if (k.y > H + k.r) k.y = -k.r;
      }
      var g = cx.createRadialGradient(k.x - k.r * .35, k.y - k.r * .35, k.r * .1,
                                      k.x, k.y, k.r);
      var hex = Math.round(a * 215).toString(16); if (hex.length < 2) hex = "0" + hex;
      g.addColorStop(0, k.f + hex);
      g.addColorStop(1, k.f + "00");
      cx.fillStyle = g; cx.beginPath(); cx.arc(k.x, k.y, k.r, 0, 7); cx.fill();
    }
  }

  /** Punktregen — einzelne Tropfen statt durchgehender Spuren. */
  function punktregen(a) {
    for (var i = 0; i < teile.tropfen.length; i++) {
      var d = teile.tropfen[i];
      if (laeuft) {
        d.y += d.v * tempo;
        if (d.y > H + 4) { d.y = -4; d.x = Math.random() * B; }
      }
      cx.fillStyle = T.f9 + "" + (a * d.o * 1.9).toFixed(3) + ")";
      cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 7); cx.fill();
    }
  }

  var MALER = {
    konstellation: konstellation, leiterbahnen: leiterbahnen,
    faeden: faeden, nebel: nebel,
    funken: funken, orbits: orbits, zellen: zellen, gitter: gitter,
    drahtgitter: drahtgitter, strahlen: strahlen, bauteile: bauteile,
    wurzeln: wurzeln, kugeln: kugeln, punktregen: punktregen
  };
  var malen = MALER[motiv] || function () {};

  /* ---------- Schleife ---------- */

  var letzte = 0;
  function rahmen(jetzt) {
    window.requestAnimationFrame(rahmen);
    if (document.hidden) { letzte = jetzt; return; }   // verborgener Tab: nichts tun
    var dt = jetzt - letzte; letzte = jetzt;
    if (dt > 100) dt = 100;                            // nach einer Pause nicht springen
    if (aus) { cx.clearRect(0, 0, B, H); return; }
    if (laeuft) t += dt * .06;
    cx.clearRect(0, 0, B, H);
    malen(staerke);
  }

  var zeit = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(zeit);
    zeit = window.setTimeout(messen, 150);
  });

  /* Ein kleiner Schalter unten links. Unauffaellig, aber auffindbar — und
     per Tastatur erreichbar, weil er ein echter Knopf ist. */
  var knopf = document.createElement("button");
  knopf.type = "button";
  knopf.id = "grund-schalter";
  knopf.setAttribute("aria-pressed", aus ? "true" : "false");
  function knopfBeschriften() {
    knopf.textContent = aus ? "Hintergrund an" : "Hintergrund aus";
    knopf.title = aus
      ? "Bewegten Hintergrund wieder einschalten"
      : "Bewegten Hintergrund fuer diesen Browser abschalten";
    knopf.setAttribute("aria-pressed", aus ? "true" : "false");
  }
  knopfBeschriften();
  knopf.addEventListener("click", function () {
    aus = !aus;
    besucherSetzen(aus);
    knopfBeschriften();
    if (!aus) { letzte = 0; }
  });
  document.body.appendChild(knopf);

  /* Die Zentrale wechselt die Seite ueber die Adresszeile, ohne neu zu laden.
     Deshalb ein Griff von aussen statt einer einmaligen Wahl beim Start. */
  window.grundSetzen = function (neuesMotiv, neueStaerke) {
    if (neuesMotiv === "aus" || !MALER[neuesMotiv]) {
      malen = function () {};
      cx.clearRect(0, 0, B, H);
      knopf.hidden = true;
      return;
    }
    malen = MALER[neuesMotiv];
    var st = Number(neueStaerke);
    if (isFinite(st)) staerke = Math.max(.1, Math.min(1, st / 100));
    aufbauen();
    knopf.hidden = false;
  };

  messen();
  window.requestAnimationFrame(rahmen);

  /* Die im Dashboard gespeicherte Wahl gilt vor dem data-Attribut. Schlaegt der
     Abruf fehl — kein Server, kein Netz —, bleibt es beim Attribut; die Seite
     steht dadurch nie ohne Hintergrund da. */
  (function () {
    if (!window.fetch) return;
    var seite = location.pathname.split("/").pop() || "index.html";
    fetch("api/einstellungen", { headers: { accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.hintergrund) return;
        /* Hauptschalter im Dashboard: schaltet alle Seiten auf einmal ab. */
        if (d.grund_aktiv === false) { aus = true; knopfBeschriften(); return; }
        var w = d.hintergrund[seite];
        if (!w || !w.motiv) return;
        /* Schalter je Seite. */
        if (w.an === false) { aus = true; knopfBeschriften(); return; }
        if (w.motiv === "aus") { cx.clearRect(0, 0, B, H); malen = function () {}; return; }
        if (!MALER[w.motiv]) return;
        malen = MALER[w.motiv];
        var st = Number(w.staerke);
        if (Number.isFinite(st)) staerke = Math.max(.1, Math.min(1, st / 100));
      })
      .catch(function () { /* Attribut gilt weiter */ });
  })();
})();
