/**
 * Genesis — Sprachsteuerung für den zentralen Hub und den Social-Media-Bereich.
 *
 * Eine einzige <script>-Zeile reicht: das Widget baut sich selbst (ein
 * Mikrofon-Knopf unten rechts plus ein Feld mit den Befehlen), ohne dass
 * die einbindende Seite dafür eigenes Markup braucht.
 *
 * WICHTIG — was Stimme hier NICHT darf (Auftrag Punkt 7):
 * Ein Sprachbefehl kann nur NAVIGIEREN und ein Paket VORAUSWÄHLEN. Jede
 * zahlungsrelevante oder sonst heikle Aktion (ein Paket wirklich kaufen,
 * etwas löschen, etwas veröffentlichen) bleibt an einen echten Klick der
 * angemeldeten Kundin gebunden — eine Stimme ist kein Identitätsnachweis.
 * Darum lösen die Befehle unten ausschließlich location.href-Wechsel aus,
 * nie ein fetch(..., {method:"POST"}) o.ä.
 *
 * WICHTIG — Ehrlichkeit statt Behauptung: Web Speech API ist nicht überall
 * verfügbar (u. a. nicht in Firefox, nicht ohne HTTPS/localhost, nicht ohne
 * erteilte Mikrofonerlaubnis). Dieses Modul behauptet an keiner Stelle,
 * Spracheingabe funktioniere "auf jedem Gerät" — es prüft die Voraussetzung
 * und zeigt ehrlich, wenn sie fehlt. Die komplette Befehlsliste steht immer
 * auch als klickbare, mit der Tastatur erreichbare Liste da, Spracheingabe
 * ist ein Zusatz, kein Ersatz.
 */
