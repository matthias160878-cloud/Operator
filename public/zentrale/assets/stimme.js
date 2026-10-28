/* Sprechen und Zuhören für den Agenten-Chat der Startseite (App-Ergänzung).
 * Nutzt nur die Web Speech API des Browsers: kein Server, kein Schlüssel.
 * - Mikrofon-Taste: Spracheingabe (Chrome/Edge/Safari, HTTPS, Freigabe nötig).
 * - Lautsprecher-Taste: liest neue Antworten des Agenten vor; Wahl bleibt im Browser.
 * Gestaltung übernimmt die Tasten des bestehenden Formulars; ohne Unterstützung
 * erscheint die jeweilige Taste nicht. */
(function () {
  var form = document.getElementById("s58form");
  var input = document.getElementById("s58in");
  var log = document.getElementById("s58log");
  if (!form || !input || !log) return;

  var KEY = "s58.stimme";
  var synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var sicher = window.isSecureContext;
  var an = true;
  try { an = localStorage.getItem(KEY) !== "aus"; } catch (e) {}

  function taste(label, titel) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.title = titel;
    b.setAttribute("aria-label", titel);
    b.style.minWidth = "2.75rem";
    b.style.background = "transparent";
    b.style.color = "var(--paper)";
    b.style.border = "1px solid var(--line)";
    b.style.fontWeight = "600";
    return b;
  }

  /* Lautsprecher */
  if (synth) {
    var sprecher = taste(an ? "🔊" : "🔇", an ? "Stimme ausschalten" : "Stimme einschalten");
    sprecher.setAttribute("aria-pressed", String(an));
    function stimmeDe() {
      var v = synth.getVoices().filter(function (x) { return /^de/i.test(x.lang); });
      return v.find(function (x) { return /google|microsoft|anna|petra|markus|vicki/i.test(x.name); }) || v[0] || null;
    }
    function sprich(text) {
      if (!an || !text) return;
      try {
        synth.cancel();
        var u = new SpeechSynthesisUtterance(text.replace(/^Hinweis: Der Agent ist gerade nicht erreichbar\.[^\n]*\n\n/, "Hinweis: hinterlegte Antwort. "));
        u.lang = "de-DE";
        var v = stimmeDe(); if (v) u.voice = v;
        synth.speak(u);
      } catch (e) {}
    }
    sprecher.addEventListener("click", function () {
      an = !an;
      try { localStorage.setItem(KEY, an ? "an" : "aus"); } catch (e) {}
      sprecher.textContent = an ? "🔊" : "🔇";
      sprecher.title = sprecher.getAttribute("aria-label") || "";
      sprecher.setAttribute("aria-label", an ? "Stimme ausschalten" : "Stimme einschalten");
      sprecher.setAttribute("aria-pressed", String(an));
      if (an) sprich("Stimme an."); else synth.cancel();
    });
    form.insertBefore(sprecher, form.querySelector("button[type=submit]"));
    synth.getVoices();
    /* Neue Antworten des Agenten vorlesen (nicht die Begrüßung beim Öffnen, nicht „…“). */
    var erste = true;
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (n) {
          if (!(n instanceof HTMLElement) || !n.classList.contains("bot")) return;
          if (erste) { erste = false; return; }
          sprich(n.textContent || "");
        });
      });
    }).observe(log, { childList: true });
  }

  /* Mikrofon */
  if (Rec && sicher) {
    var mikro = taste("🎤", "Per Sprache fragen");
    var rec = null;
    mikro.addEventListener("click", function () {
      if (rec) { try { rec.stop(); } catch (e) {} return; }
      rec = new Rec();
      rec.lang = "de-DE"; rec.interimResults = false; rec.maxAlternatives = 1;
      mikro.textContent = "⏹"; mikro.setAttribute("aria-label", "Zuhören beenden");
      rec.onresult = function (e) {
        var t = (e.results[0] && e.results[0][0] && e.results[0][0].transcript) || "";
        if (t) { input.value = t; form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); }
      };
      rec.onerror = function (e) {
        var txt = { "not-allowed": "Mikrofon nicht erlaubt — bitte im Browser freigeben oder tippen.", "no-speech": "Ich habe nichts gehört.", "audio-capture": "Kein Mikrofon gefunden." }[e.error] || "Spracheingabe fehlgeschlagen — bitte tippen.";
        var d = document.createElement("div"); d.className = "s58-msg note"; d.textContent = txt; log.appendChild(d); log.scrollTop = log.scrollHeight;
      };
      rec.onend = function () { rec = null; mikro.textContent = "🎤"; mikro.setAttribute("aria-label", "Per Sprache fragen"); };
      try { rec.start(); } catch (e) { rec = null; }
    });
    form.insertBefore(mikro, form.querySelector("button[type=submit]"));
  }
})();
