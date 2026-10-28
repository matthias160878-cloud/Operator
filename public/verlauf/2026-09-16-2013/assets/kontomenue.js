/**
 * Das Kontomenü rechts oben.
 *
 * Heisst bewusst kontomenue.js und nicht konto.js: assets/konto.js gibt es
 * schon und traegt die gesamte Konto-Strecke (Registrieren, Anmelden,
 * Abmelden, Passwort). Diese Datei ist etwas anderes — nur die Anzeige im
 * Kopf.
 *
 * Drei Striche rechts, darunter: Kundennummer, E-Mail, Benutzername — und
 * die Wege zu Profil, persönlichen Daten, Zahlung, Abos, Verträgen und
 * Einstellungen.
 *
 * Es öffnet beim Darüberfahren UND beim Klicken. Nur auf Hover zu setzen
 * wäre auf jedem Telefon eine Sackgasse, denn dort gibt es kein
 * Darüberfahren; nur auf Klick zu setzen wäre am Rechner unnötig umständlich.
 * Also beides, mit einer kurzen Verzögerung beim Verlassen, damit das Menü
 * nicht zuklappt, während die Maus auf dem Weg dorthin ist.
 *
 * Was es NICHT tut: etwas behaupten. Ist niemand angemeldet, steht das da.
 * Gibt es einen Bereich noch nicht — Abos —, steht auch das da, statt den
 * Eintrag wegzulassen und so zu tun, als sei nie danach gefragt worden.
 */