(function () {
  "use strict";

  /* Ein Befehl = ein Satz Formulierungen (klein, ohne Satzzeichen geprüft)
     und ein Ziel. "wachstum" zeigt auf die Analytics-Ansicht --- eine eigene
     Seite mit dem Namen "Wachstum" gibt es (noch) nicht; das ist die
     inhaltlich nächste echte Ansicht (Content-/Wachstumszahlen), kein
     erfundener Ort. "posteingang" zeigt auf den bestehenden Posteingang im
     klassischen Dashboard --- an der command-center.html wird dafür nichts
     Neues gebaut. */
  /* Alle Ziele sind wurzelbezogen (führender Schrägstrich) --- jede Seite
     dieses Projekts liegt direkt unter public/, also genau eine Ebene unter
     der Adresswurzel. Das macht die Ziele unabhängig davon, von welcher
     Seite aus das Skript gerade läuft; kein Rückrechnen über
     document.currentScript nötig (der ist beim späteren Klick ohnehin
     längst wieder null). */
  var BEFEHLE = [
    { satz: "Öffne Social Media AI", muster: [/social\s*media\s*(ai|ki)/], ziel: "/social-media-ai/oeffnen" },
    { satz: "Öffne Command Center", muster: [/command\s*center/], ziel: "/command-center.html" },
    { satz: "Wähle Pro", muster: [/w[aä]hle?\s+pro\b/, /\bpro\b.*paket/], ziel: "/social-media-ki.html?vorauswahl=pro#pakete" },
    { satz: "Wähle Maxi", muster: [/w[aä]hle?\s+maxi\b/, /\bmaxi\b.*paket/], ziel: "/social-media-ki.html?vorauswahl=maxi#pakete" },
    { satz: "Öffne Schulung", muster: [/schulung/], ziel: "/schulung.html" },
    { satz: "Öffne Marken-DNA", muster: [/marken[\s-]?dna/], ziel: "/command-center.html#brand-dna" },
    { satz: "Öffne Wachstum", muster: [/wachstum/, /analytics/], ziel: "/command-center.html#analytics" },
    { satz: "Öffne Posteingang", muster: [/posteingang/, /postfach/], ziel: "/dashboard.html" },
  ];

  function treffer(text) {
    var klein = String(text || "").toLowerCase().trim();
    for (var i = 0; i < BEFEHLE.length; i++) {
      for (var j = 0; j < BEFEHLE[i].muster.length; j++) {
        if (BEFEHLE[i].muster[j].test(klein)) return BEFEHLE[i];
      }
    }
    return null;
  }

  function gehe(ziel) {
    location.href = ziel;
  }

  /* ---------------------------------------------------------------
   * Oberfläche: ein Knopf, ein aufklappbares Feld mit Status + der
   * vollständigen Befehlsliste zum Anklicken. Alles mit der Tastatur
   * erreichbar (echte <button>-Elemente, kein reines div mit Klick-Handler).
   * --------------------------------------------------------------- */
  var stil = document.createElement("style");
  stil.textContent =
    ".genesis-stimme-knopf{position:fixed; right:1.1rem; bottom:1.1rem; z-index:9999; width:3.2rem; height:3.2rem;" +
    "border-radius:50%; border:1px solid rgba(255,255,255,.2); background:#1b1f33; color:#F5AE3C; font-size:1.3rem;" +
    "cursor:pointer; box-shadow:0 4px 18px rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center;}" +
    ".genesis-stimme-knopf[aria-pressed=\"true\"]{background:#F5AE3C; color:#1b1f33; animation:genesis-puls 1.4s infinite;}" +
    "@keyframes genesis-puls{0%{box-shadow:0 0 0 0 rgba(245,174,60,.5);}100%{box-shadow:0 0 0 14px rgba(245,174,60,0);}}" +
    ".genesis-stimme-feld{position:fixed; right:1.1rem; bottom:4.6rem; z-index:9999; width:min(19rem,calc(100vw - 2.2rem));" +
    "background:#11142a; color:#eee; border:1px solid rgba(255,255,255,.15); border-radius:12px; padding:.9rem 1rem;" +
    "font:14px/1.45 system-ui,sans-serif; box-shadow:0 10px 30px rgba(0,0,0,.4);}" +
    ".genesis-stimme-feld[hidden]{display:none;}" +
    ".genesis-stimme-feld h2{margin:0 0 .4rem; font-size:.85rem; letter-spacing:.03em; color:#F5AE3C;}" +
    ".genesis-stimme-status{font-size:.82rem; color:#bbb; margin:0 0 .6rem; min-height:1.1em;}" +
    ".genesis-stimme-liste{list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.3rem;}" +
    ".genesis-stimme-liste button{width:100%; text-align:left; background:rgba(255,255,255,.05); color:#eee;" +
    "border:1px solid rgba(255,255,255,.12); border-radius:7px; padding:.4rem .6rem; font:inherit; cursor:pointer;}" +
    ".genesis-stimme-liste button:hover, .genesis-stimme-liste button:focus{border-color:#F5AE3C;}" +
    ".genesis-stimme-hinweis{font-size:.76rem; color:#999; margin-top:.6rem;}";
  document.head.appendChild(stil);

  var knopf = document.createElement("button");
  knopf.type = "button";
  knopf.className = "genesis-stimme-knopf";
  knopf.setAttribute("aria-pressed", "false");
  knopf.setAttribute("aria-label", "Genesis Sprachsteuerung öffnen");
  knopf.textContent = "🎙";

  var feld = document.createElement("div");
  feld.className = "genesis-stimme-feld";
  feld.hidden = true;
  feld.setAttribute("role", "dialog");
  feld.setAttribute("aria-label", "Genesis Sprachsteuerung");

  var ueberschrift = document.createElement("h2");
  ueberschrift.textContent = "Genesis — Sprachsteuerung";

  var status = document.createElement("p");
  status.className = "genesis-stimme-status";
  status.textContent = "Bereit.";

  var liste = document.createElement("ul");
  liste.className = "genesis-stimme-liste";
  BEFEHLE.forEach(function (b) {
    var li = document.createElement("li");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "„" + b.satz + "“";
    btn.addEventListener("click", function () { ausfuehren(b); });
    li.appendChild(btn);
    liste.appendChild(li);
  });

  var hinweis = document.createElement("p");
  hinweis.className = "genesis-stimme-hinweis";
  hinweis.textContent =
    "Spracheingabe kann nur navigieren und ein Paket vorauswählen. " +
    "Ein Kauf braucht immer Ihre Anmeldung und einen echten Klick danach.";

  var mikKnopf = document.createElement("button");
  mikKnopf.type = "button";
  mikKnopf.className = "genesis-stimme-liste";
  mikKnopf.style.cssText = "margin:.6rem 0 0; width:100%; background:rgba(245,174,60,.12); color:#F5AE3C;" +
    "border:1px solid rgba(245,174,60,.4); border-radius:7px; padding:.45rem .6rem; font:inherit; cursor:pointer;";

  feld.appendChild(ueberschrift);
  feld.appendChild(status);
  feld.appendChild(mikKnopf);
  feld.appendChild(liste);
  feld.appendChild(hinweis);

  document.addEventListener("DOMContentLoaded", einhaengen);
  if (document.readyState !== "loading") einhaengen();
  function einhaengen() {
    if (document.body && !document.body.contains(knopf)) {
      document.body.appendChild(knopf);
      document.body.appendChild(feld);
    }
  }

  knopf.addEventListener("click", function () {
    feld.hidden = !feld.hidden;
    if (!feld.hidden) mikKnopf.focus();
  });

  function setzeStatus(text) { status.textContent = text; }

  function ausfuehren(befehl) {
    setzeStatus("„" + befehl.satz + "“ — öffne …");
    gehe(befehl.ziel);
  }

  /* ---------------------------------------------------------------
   * Spracherkennung: nur per Klick auf den Mikrofon-Knopf im Feld
   * (push-to-talk), nicht dauerhaft lauschend --- das ist sowohl
   * sparsamer mit dem Mikrofon als auch leichter nachvollziehbar.
   * --------------------------------------------------------------- */
  var Erkennung = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var sicherAbrufbar = window.isSecureContext !== false; // HTTPS oder localhost

  if (!Erkennung) {
    mikKnopf.textContent = "🎙 Spracheingabe hier nicht verfügbar";
    mikKnopf.disabled = true;
    setzeStatus("Dieser Browser unterstützt keine Spracheingabe — bitte unten klicken.");
  } else if (!sicherAbrufbar) {
    mikKnopf.textContent = "🎙 Nur über HTTPS verfügbar";
    mikKnopf.disabled = true;
    setzeStatus("Spracheingabe braucht eine sichere (https) Verbindung — bitte unten klicken.");
  } else {
    mikKnopf.textContent = "🎙 Sprechen (einmal klicken, dann Befehl sagen)";
    var laeuft = false;
    var erkenner = null;

    mikKnopf.addEventListener("click", function () {
      if (laeuft) { erkenner && erkenner.stop(); return; }
      starten();
    });

    function starten() {
      try {
        erkenner = new Erkennung();
      } catch (fehler) {
        setzeStatus("Spracheingabe lässt sich nicht starten — bitte unten klicken.");
        return;
      }
      erkenner.lang = "de-DE";
      erkenner.continuous = false;
      erkenner.interimResults = false;
      erkenner.maxAlternatives = 1;

      erkenner.onstart = function () {
        laeuft = true;
        knopf.setAttribute("aria-pressed", "true");
        setzeStatus("Höre zu …");
      };
      erkenner.onresult = function (ereignis) {
        var text = ereignis.results && ereignis.results[0] && ereignis.results[0][0]
          ? ereignis.results[0][0].transcript : "";
        var befehl = treffer(text);
        if (befehl) {
          ausfuehren(befehl);
        } else {
          setzeStatus('Nicht erkannt: „' + text + '“ — bitte unten anklicken oder erneut versuchen.');
        }
      };
      erkenner.onerror = function (ereignis) {
        var grund = {
          "not-allowed": "Mikrofonzugriff wurde nicht erlaubt.",
          "no-speech": "Es wurde nichts gehört — bitte erneut versuchen.",
          "audio-capture": "Kein Mikrofon gefunden.",
          "network": "Keine Verbindung für die Spracherkennung.",
        }[ereignis.error] || "Spracheingabe war nicht möglich — bitte unten klicken.";
        setzeStatus(grund);
      };
      erkenner.onend = function () {
        laeuft = false;
        knopf.setAttribute("aria-pressed", "false");
        if (status.textContent === "Höre zu …") setzeStatus("Bereit.");
      };
      erkenner.start();
    }
  }

  /* ---------------------------------------------------------------
   * "Wähle Pro"/"Wähle Maxi" per Sprache vom Hub aus vorauswählen:
   * social-media-ki.html liest ?vorauswahl=pro|maxi und hebt die Karte
   * hervor + scrollt dorthin --- kauft aber nichts von selbst (siehe dort).
   * --------------------------------------------------------------- */
  (function vorauswahlAnwenden() {
    var params = new URLSearchParams(location.search);
    var wahl = params.get("vorauswahl");
    if (!wahl || !/^(pro|maxi)$/.test(wahl)) return;
    document.addEventListener("DOMContentLoaded", function () {
      var versuche = 0;
      var intervall = setInterval(function () {
        versuche++;
        var karte = document.querySelector('#pakete [data-paket="' + wahl + '"]');
        if (karte) {
          clearInterval(intervall);
          karte.closest(".preis-karte").scrollIntoView({ behavior: "smooth", block: "center" });
          karte.focus();
        } else if (versuche > 20) {
          clearInterval(intervall);
        }
      }, 250);
    });
  })();
})();
