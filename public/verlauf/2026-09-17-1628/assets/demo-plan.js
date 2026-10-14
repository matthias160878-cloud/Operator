/**
 * Die Live-Demo auf der Startseite.
 *
 * Punkt 16 des Auftrags verlangt einen Demo-Bereich mit dem Weg
 * Eingabe -> Kern -> Planer -> Agenten -> Ergebnis, und dazu den Satz:
 * wenn die Demo nur simuliert wird, muss sie als Demo gekennzeichnet sein,
 * und es duerfen keine ausgefuehrten Aktionen behauptet werden.
 *
 * Hier wird nichts simuliert. /api/demo/plan laesst denselben Planer laufen
 * wie ein echter Auftrag; die Agentennamen im Ergebnis stehen so in der
 * Registratur. Ausgefuehrt wird nichts --- das sagt die Antwort selbst
 * (`ausgefuehrt: false`), und daran haengt hier der Hinweistext. Behauptet
 * die Antwort je etwas anderes, zeigt diese Seite gar kein Ergebnis an.
 *
 * Alles wird als Text gesetzt, nie als HTML: was zurueckkommt, enthaelt das
 * eigene Ziel des Besuchers, und das gehoert nicht in den Seitenquelltext.
 *
 * Ohne Abhaengigkeit.
 */
(function () {
  "use strict";

  var form = document.getElementById("demoform");
  var feld = document.getElementById("demo-ziel");
  var knopf = document.getElementById("demo-senden");
  var stand = document.getElementById("demo-status");
  var ziel = document.getElementById("demo-ergebnis");
  var rest = document.getElementById("demo-rest");
  if (!form || !feld || !knopf || !stand || !ziel) return;

  var HOECHSTENS = 400;
  var laeuft = false;

  function leeren(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function el(tag, klasse, text) {
    var k = document.createElement(tag);
    if (klasse) k.className = klasse;
    if (text !== undefined && text !== null) k.textContent = String(text);
    return k;
  }

  function zeichenzaehler() {
    if (!rest) return;
    var uebrig = HOECHSTENS - feld.value.length;
    rest.textContent = uebrig < 60 ? uebrig + " Zeichen frei" : "";
  }

  /* Der Weg, den die Aufgabe genommen hat --- mit dem, was wirklich
     herauskam, nicht mit Platzhaltern. */
  function wegBauen(a) {
    var weg = el("ol", "demo-weg");
    weg.setAttribute("aria-label", "Der Weg dieser Aufgabe");

    var eins = el("li");
    eins.appendChild(el("b", null, "Ihre Eingabe"));
    eins.appendChild(el("span", null, a.ziel));
    weg.appendChild(eins);

    var zwei = el("li");
    zwei.appendChild(el("b", null, "Der Kern erkennt"));
    zwei.appendChild(el("span", null, a.absicht === "unklar"
      ? "keine bekannte Absicht"
      : "Absicht „" + a.absicht + "“"));
    weg.appendChild(zwei);

    var drei = el("li");
    drei.appendChild(el("b", null, "Der Planer macht daraus"));
    drei.appendChild(el("span", null, a.schritte.length === 1
      ? "einen Schritt" : a.schritte.length + " Schritte"));
    weg.appendChild(drei);

    var freigaben = a.schritte.filter(function (s) { return s.freigabe; }).length;
    var vier = el("li");
    vier.appendChild(el("b", null, "Ergebnis wäre"));
    vier.appendChild(el("span", null, freigaben
      ? a.schritte.length + " Entwürfe, " + freigaben + " davon erst nach Ihrer Freigabe"
      : a.schritte.length + " Entwürfe — kein Schritt wirkt nach außen"));
    weg.appendChild(vier);

    return weg;
  }

  function schritteBauen(a) {
    var liste = el("ol", "demo-schritte");
    liste.setAttribute("aria-label", "Die geplanten Schritte");
    a.schritte.forEach(function (s) {
      var li = el("li");

      /* Alles Inhaltliche in EINEN Kasten: das li ist ein Raster aus Nummer
         und Koerper. Haengte man die Teile einzeln hinein, landete jeder
         zweite in der schmalen Nummernspalte. */
      var koerper = el("div", "demo-koerper");

      var kopf = el("div", "demo-kopf");
      kopf.appendChild(el("b", null, s.name));
      kopf.appendChild(el("span", "demo-recht" + (s.freigabe ? " freigabe" : ""),
        s.freigabe ? "braucht Ihre Freigabe" : "erzeugt einen Entwurf"));
      koerper.appendChild(kopf);

      koerper.appendChild(el("span", "demo-zweck", s.warum));
      koerper.appendChild(el("span", "demo-kennung", s.agent + " · Recht: " + s.recht));

      if (s.offen && s.offen.length) {
        koerper.appendChild(el("span", "demo-offen", "Dafür fehlt noch: " + s.offen.join(", ")));
      }

      li.appendChild(koerper);
      liste.appendChild(li);
    });
    return liste;
  }

  function zeigen(a) {
    leeren(ziel);

    if (a.gesperrt) {
      var sperre = el("div", "demo-sperre");
      sperre.appendChild(el("b", null, "Dafür gibt es keinen Plan."));
      sperre.appendChild(el("p", null, a.meldung));
      ziel.appendChild(sperre);
      return;
    }

    /* Der Riegel: sollte die Antwort je eine Ausfuehrung melden, wird hier
       nichts angezeigt. Lieber keine Demo als eine, die etwas behauptet. */
    if (a.ausgefuehrt !== false) {
      stand.textContent = "Unerwartete Antwort — es wird nichts angezeigt.";
      return;
    }

    var kasten = el("div", "demo-antwort");
    kasten.appendChild(wegBauen(a));
    if (a.warum) kasten.appendChild(el("p", "demo-begruendung", a.warum));
    kasten.appendChild(schritteBauen(a));
    kasten.appendChild(el("p", "demo-hinweis", a.hinweis));
    ziel.appendChild(kasten);
  }

  async function fragen(text) {
    if (laeuft) return;
    laeuft = true;
    knopf.disabled = true;
    stand.textContent = "Der Kern liest mit …";
    leeren(ziel);

    try {
      var antwort = await fetch("api/demo/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ziel: text }),
      });
      var daten = await antwort.json().catch(function () { return null; });

      if (antwort.status === 429) {
        stand.textContent = "Zu viele Anfragen in kurzer Zeit. Bitte in ein paar Minuten noch einmal.";
        return;
      }
      if (!daten) {
        stand.textContent = "Die Antwort war nicht lesbar.";
        return;
      }
      if (!antwort.ok) {
        stand.textContent = daten.meldung || "Das hat nicht geklappt.";
        return;
      }
      stand.textContent = "";
      zeigen(daten);
    } catch (e) {
      stand.textContent = "Die Demo ist gerade nicht erreichbar.";
    } finally {
      laeuft = false;
      knopf.disabled = false;
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = feld.value.trim();
    if (!text) {
      stand.textContent = "Schreiben Sie kurz hinein, was erledigt werden soll.";
      feld.focus();
      return;
    }
    fragen(text);
  });

  feld.addEventListener("input", zeichenzaehler);

  /* Die Beispiele fuellen nur das Feld und schicken ab --- sie tragen keine
     vorbereitete Antwort bei sich. Was danach steht, kommt vom Planer. */
  Array.prototype.forEach.call(
    document.querySelectorAll(".demo-beispiele [data-ziel]"),
    function (b) {
      b.addEventListener("click", function () {
        feld.value = b.getAttribute("data-ziel");
        zeichenzaehler();
        fragen(feld.value);
      });
    }
  );
})();