(function () {
  "use strict";

  var VERZOEGERUNG = 260;   // ms, damit der Weg zur Maus nicht abreisst

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function bauen(daten) {
    /* Es genuegt die Kopfzeile. Frueher wurde ".kopf .seiten" verlangt — die
       Seitenleiste gibt es aber nur im Dashboard, und damit fehlte das
       Kontomenue auf allen uebrigen Seiten. */
    var leiste = document.querySelector("header.kopf .wrap");
    if (!leiste) return;

    var huelle = document.createElement("div");
    huelle.className = "kopfkonto";

    var knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "konto-knopf";
    knopf.setAttribute("aria-expanded", "false");
    knopf.setAttribute("aria-controls", "konto-menue");
    knopf.setAttribute("aria-label", daten.angemeldet
      ? "Konto von " + (daten.anzeigename || daten.email)
      : "Konto — nicht angemeldet");
    knopf.innerHTML =
      '<span class="striche" aria-hidden="true"><i></i><i></i><i></i></span>' +
      (daten.angemeldet
        ? '<span class="konto-kuerzel">' + esc((daten.anzeigename || "?").slice(0, 1).toUpperCase()) + "</span>"
        : '<span class="konto-kuerzel konto-aus" aria-hidden="true">·</span>');

    var menue = document.createElement("div");
    menue.id = "konto-menue";
    menue.className = "konto-menue";
    menue.hidden = true;

    var kopfteil = daten.angemeldet
      ? '<div class="konto-kopf">' +
          '<p class="konto-name">' + esc(daten.anzeigename || "(kein Benutzername)") + "</p>" +
          '<dl class="konto-daten">' +
            "<dt>Kundennummer</dt><dd><code>" + esc(daten.kundennummer || "—") + "</code></dd>" +
            "<dt>E-Mail</dt><dd>" + esc(daten.email || "—") + "</dd>" +
            "<dt>Benutzername</dt><dd>" + (daten.benutzername
              ? esc(daten.benutzername)
              : '<a href="dashboard.html#einstellungen">noch nicht vergeben</a>') + "</dd>" +
          "</dl>" +
        "</div>"
      : '<div class="konto-kopf">' +
          '<p class="konto-name">Nicht angemeldet</p>' +
          '<p class="konto-hinweis">Kundennummer, E-Mail und Benutzername erscheinen hier, sobald Sie angemeldet sind.</p>' +
          '<p><a class="knopf" href="login.html" style="width:auto;display:inline-block;text-decoration:none;">Anmelden</a></p>' +
        "</div>";

    var liste = (daten.eintraege || []).map(function (e) {
      if (!e.ziel) {
        return '<li class="ohne-ziel"><span class="titel">' + esc(e.titel) +
               ' <em>noch nicht eingerichtet</em></span><span class="was">' + esc(e.was) + "</span></li>";
      }
      return '<li><a href="' + esc(e.ziel) + '"><span class="titel">' + esc(e.titel) +
             '</span><span class="was">' + esc(e.was) + "</span></a></li>";
    }).join("");

    menue.innerHTML = kopfteil + '<ul class="konto-liste">' + liste + "</ul>" +
      (daten.angemeldet
        ? '<div class="konto-fuss"><button type="button" class="alslink" id="konto-abmelden">Abmelden</button></div>'
        : "");

    huelle.appendChild(knopf);
    huelle.appendChild(menue);
    /* NEBEN die Seitenleiste, nicht hinein. ".kopf .seiten" scrollt waagrecht
       ("overflow-x:auto"), damit die Kopfzeile einzeilig bleibt — und ein
       Scrollbehaelter schneidet alles ab, was aus ihm herausragt. Das Menue ist
       knapp 700px hoch und wurde darin auf Kopfzeilenhoehe weggeschnitten: im
       DOM vorhanden, fuer den Kunden unsichtbar. Der Knopf gehoert ohnehin
       nicht zu den Seitenlinks. */
    leiste.appendChild(huelle);

    /* ---------- Öffnen und Schließen ---------- */

    var schliessZeit = null;
    function oeffnen() {
      clearTimeout(schliessZeit);
      menue.hidden = false;
      knopf.setAttribute("aria-expanded", "true");
    }
    function schliessen() {
      menue.hidden = true;
      knopf.setAttribute("aria-expanded", "false");
    }
    function spaeterSchliessen() {
      clearTimeout(schliessZeit);
      schliessZeit = setTimeout(schliessen, VERZOEGERUNG);
    }

    // Darüberfahren — nur wo es ein echtes Zeigegerät gibt.
    if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
      huelle.addEventListener("mouseenter", oeffnen);
      huelle.addEventListener("mouseleave", spaeterSchliessen);
    }
    // Klicken und Tippen — überall.
    knopf.addEventListener("click", function () {
      menue.hidden ? oeffnen() : schliessen();
    });
    /* Bewusst KEIN Öffnen bei focusin. Ein Tippen löst erst focusin und dann
       click aus: das erste öffnete, das zweite schaltete sofort wieder zu,
       und auf dem Telefon war das Menü damit nicht zu öffnen. Mit der
       Tastatur löst Enter oder Leertaste ohnehin einen click aus — der Weg
       hinein ist also abgedeckt. Nur das Schließen beim Hinaustabben bleibt. */
    huelle.addEventListener("focusout", function (e) {
      /* Nur schliessen, wenn der Fokus auf ein echtes Element AUSSERHALB
         wandert. Auf einem Telefon verliert der Knopf nach dem Tippen den
         Fokus ins Nichts — relatedTarget ist dann null, und das als
         "Fokus ist draussen" zu werten hat das Menue auf jedem Telefon
         sofort wieder zugeklappt. */
      if (e.relatedTarget && !huelle.contains(e.relatedTarget)) spaeterSchliessen();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menue.hidden) { schliessen(); knopf.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!huelle.contains(e.target) && !menue.hidden) schliessen();
    });

    var ab = menue.querySelector("#konto-abmelden");
    if (ab) {
      var alt = document.getElementById("abmelden");
      ab.addEventListener("click", function () {
        if (alt) alt.click();
        else fetch("api/konto/abmelden", { method: "POST" }).then(function () { location.reload(); });
      });
      /* Den alten Abmeldeknopf im Kopf erst JETZT ausblenden — nicht schon im
         HTML. Baut dieses Menue nicht (kein Netz, Skript blockiert, Fehler in
         der Auskunft), bliebe ein Angemeldeter sonst ohne jeden sichtbaren Weg
         hinaus. Der Knopf verschwindet also genau dann, wenn das Menue seine
         Aufgabe nachweislich uebernommen hat. Geklickt wird er weiterhin — ein
         verborgener Knopf nimmt einen Klick per Skript ohne Weiteres an, und so
         bleibt die Abmeldung an EINER Stelle im Code. */
      if (alt) alt.hidden = true;
    }
  }

  fetch("api/konto/ich")
    .then(function (r) { return r.json().then(function (d) { return d; }); })
    .then(bauen)
    .catch(function () { /* ohne Konto-Auskunft kein Menue — kein Platzhalter */ });
})();
