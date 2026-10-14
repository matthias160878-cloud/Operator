/**
 * Die Zentrale — ein Menü über die ganze Webseite.
 *
 * Hinter den drei Strichen liegen zwei Dinge, je nachdem wo man steht:
 *
 *   1. Die SEITEN der Webseite — auf jeder Seite, die eine Kopfzeile hat.
 *   2. Die BEREICHE des Dashboards — nur dort, wo es welche gibt.
 *
 * Zu 2: Das Dashboard ist über 20.000 Pixel lang und trägt 54 Bereiche.
 * Scrollen ist da kein Bedienweg mehr. Die Bereiche werden zur Laufzeit aus
 * der Seite gelesen, statt eine Liste zu pflegen. Wer einen Bereich umbenennt
 * oder hinzufügt, findet ihn trotzdem im Menü — Unbekanntes landet unter
 * "Weitere" statt zu verschwinden. Eine gepflegte Liste wäre nach dem dritten
 * Umbau falsch.
 *
 * Zu 1: Die Seiten lassen sich nicht zur Laufzeit ablesen — eine Seite kennt
 * ihre Geschwister nicht. Also steht hier doch eine Liste. Damit sie nicht
 * still veraltet, prüft test/agenten.mjs sie gegen die Dateien in public/:
 * kommt eine Seite dazu und fehlt hier, wird der Test rot.
 *
 * Ohne JavaScript bleibt jede Seite vollständig bedienbar: das Menü ist eine
 * Zugabe, kein Ersatz für die Kopfzeile.
 */
(function () {
  "use strict";

  /* Zuordnung nach Wortteilen im Titel. Die erste Gruppe, deren Muster
     trifft, gewinnt — deshalb steht das Engere vor dem Weiteren.
     Geprueft wird gegen den umlautfreien Titel (siehe normal()): "vertrag"
     trifft sonst "Vertraege" nicht, und genau so ist der Bereich beim
     ersten Versuch unter "Weitere" gelandet. */
  /* Die Seiten der Webseite. "gruppe: null" heisst: gehoert dazu, wird aber
     nicht ins Menue gestellt — Fehlerseite und die beiden Schritte, die man
     nur mit einem Link aus einer E-Mail erreicht. Sie stehen trotzdem hier,
     damit der Vollstaendigkeitstest gegen public/*.html aufgeht. */
  var SEITEN = [
    { datei: "seiten.html",             titel: "Alle Seiten",           gruppe: "Webseite",      was: "Diese Übersicht — jede Seite an einem Ort." },
    { datei: "index.html",              titel: "Startseite",            gruppe: "Webseite",      was: "Ihr Auftritt nach aussen: Leistungen, Preise, Kontakt." },
    { datei: "praesentationen.html",    titel: "Präsentationen",        gruppe: "Webseite",      was: "Unterlagen zum Zeigen beim Kunden." },
    { datei: "presse.html",             titel: "Presse",                gruppe: "Webseite",      was: "Erwähnungen und Pressestimmen." },

    { datei: "leistung-agenten.html",   titel: "KI-Agenten",            gruppe: "Leistungen",    was: "Agenten nehmen Anfragen an, prüfen und antworten." },
    { datei: "leistung-backoffice.html", titel: "Backoffice-Automation", gruppe: "Leistungen",    was: "Formulare, Übergaben und Freigaben laufen durch." },
    { datei: "leistung-texte.html",      titel: "Texte und Inhalte",     gruppe: "Leistungen",    was: "Texte in Ihrer Tonlage, zur Freigabe vorbereitet." },
    { datei: "leistung-social.html",     titel: "Social Media",          gruppe: "Leistungen",    was: "Regelmäßig veröffentlichen, ohne täglich daran zu denken." },
    { datei: "leistung-beratung.html",   titel: "KI-Beratung",           gruppe: "Leistungen",    was: "Was KI im Betrieb wirklich bringt — und was nicht." },
    { datei: "leistung-schulung.html",   titel: "Schulung",              gruppe: "Leistungen",    was: "Ihr Team lernt, wo ein Agent trägt und wo nicht." },
    { datei: "leistung-webseiten.html",  titel: "Webseiten & Webdesign", gruppe: "Leistungen",    was: "Eine Webseite, die Anfragen auch beantwortet." },

    { datei: "dashboard.html",          titel: "Kundenbereich",         gruppe: "Kundenbereich", was: "Die Arbeitsfläche mit allen 54 Bereichen." },
    { datei: "mein-vertrag.html",       titel: "Mein Vertrag",          gruppe: "Kundenbereich", was: "Ihr gebuchtes Paket und der Stand Ihrer Rechnungen." },
    { datei: "paket.html",              titel: "Paket zusammenstellen", gruppe: "Kundenbereich", was: "Bestellung mit Rechnungsangaben und Kryptozahlung." },
    { datei: "login.html",              titel: "Anmelden",              gruppe: "Kundenbereich", was: "Zugang zum Kundenbereich." },
    { datei: "registrieren.html",       titel: "Registrieren",          gruppe: "Kundenbereich", was: "Neues Konto anlegen." },
    { datei: "passwort-vergessen.html", titel: "Passwort vergessen",    gruppe: "Kundenbereich", was: "Zugang per E-Mail zurücksetzen." },

    { datei: "start.html",              titel: "Bis zum Start",         gruppe: "Steuerung",     was: "Was vor dem Verkaufsstart zu tun ist — gemessen." },
    { datei: "automatik.html",          titel: "Automatik",             gruppe: "Steuerung",     was: "Was fehlt, bis der Betrieb allein weiterläuft." },
    { datei: "konnektoren.html",        titel: "Konnektoren",           gruppe: "Steuerung",     was: "Welche Dienste angebunden sind — und welche nicht." },
    { datei: "skills.html",             titel: "Skills",                gruppe: "Steuerung",     was: "Fähigkeiten der Agenten, samt Dopplungen." },

    { datei: "impressum.html",          titel: "Impressum",             gruppe: "Rechtliches",   was: "Pflichtangaben. Inhalt noch zu füllen." },
    { datei: "datenschutz.html",        titel: "Datenschutz",           gruppe: "Rechtliches",   was: "Datenschutzerklärung. Inhalt noch zu füllen." },
    { datei: "agb.html",                titel: "AGB",                   gruppe: "Rechtliches",   was: "Widerrufsbelehrung und Krypto-Klausel fehlen noch." },

    { datei: "404.html",                titel: "Fehlerseite",           gruppe: null,            was: "Erscheint bei einer falschen Adresse." },
    { datei: "bestaetigen.html",        titel: "Sicherheitscode",       gruppe: null,            was: "Schritt nach der Anmeldung, nur im Ablauf erreichbar." },
    { datei: "passwort-neu.html",       titel: "Neues Passwort",        gruppe: null,            was: "Nur über den Link aus der E-Mail erreichbar." },
  ];

  var SEITEN_GRUPPEN = ["Webseite", "Leistungen", "Kundenbereich", "Steuerung", "Rechtliches"];

  var GRUPPEN = [
    ["Vertrieb & Kunden", /posteingang|pipeline|auftr|anfrage|upsell|reaktivier|feedback|reputation|abschluss|vertrag|vertraeg|onboarding/],
    ["Backoffice & Geld", /backoffice|rechnung|buchhaltung|aufgabe|termin|preis-monitoring|wettbewerb/],
    ["Inhalte & Marketing", /newsletter|social|presse|marketing|kampagne|reach|content|video|design|analytics|seo|experiment|growth/],
    ["Wissen & Agenten", /master|werkzeug|bild-analyse|wissensbasis|gedaechtnis|schulung|chat-verlauf|uebersetzung|recherche|markenschutz|branchen/],
    ["Technik & Sicherheit", /automation|zahlen|eskalation|monitoring|technik|selbsttest|sicherheit|datenschutz|barrierefrei|backup|dsgvo|faq/],
    ["Einstellungen", /einstellung/],
  ];

  /* Kleinschreibung und Umlaute vereinheitlichen — fuer die Zuordnung wie
     fuer die Suche. */
  function normal(s) {
    return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  }

  function kennung(text, belegt) {
    var roh = text.toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    var k = "b-" + (roh || "bereich");
    var n = 2;
    while (belegt[k]) k = "b-" + roh + "-" + n++;
    belegt[k] = true;
    return k;
  }

  function bereicheSammeln() {
    var belegt = {};
    var aus = [];
    var knoten = document.querySelectorAll(".bereich");
    for (var i = 0; i < knoten.length; i++) {
      var el = knoten[i];
      var h = el.querySelector("h2");
      if (!h) continue;
      var titel = h.textContent.replace(/\s+/g, " ").trim();
      if (!titel) continue;
      if (!el.id) el.id = kennung(titel, belegt); else belegt[el.id] = true;

      var gruppe = "Weitere";
      var vergleich = normal(titel);
      for (var g = 0; g < GRUPPEN.length; g++) {
        if (GRUPPEN[g][1].test(vergleich)) { gruppe = GRUPPEN[g][0]; break; }
      }
      aus.push({ id: el.id, titel: titel, gruppe: gruppe, knoten: el });
    }
    return aus;
  }

  function bauen() {
    var kopf = document.querySelector("header.kopf .wrap");
    if (!kopf || !kopf.firstElementChild) return;

    /* Frueher stieg das Menue hier aus, wenn die Seite keine .bereich-Kaesten
       hat — und damit gab es die Zentrale nur im Dashboard. Jetzt traegt sie
       immer mindestens die Seiten der Webseite; die Bereiche kommen dazu, wo
       es welche gibt. */
    var bereiche = bereicheSammeln();
    var hier = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var seiten = SEITEN.filter(function (x) { return x.gruppe; });
    var gesamt = seiten.length + bereiche.length;

    /* Der Knopf mit den drei Strichen. Ein echter <button> mit
       aria-expanded — damit er auch per Tastatur und Vorlesehilfe geht. */
    var knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "zentrale-knopf";
    knopf.setAttribute("aria-expanded", "false");
    knopf.setAttribute("aria-controls", "zentrale-menue");
    /* Das Wort sagt, was drinsteht: im Dashboard fuehrt das Menue vor allem
       die 54 Bereiche, sonst die Seiten. "Bereiche" auf einer Seite ohne
       Bereiche waere ein leeres Versprechen. */
    var wort = bereiche.length ? "Bereiche" : "Seiten";
    knopf.setAttribute("aria-label", wort + " öffnen");
    knopf.innerHTML = '<span class="striche" aria-hidden="true"><i></i><i></i><i></i></span>' +
                      '<span class="zentrale-wort">' + wort + "</span>";
    /* firstElementChild statt firstChild.nextSibling: Letzteres haengt daran,
       ob vor der Marke ein Zeilenumbruch steht. */
    kopf.insertBefore(knopf, kopf.firstElementChild);

    var panel = document.createElement("div");
    panel.id = "zentrale-menue";
    panel.className = "zentrale-menue";
    panel.hidden = true;
    panel.innerHTML =
      '<div class="zentrale-innen">' +
        '<div class="zentrale-suche">' +
          '<input type="search" id="zentrale-filter" placeholder="Suchen — ' + gesamt + ' Einträge" ' +
          'aria-label="Seiten und Bereiche durchsuchen" autocomplete="off">' +
          '<button type="button" class="zentrale-zu" aria-label="Menü schließen">Schließen</button>' +
        "</div>" +
        '<div class="zentrale-gruppen" id="zentrale-gruppen"></div>' +
      "</div>";
    document.body.appendChild(panel);

    var gruppenFeld = panel.querySelector("#zentrale-gruppen");
    var filter = panel.querySelector("#zentrale-filter");

    function rein(t) { return String(t).replace(/[<>&]/g, ""); }

    function zeichnen(suche) {
      var f = normal(suche || "").trim();
      function passt(t) { return !f || normal(t).indexOf(f) >= 0; }

      var html = "";
      var treffer = 0;

      /* Zuerst die Seiten — sie fuehren woandershin und gehoeren darum nach
         oben, vor die Spruenge innerhalb der aktuellen Seite. */
      for (var i = 0; i < SEITEN_GRUPPEN.length; i++) {
        var gname = SEITEN_GRUPPEN[i];
        var drin = seiten.filter(function (x) { return x.gruppe === gname && passt(x.titel); });
        if (!drin.length) continue;
        treffer += drin.length;
        html += '<section class="zentrale-gruppe"><h3>' + gname +
                ' <span class="zahl">' + drin.length + "</span></h3><ul>";
        for (var j = 0; j < drin.length; j++) {
          var ist = drin[j].datei.toLowerCase() === hier;
          html += '<li><a href="' + drin[j].datei + '"' +
                  (ist ? ' aria-current="page" class="ist-hier"' : "") + ">" +
                  rein(drin[j].titel) + (ist ? ' <span class="zentrale-hier">Sie sind hier</span>' : "") +
                  "</a></li>";
        }
        html += "</ul></section>";
      }

      /* Dann die Bereiche der aktuellen Seite, falls es welche gibt. */
      var reihenfolge = [];
      for (var g = 0; g < GRUPPEN.length; g++) reihenfolge.push(GRUPPEN[g][0]);
      reihenfolge.push("Weitere");
      for (var k = 0; k < reihenfolge.length; k++) {
        var name = reihenfolge[k];
        var b = bereiche.filter(function (x) { return x.gruppe === name && passt(x.titel); });
        if (!b.length) continue;
        treffer += b.length;
        html += '<section class="zentrale-gruppe"><h3>' + name +
                ' <span class="zahl">' + b.length + "</span></h3><ul>";
        for (var m = 0; m < b.length; m++) {
          html += '<li><a href="#' + b[m].id + '" data-ziel="' + b[m].id + '">' +
                  rein(b[m].titel) + "</a></li>";
        }
        html += "</ul></section>";
      }

      gruppenFeld.innerHTML = html ||
        '<p class="zentrale-leer">Nichts mit diesem Namen — weder Seite noch Bereich.</p>';
      return treffer;
    }

    function oeffnen() {
      panel.hidden = false;
      knopf.setAttribute("aria-expanded", "true");
      document.body.classList.add("zentrale-offen");
      filter.value = "";
      zeichnen("");
      filter.focus();
    }
    function schliessen() {
      panel.hidden = true;
      knopf.setAttribute("aria-expanded", "false");
      document.body.classList.remove("zentrale-offen");
      knopf.focus();
    }

    knopf.addEventListener("click", function () {
      panel.hidden ? oeffnen() : schliessen();
    });
    panel.querySelector(".zentrale-zu").addEventListener("click", schliessen);
    filter.addEventListener("input", function () { zeichnen(filter.value); });

    gruppenFeld.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-ziel]");
      if (!a) return;
      e.preventDefault();
      var ziel = document.getElementById(a.getAttribute("data-ziel"));
      schliessen();
      if (!ziel) return;
      ziel.scrollIntoView({ behavior: "smooth", block: "start" });
      /* Kurz hervorheben, damit man nach dem Sprung sieht, wo man gelandet
         ist — bei 54 gleich aussehenden Kästen sonst nicht zu erkennen. */
      ziel.classList.add("zentrale-ziel");
      setTimeout(function () { ziel.classList.remove("zentrale-ziel"); }, 1600);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) schliessen();
    });
    panel.addEventListener("click", function (e) {
      if (e.target === panel) schliessen();
    });

    // Eingabe im Suchfeld: Enter springt zum ersten Treffer.
    filter.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      /* Nicht nur a[data-ziel]: der erste Treffer kann jetzt auch eine Seite
         sein, und die fuehrt ueber ein normales href weiter. */
      var erster = gruppenFeld.querySelector("a");
      if (erster) erster.click();
    });
  }

  /* Nach aussen geben, damit seiten.html dieselbe Liste rendern kann. Eine
     zweite, eigene Liste dort waere die naechste, die still veraltet. */
  window.SECRET58_SEITEN = SEITEN;
  window.SECRET58_SEITEN_GRUPPEN = SEITEN_GRUPPEN;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bauen);
  else bauen();
})();
