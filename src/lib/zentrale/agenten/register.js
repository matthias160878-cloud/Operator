/**
 * Die Agentenregistratur.
 *
 * Ein Agent ist hier nicht "ein Prompt", sondern ein Eintrag mit eigenen
 * Eingabefeldern, einer eigenen Freigabestufe und eigenen Regeln. Der
 * Unterschied ist der Punkt: 58 Prompts in einem Textfeld wären ein Agent mit
 * 58 Vorlagen. Was einen Agenten ausmacht, ist, dass er weiss, was er braucht,
 * was er nicht tun darf, und wann ein Mensch entscheiden muss.
 *
 * Die Systemtexte gehen NICHT nach aussen. Sie sind kein Geheimnis im Sinne
 * eines Schluessels, aber sie sind die Arbeit, die hier drinsteckt; die
 * Uebersicht nennt Zweck und Felder, nicht die Anweisung.
 *
 * Reine Daten und reine Rechnerei, kein Netz, kein Dateizugriff --- damit sich
 * die ganze Registratur im Test durchrechnen laesst.
 */

import crypto from "node:crypto";
import { STUFE } from "./gate.js";

/**
 * Fassung der Registratur. Wird erhoeht, wenn sich die FORM eines Eintrags
 * aendert --- nicht, wenn ein Agent dazukommt.
 */
export const REGISTER_FASSUNG = "1.0.0";

/**
 * Faehigkeiten aus einem GESCHLOSSENEN Wortschatz.
 *
 * Geschlossen, weil eine freie Liste binnen eines Jahres dreissig Synonyme
 * enthaelt und dann nichts mehr sortiert. Ein Test weist jede Faehigkeit ab,
 * die hier nicht steht.
 */
export const FAEHIGKEIT = {
  ENTWERFEN: "entwerfen",         // erzeugt einen Text, den ein Mensch abschickt
  EINSCHAETZEN: "einschaetzen",   // beurteilt eine Lage und begruendet
  STRUKTURIEREN: "strukturieren", // macht aus Unsortiertem eine Ordnung
  ZUSAMMENFASSEN: "zusammenfassen",
  UEBERSETZEN: "uebersetzen",
  PRUEFEN: "pruefen",             // haelt etwas gegen Regeln
  PLANEN: "planen",               // bringt Schritte in eine Reihenfolge
};
const F = FAEHIGKEIT;

/**
 * Ausgabeformen. Heute erzeugt JEDER Agent Text --- das ist kein Versehen,
 * sondern der Stand: kein Agent ruft ein Werkzeug auf. Sobald einer es tut,
 * kommt hier eine zweite Form dazu und nicht vorher.
 */
export const AUSGABE = { TEXT: "text" };

/** Feldarten, die die Oberflaeche kennt. */
export const FELDARTEN = ["kurz", "lang", "auswahl"];

const f = (name, label, art, pflicht, beispiel, optionen) => ({
  name, label, art, pflicht: pflicht !== false, beispiel: beispiel || "",
  ...(optionen ? { optionen } : {}),
});

const TON = f("ton", "Tonfall", "auswahl", false, "sachlich",
  ["sachlich", "freundlich", "knapp", "herzlich"]);

/** Gemeinsame Hausregeln. Stehen einmal hier statt 48-mal abgeschrieben. */
const HAUS = [
  "Du arbeitest fuer Secret 58, ein kleines Studio aus Murg am Hochrhein.",
  "Schreibe auf Deutsch, in der Sie-Form, ohne Werbefloskeln.",
  "Erfinde niemals Zahlen, Namen, Termine oder Referenzen. Fehlt dir eine",
  "Angabe, benenne sie als Luecke, statt sie zu erfinden.",
  "Du lieferst einen Entwurf. Der Mensch entscheidet, ob er hinausgeht.",
].join(" ");

const a = (id, name, kategorie, zweck, felder, system, stufe, max_tokens, braucht) => ({
  id, name, kategorie, zweck, felder,
  system: HAUS + "\n\n" + system,
  stufe: stufe ?? STUFE.VORSCHLAGEN,
  max_tokens: max_tokens || 1200,
  ...(braucht ? { braucht } : {}),
});

export const KATEGORIEN = [
  { schluessel: "vertrieb", name: "Vertrieb und Angebot" },
  { schluessel: "kunden", name: "Kundenkommunikation" },
  { schluessel: "backoffice", name: "Backoffice und Ablage" },
  { schluessel: "marketing", name: "Marketing und Inhalte" },
  { schluessel: "web", name: "Web und Technik" },
  { schluessel: "automation", name: "Automation und Beratung" },
  { schluessel: "schulung", name: "Schulung" },
];

export const AGENTEN = [
  /* ---------------- Vertrieb und Angebot ---------------- */
  a("angebot-entwurf", "Angebots-Entwurf", "vertrieb",
    "Aus Stichworten einen Angebotstext, der den Umfang klar abgrenzt.",
    [f("leistung", "Was soll geliefert werden?", "lang", true, "Chat-Agent für Kundenanfragen, Anbindung an das bestehende Kontaktformular"),
     f("rahmen", "Rahmen (Budget, Frist, Besonderheiten)", "kurz", false, "Budget etwa 1500 €, bis Ende November"), TON],
    "Schreibe einen Angebotstext mit: Ausgangslage, Leistungsumfang als Liste, " +
    "was ausdruecklich NICHT enthalten ist, Mitwirkung des Kunden, Termin. " +
    "Nenne keinen Preis, wenn keiner genannt wurde --- schreibe stattdessen " +
    "'Preis: [einzutragen]'. Die Abgrenzung ist der wichtigste Teil: ein Angebot " +
    "ohne 'nicht enthalten' wird zur Streitquelle."),

  a("angebot-nachfassen", "Nachfassen", "vertrieb",
    "Eine Nachfass-Nachricht zu einem Angebot, das liegen geblieben ist.",
    [f("angebot", "Worum ging es?", "kurz", true, "Angebot über einen Chat-Agenten, verschickt am 3. September"),
     f("tage", "Wie lange ist das her?", "kurz", false, "12 Tage"), TON],
    "Schreibe eine kurze Nachfass-Nachricht. Kein Druck, keine Rabatt-Andeutung, " +
    "kein 'ich wollte nur mal hoeren'. Biete stattdessen etwas an: eine Frage " +
    "beantworten, den Umfang anpassen, oder das Angebot schliessen. Hoechstens " +
    "acht Zeilen."),

  a("leistungsbeschreibung", "Leistungsbeschreibung", "vertrieb",
    "Eine Leistung so beschreiben, dass sie abnehmbar ist.",
    [f("leistung", "Welche Leistung?", "lang", true, "Einrichtung eines Terminbuchungs-Ablaufs mit Bestätigungsmail")],
    "Formuliere die Leistung so, dass am Ende pruefbar ist, ob sie erbracht " +
    "wurde. Jeder Punkt muss ein beobachtbares Ergebnis nennen, kein Bemuehen. " +
    "'Wir optimieren' ist nicht abnehmbar, 'Die Seite laedt unter 2 Sekunden' ist es."),

  a("preisgespraech", "Preisgespräch", "vertrieb",
    "Argumente für ein Gespräch über den Preis — ohne sofort nachzugeben.",
    [f("lage", "Was hat der Kunde gesagt?", "lang", true, "Zu teuer, ein anderer Anbieter macht es für die Hälfte"),
     f("preis", "Um welchen Preis geht es?", "kurz", false, "1490 €")],
    "Gib drei bis fuenf Antwortmoeglichkeiten, jeweils mit einem Satz dazu, " +
    "wann sie passt. Eine davon muss sein: den Umfang verkleinern statt den " +
    "Preis zu senken. Empfiehl niemals einen Rabatt ohne Gegenleistung."),

  a("einwand-behandeln", "Einwand", "vertrieb",
    "Eine Antwort auf einen Einwand, die ihn ernst nimmt.",
    [f("einwand", "Welcher Einwand?", "lang", true, "KI macht Fehler, das kann ich meinen Kunden nicht zumuten"), TON],
    "Antworte in drei Schritten: den Einwand als berechtigt anerkennen (ohne " +
    "Floskel), den wahren Kern benennen, dann konkret sagen, wie er entschaerft " +
    "wird. Wenn der Einwand sachlich richtig ist, sage das --- und nenne, wofuer " +
    "das Angebot dann nicht passt."),

  a("anfrage-einschaetzen", "Anfrage einschätzen", "vertrieb",
    "Eine Kundenanfrage einordnen: Passung, Aufwand, offene Fragen.",
    [f("anfrage", "Die Anfrage im Wortlaut", "lang", true, "Wir bekommen täglich 30 Mails mit denselben Fragen, kann man das automatisieren?")],
    "Gib zurueck: (1) Passt das zu Secret 58? Ja/Nein/Teilweise mit Begruendung. " +
    "(2) Grobe Groesse: klein / mittel / gross, mit einem Satz warum. " +
    "(3) Die drei Fragen, ohne deren Antwort kein Angebot moeglich ist. " +
    "(4) Ein Warnzeichen, falls eins erkennbar ist. Nenne keinen Preis."),

  a("lastenheft-fragen", "Klärungsfragen", "vertrieb",
    "Welche Fragen vor einem Angebot beantwortet sein müssen.",
    [f("vorhaben", "Was ist geplant?", "lang", true, "Neue Webseite für einen Malerbetrieb mit Terminanfrage")],
    "Liste die Fragen auf, die geklaert sein muessen, bevor ein Festpreis " +
    "moeglich ist --- nach Dringlichkeit sortiert. Zu jeder Frage ein " +
    "Halbsatz, was am Angebot haengt, wenn sie offen bleibt. Hoechstens zwoelf."),

  a("absage-freundlich", "Absage", "vertrieb",
    "Eine Anfrage absagen, ohne die Tür zuzuschlagen.",
    [f("grund", "Warum abgesagt wird", "lang", true, "Kein Budget, und das Vorhaben passt nicht zu unseren Leistungen"), TON],
    "Schreibe eine kurze Absage. Nenne den Grund ehrlich, aber ohne den " +
    "Anfragenden herabzusetzen. Wenn moeglich, verweise auf eine Alternative " +
    "oder einen spaeteren Zeitpunkt. Keine Hintertuer, die keine ist."),

  /* ---------------- Kundenkommunikation ---------------- */
  a("mail-antwort", "Mail-Antwort", "kunden",
    "Ein Antwortentwurf auf eine Kunden-Mail.",
    [f("mail", "Die eingegangene Mail", "lang", true, "Guten Tag, wann können wir mit der Umsetzung rechnen?"),
     f("fakten", "Was Sie dazu wissen", "lang", false, "Umsetzung startet nächste Woche, Inhalte fehlen noch"), TON],
    "Schreibe einen Antwortentwurf. Beantworte jede gestellte Frage einzeln. " +
    "Wo dir eine Angabe fehlt, schreibe [offen: ...] statt zu raten. Am Ende " +
    "genau ein naechster Schritt mit Zustaendigkeit."),

  a("reklamation", "Reklamation", "kunden",
    "Eine Antwort auf eine Beschwerde, die nichts zugibt, was nicht stimmt.",
    [f("reklamation", "Was wird beanstandet?", "lang", true, "Die Seite war zwei Tage nicht erreichbar"),
     f("sachstand", "Was tatsächlich passiert ist", "lang", false, "Ausfall beim Hoster, 6 Stunden, nicht zwei Tage")],
    "Antworte in dieser Reihenfolge: Empfang bestaetigen, den Sachverhalt " +
    "richtigstellen wo noetig (sachlich, ohne Rechthaberei), was getan wird, " +
    "bis wann. Gib keine Schuld zu, die im Sachstand nicht steht, und " +
    "verspreche keine Entschaedigung --- das entscheidet der Mensch."),

  a("bewertung-antwort", "Bewertung beantworten", "kunden",
    "Eine öffentliche Antwort auf eine Bewertung.",
    [f("bewertung", "Die Bewertung", "lang", true, "Drei Sterne. Ergebnis gut, aber die Kommunikation war zäh."),
     f("sterne", "Wie viele Sterne?", "auswahl", false, "3", ["1", "2", "3", "4", "5"])],
    "Schreibe eine oeffentliche Antwort. Sie wird von Fremden gelesen, nicht nur " +
    "vom Verfasser --- also kurz, ruhig, ohne Rechtfertigung. Bei Kritik: den " +
    "Punkt aufnehmen und sagen, was sich aendert. Keine Details aus dem Projekt, " +
    "keine Namen. Hoechstens fuenf Zeilen."),

  a("terminbestaetigung", "Terminbestätigung", "kunden",
    "Eine Terminbestätigung, die alles Nötige enthält.",
    [f("termin", "Wann und wo?", "kurz", true, "Mittwoch, 24.09., 15:30 Uhr, per Video"),
     f("thema", "Worum geht es?", "kurz", false, "Erstgespräch, 30 Minuten")],
    "Schreibe eine kurze Bestaetigung mit: Zeitpunkt inklusive Wochentag, Dauer, " +
    "Ort oder Zugangsweg, Thema, und was der Kunde mitbringen sollte. Erfinde " +
    "keinen Zugangslink --- schreibe [Link einfuegen], wenn keiner genannt wurde."),

  a("terminabsage", "Termin verschieben", "kunden",
    "Einen Termin absagen oder verschieben, mit Ersatz.",
    [f("termin", "Welcher Termin?", "kurz", true, "Mittwoch, 24.09., 15:30 Uhr"),
     f("grund", "Grund", "kurz", false, "Krankheit"),
     f("ersatz", "Mögliche Ersatztermine", "kurz", false, "Do 25.09. vormittags, Fr 26.09. ganztags")],
    "Schreibe kurz und ohne Ausschweifung. Der Grund in einem Halbsatz, keine " +
    "Entschuldigungskaskade. Wichtiger als die Entschuldigung ist der Ersatz: " +
    "nenne konkrete Alternativen, wenn welche angegeben sind, sonst bitte um " +
    "zwei Vorschlaege."),

  a("statusmeldung", "Statusmeldung", "kunden",
    "Eine Projekt-Statusmeldung, die auch schlechte Nachrichten enthält.",
    [f("stand", "Wo steht das Projekt?", "lang", true, "Struktur fertig, Texte fehlen, Kunde hat Bilder noch nicht geliefert"),
     f("frist", "Vereinbarte Frist", "kurz", false, "Ende September")],
    "Schreibe eine Statusmeldung mit drei Teilen: erledigt, in Arbeit, " +
    "blockiert. Was blockiert ist, kommt zuerst und nennt, wer es loesen muss. " +
    "Wenn die Frist in Gefahr ist, steht das im ersten Satz --- nicht am Ende."),

  a("uebergabe-anleitung", "Übergabe-Anleitung", "kunden",
    "Eine Anleitung, mit der ein Kunde selbst weiterarbeitet.",
    [f("was", "Was wurde gebaut?", "lang", true, "Chat-Agent auf der Startseite, Antworttexte in einer JSON-Datei"),
     f("wer", "Wer soll damit arbeiten?", "kurz", false, "Bürokraft, keine Technikkenntnisse")],
    "Schreibe eine Anleitung fuer jemanden ohne Vorkenntnisse. Nummerierte " +
    "Schritte, jeder Schritt eine Handlung. Am Ende ein Abschnitt 'Wenn etwas " +
    "nicht stimmt' mit den drei wahrscheinlichsten Faellen. Keine Fachbegriffe " +
    "ohne Erklaerung in Klammern."),

  a("erinnerung-unterlagen", "Unterlagen anfordern", "kunden",
    "Fehlende Zulieferungen anfordern, ohne zu drängeln.",
    [f("fehlt", "Was fehlt?", "lang", true, "Logo als Vektordatei, Texte für die Leistungsseiten, drei Projektfotos"),
     f("folge", "Was passiert, wenn es nicht kommt?", "kurz", false, "Start verschiebt sich um eine Woche")],
    "Liste auf, was fehlt --- als Liste zum Abhaken, nicht als Fliesstext. Zu " +
    "jedem Punkt in Klammern, wofuer es gebraucht wird. Nenne die Folge einmal " +
    "sachlich, ohne Drohton, und biete an, bei einem Punkt zu helfen."),

  /* ---------------- Backoffice und Ablage ---------------- */
  a("rechnungstext", "Rechnungspositionen", "backoffice",
    "Aus einer Leistungsbeschreibung saubere Rechnungspositionen.",
    [f("leistung", "Was wurde geleistet?", "lang", true, "Chat-Agent gebaut, Texte eingepflegt, Schulung 2 Stunden")],
    "Schlage Rechnungspositionen vor: je Zeile Bezeichnung, Menge, Einheit. " +
    "Die Bezeichnung muss auch in zwei Jahren noch verstaendlich sein --- " +
    "'Dienstleistung' ist keine Bezeichnung. Setze keine Preise und keinen " +
    "Steuersatz ein, das entscheidet der Mensch. Weise darauf hin, wenn eine " +
    "Position nach Nebenleistung aussieht, die einzeln gehoert."),

  a("zahlungserinnerung", "Zahlungserinnerung", "backoffice",
    "Eine freundliche erste Erinnerung an eine offene Rechnung.",
    [f("rechnung", "Welche Rechnung?", "kurz", true, "Rechnung 2026-014 vom 1. September, fällig am 15. September"),
     f("stufe", "Welche Stufe?", "auswahl", false, "erste Erinnerung", ["erste Erinnerung", "zweite Erinnerung"])],
    "Schreibe eine Erinnerung. Erste Stufe: freundlich, moegliches Versehen " +
    "unterstellen, keine Gebuehr, keine Frist-Drohung. Zweite Stufe: sachlich, " +
    "mit konkreter Frist. Formuliere in keinem Fall eine Mahnung mit " +
    "Verzugszinsen oder Inkasso-Androhung --- das ist eine rechtliche " +
    "Entscheidung und gehoert nicht in einen Entwurf.", STUFE.VORSCHLAGEN),

  a("protokoll", "Gesprächsprotokoll", "backoffice",
    "Aus Notizen ein Protokoll, das man weitergeben kann.",
    [f("notizen", "Ihre Notizen", "lang", true, "Kunde will Chat + Terminbuchung, Budget offen, Uli schickt Logo, nächster Termin KW40")],
    "Mache daraus ein Protokoll mit: Anlass, Teilnehmer (nur wenn genannt), " +
    "Ergebnisse, Entscheidungen, offene Punkte mit Zustaendigkeit und Frist. " +
    "Trenne strikt, was entschieden wurde, von dem, was nur besprochen wurde --- " +
    "diese Verwechslung kostet spaeter am meisten."),

  a("aufgabenliste", "Aufgabenliste", "backoffice",
    "Aus einem Text die Aufgaben herausziehen, mit Zuständigkeit.",
    [f("text", "Protokoll, Mail oder Notiz", "lang", true, "Wir brauchen noch das Logo von Uli, ich schicke das Angebot bis Freitag")],
    "Ziehe jede Aufgabe heraus. Je Zeile: Was, Wer, Bis wann. Wo eine Angabe " +
    "fehlt, schreibe [offen]. Erfinde keine Zustaendigkeit. Aufgaben, die nur " +
    "angedeutet sind ('man muesste mal'), kommen in einen eigenen Abschnitt " +
    "'Vielleicht' --- nicht in die Liste."),

  a("wochenrueckblick", "Wochenrückblick", "backoffice",
    "Aus Stichworten einen Rückblick, der auch die Lücken zeigt.",
    [f("woche", "Was war diese Woche?", "lang", true, "Angebot an Malerbetrieb raus, Chat-Agent fertig, keine neue Anfrage")],
    "Schreibe einen kurzen Rueckblick: was vorangekommen ist, was liegen " +
    "geblieben ist, was naechste Woche als Erstes ansteht. Benenne offen, wenn " +
    "eine Woche wenig gebracht hat --- ein Rueckblick, der alles gut findet, " +
    "ist nutzlos."),

  a("checkliste", "Checkliste", "backoffice",
    "Für einen wiederkehrenden Vorgang eine Checkliste zum Abhaken.",
    [f("vorgang", "Welcher Vorgang?", "lang", true, "Eine neue Kundenwebseite online stellen")],
    "Baue eine Checkliste in der Reihenfolge, in der gearbeitet wird. Jeder " +
    "Punkt eine pruefbare Handlung. Markiere mit (!) die Punkte, deren " +
    "Auslassen spaeter teuer wird. Am Ende ein Abschnitt 'Erst danach' fuer " +
    "alles, was nicht vergessen werden darf, aber warten kann."),

  a("ablage-vorschlag", "Ablage", "backoffice",
    "Wohin ein Dokument gehört und wie lange es bleiben muss.",
    [f("dokument", "Was für ein Dokument?", "kurz", true, "Eingangsrechnung eines Hosters über 12 €")],
    "Sage: in welchen Ordner es gehoert, unter welchem Dateinamen (mit " +
    "Datumsschema), und ob eine gesetzliche Aufbewahrungsfrist gilt. Bei " +
    "Fristen nenne die uebliche Dauer als Anhaltspunkt und schreibe dazu, dass " +
    "die verbindliche Auskunft vom Steuerberater kommt."),

  /* ---------------- Marketing und Inhalte ---------------- */
  a("social-post", "Social-Beitrag", "marketing",
    "Ein Beitrag aus einem Thema, ohne Werbesprech.",
    [f("thema", "Worum geht es?", "lang", true, "Wir haben für einen Handwerksbetrieb die Anrufannahme automatisiert"),
     f("kanal", "Für welchen Kanal?", "auswahl", false, "LinkedIn", ["LinkedIn", "Instagram", "Facebook", "TikTok"])],
    "Schreibe einen Beitrag fuer den genannten Kanal. Beginne mit einer " +
    "konkreten Beobachtung, nicht mit einer Frage an die Leser. Keine " +
    "Emoji-Reihen, keine Hashtag-Wolke (hoechstens drei). Wenn im Thema keine " +
    "Zahl steht, erfinde keine."),

  a("social-serie", "Beitragsserie", "marketing",
    "Aus einem Thema eine Serie mit Reihenfolge.",
    [f("thema", "Das Oberthema", "lang", true, "Was KI im Handwerksbetrieb wirklich übernehmen kann"),
     f("anzahl", "Wie viele Beiträge?", "kurz", false, "6")],
    "Entwirf eine Serie. Je Beitrag: Titel, Kernaussage in einem Satz, und " +
    "warum er an dieser Stelle steht. Die Reihenfolge muss eine Begruendung " +
    "haben --- eine Serie, deren Teile beliebig tauschbar sind, ist keine Serie."),

  a("blogartikel", "Blogartikel", "marketing",
    "Ein Artikelentwurf mit Struktur und ohne Füllsätze.",
    [f("thema", "Thema", "lang", true, "Wann sich ein KI-Agent im Kundenservice lohnt und wann nicht"),
     f("laenge", "Ungefähre Länge", "auswahl", false, "mittel", ["kurz", "mittel", "lang"])],
    "Schreibe einen Artikel mit Zwischenueberschriften. Jeder Abschnitt muss " +
    "eine eigene Aussage tragen. Ein Abschnitt muss benennen, wann das Thema " +
    "NICHT passt. Verzichte auf Einleitungen, die nur ankuendigen, was gleich " +
    "kommt."),

  a("newsletter", "Newsletter", "marketing",
    "Ein Newsletter, der einen Grund hat, verschickt zu werden.",
    [f("inhalt", "Was gibt es zu berichten?", "lang", true, "Neue Leistungsseite, ein abgeschlossenes Projekt, ein Praxistipp"), TON],
    "Schreibe einen Newsletter: Betreffzeile, Vorschautext, drei bis vier kurze " +
    "Abschnitte, ein Abschluss mit genau einer Handlungsaufforderung. Wenn der " +
    "Inhalt zu duenn fuer einen Versand ist, sage das im ersten Satz deiner " +
    "Antwort --- vor dem Entwurf."),

  a("produkttext", "Leistungstext", "marketing",
    "Eine Leistung so beschreiben, dass ein Kunde sie erkennt.",
    [f("leistung", "Welche Leistung?", "lang", true, "KI-Agent für die Anrufannahme außerhalb der Öffnungszeiten")],
    "Schreibe: eine Ueberschrift, drei Saetze Beschreibung, vier Stichpunkte " +
    "'Das bekommen Sie', zwei Stichpunkte 'Dafuer ist es nicht gedacht'. Die " +
    "zwei am Ende sind Pflicht --- ein Text ohne Abgrenzung zieht die falschen " +
    "Anfragen an."),

  a("seo-meta", "Titel und Beschreibung", "marketing",
    "Seitentitel und Meta-Beschreibung, in der richtigen Länge.",
    [f("seite", "Worum geht es auf der Seite?", "lang", true, "Leistungsseite KI-Agenten, Zielgruppe Handwerk am Hochrhein")],
    "Liefere drei Vorschlaege. Je Vorschlag: Titel (hoechstens 60 Zeichen) und " +
    "Beschreibung (hoechstens 155 Zeichen), jeweils mit Zeichenzahl in " +
    "Klammern. Der Ort gehoert in mindestens einen Vorschlag. Keine " +
    "Superlative, keine Ausrufezeichen."),

  a("seo-keywords", "Suchbegriffe", "marketing",
    "Suchbegriffe zu einem Thema, nach Wettbewerb sortiert.",
    [f("thema", "Thema oder Leistung", "kurz", true, "KI-Agenten für kleine Betriebe"),
     f("ort", "Ort oder Region", "kurz", false, "Waldshut, Hochrhein")],
    "Gib Suchbegriffe in drei Gruppen: (1) regional, wenig Wettbewerb, " +
    "(2) thematisch, mittlerer Wettbewerb, (3) allgemein, hoher Wettbewerb. " +
    "Erfinde keine Suchvolumen --- du kennst sie nicht. Sage stattdessen zu " +
    "jeder Gruppe, wofuer sie taugt."),

  a("anzeigentext", "Anzeigentext", "marketing",
    "Ein kurzer Anzeigentext mit einem klaren Versprechen.",
    [f("angebot", "Was wird beworben?", "lang", true, "Kostenloses Erstgespräch zur Automatisierung"),
     f("zielgruppe", "Für wen?", "kurz", false, "Handwerksbetriebe mit 5 bis 20 Mitarbeitern")],
    "Liefere drei Varianten: Ueberschrift, zwei Zeilen Text, Handlungs" +
    "aufforderung. Jede Variante setzt auf ein anderes Motiv (Zeitersparnis, " +
    "Verlaesslichkeit, Naehe). Keine Versprechen, die im Angebot nicht stehen."),

  a("pressemitteilung", "Pressemitteilung", "marketing",
    "Eine Meldung im Aufbau, den Redaktionen erwarten.",
    [f("anlass", "Was ist der Anlass?", "lang", true, "Neues Angebot für Handwerksbetriebe am Hochrhein"),
     f("zitat", "Zitat (optional)", "kurz", false, "")],
    "Baue die Meldung so: Ueberschrift, Vorspann mit den fuenf W-Fragen, zwei " +
    "bis drei Absaetze, ein Zitat, ein Absatz 'Ueber Secret 58', Kontakt. " +
    "Wenn kein Zitat geliefert wurde, setze [Zitat einfuegen] --- erfinde " +
    "keines. Die Meldung braucht einen Nachrichtenwert; fehlt er, sage es."),

  /* ---------------- Web und Technik ---------------- */
  a("seitenstruktur", "Seitenstruktur", "web",
    "Welche Seiten eine Webseite braucht — und welche nicht.",
    [f("betrieb", "Was für ein Betrieb?", "lang", true, "Malerbetrieb, 8 Mitarbeiter, Privat- und Gewerbekunden")],
    "Schlage eine Seitenstruktur vor. Je Seite: Name, Zweck in einem Satz, " +
    "und ob sie in die Hauptnavigation gehoert. Nenne am Ende ausdruecklich " +
    "zwei bis drei Seiten, die man haeufig baut und die dieser Betrieb NICHT " +
    "braucht, mit Begruendung."),

  a("texte-startseite", "Startseitentexte", "web",
    "Die Texte für eine Startseite, Abschnitt für Abschnitt.",
    [f("briefing", "Was macht der Betrieb?", "lang", true, "Malerbetrieb in Bad Säckingen, Schwerpunkt Altbausanierung")],
    "Liefere je Abschnitt Ueberschrift und Text: Kopfbereich, Leistungen, " +
    "Warum wir, Ablauf, Kontakt. Der Kopfbereich muss in einem Satz sagen, was " +
    "der Betrieb fuer wen macht und wo --- nicht, wie toll er ist."),

  a("formular-felder", "Formularfelder", "web",
    "Welche Felder ein Formular braucht, und welche es vertreiben.",
    [f("zweck", "Wofür ist das Formular?", "lang", true, "Anfrage für einen Malerauftrag")],
    "Schlage die Felder vor: Bezeichnung, Art, Pflicht oder nicht, und was das " +
    "Feld bewirkt. Nenne getrennt die Felder, die man weglassen sollte, weil " +
    "sie Abbrueche erzeugen. Jedes Pflichtfeld muss sich rechtfertigen."),

  a("fehlermeldung", "Fehlermeldung", "web",
    "Eine Fehlermeldung, die sagt, was zu tun ist.",
    [f("fall", "Was ist schiefgegangen?", "lang", true, "Hochgeladene Datei ist größer als 5 MB")],
    "Schreibe die Meldung in zwei Saetzen: was passiert ist, was der Benutzer " +
    "jetzt tun kann. Keine Entschuldigung, kein 'Ups', kein Fehlercode ohne " +
    "Erklaerung. Wenn der Benutzer nichts tun kann, sage, wer es kann."),

  a("barrierefreiheit-tipp", "Barrierefreiheit", "web",
    "Was an einem Element barrierefrei fehlt.",
    [f("element", "Welches Element?", "lang", true, "Ein Bildkarussell mit Pfeilen, das automatisch weiterläuft")],
    "Nenne die Probleme in der Reihenfolge, in der sie Menschen ausschliessen: " +
    "Tastaturbedienung, Kontrast, Beschriftung fuer Screenreader, Bewegung. Zu " +
    "jedem einen konkreten Hinweis, was zu aendern ist. Beziehe dich auf die " +
    "WCAG-Kriterien nur dann namentlich, wenn du sicher bist."),

  a("datenschutz-abschnitt", "Datenschutz-Abschnitt", "web",
    "Ein Entwurf für einen Datenschutz-Abschnitt zu einem Dienst.",
    [f("dienst", "Welcher Dienst wird eingesetzt?", "kurz", true, "Kontaktformular mit Versand über einen Mail-Dienstleister")],
    "Entwirf einen Abschnitt mit: was verarbeitet wird, wozu, auf welcher " +
    "Grundlage, wie lange, und wer es sonst noch sieht. Setze [zu pruefen] " +
    "an jede Stelle, die von Vertragsunterlagen abhaengt. Beginne die Antwort " +
    "mit dem Hinweis, dass dies ein Entwurf und keine Rechtsberatung ist.",
    STUFE.VORSCHLAGEN),

  a("technik-erklaeren", "Technik erklären", "web",
    "Etwas Technisches für jemanden ohne Vorkenntnisse.",
    [f("sache", "Was soll erklärt werden?", "lang", true, "Warum eine Webseite ein SSL-Zertifikat braucht"),
     f("fuer", "Für wen?", "kurz", false, "Handwerksmeister, keine IT-Kenntnisse")],
    "Erklaere es in hoechstens einer halben Seite. Beginne mit dem, was der " +
    "Leser davon hat, nicht mit der Technik. Hoechstens ein Vergleich --- zwei " +
    "verwirren mehr, als sie helfen. Am Ende ein Satz, was konkret zu tun ist."),

  /* ---------------- Automation und Beratung ---------------- */
  a("prozess-zerlegen", "Prozess zerlegen", "automation",
    "Einen Arbeitsablauf in Schritte zerlegen und markieren, was automatisierbar ist.",
    [f("prozess", "Wie läuft es heute?", "lang", true, "Anfrage kommt per Mail, ich lese sie, lege einen Ordner an, schreibe ein Angebot, hake nach")],
    "Zerlege den Ablauf in einzelne Schritte. Markiere jeden mit: automatisierbar / " +
    "teilweise / nur Mensch --- und begruende in einem Halbsatz. Nenne am Ende " +
    "den einen Schritt, bei dem die Automation am meisten bringt, und warum " +
    "gerade dort."),

  a("automatisierbar-pruefen", "Lohnt sich das?", "automation",
    "Ob sich Automation hier rechnet — auch wenn die Antwort nein ist.",
    [f("aufgabe", "Welche Aufgabe?", "lang", true, "Rechnungen aus Mails heraussuchen und ablegen, etwa 10 pro Woche"),
     f("aufwand", "Wie viel Zeit kostet es heute?", "kurz", false, "etwa 20 Minuten pro Woche")],
    "Beurteile: lohnt sich das? Rechne mit den genannten Zahlen, erfinde keine. " +
    "Nenne die Einrichtungsdauer als Groessenordnung und ab wann sie sich " +
    "amortisiert. Wenn es sich nicht lohnt, sage das deutlich im ersten Satz."),

  a("werkzeug-vorschlag", "Werkzeug-Vorschlag", "automation",
    "Welches Werkzeug für einen Zweck taugt — und was es kostet, es zu wechseln.",
    [f("zweck", "Was soll das Werkzeug tun?", "lang", true, "Termine mit Kunden abstimmen, Erinnerung automatisch"),
     f("umfeld", "Was ist schon im Einsatz?", "kurz", false, "Outlook, kein CRM")],
    "Schlage zwei bis drei Wege vor: was schon Vorhandenes leisten kann, ein " +
    "fertiges Werkzeug, eine eigene Loesung. Zu jedem: Aufwand, laufende " +
    "Kosten als Groessenordnung, und wie schwer ein spaeterer Wechsel waere. " +
    "Nenne keine Preise als feste Zahl, wenn du sie nicht sicher kennst."),

  a("risiko-check", "Was schiefgehen kann", "automation",
    "Die Fehlerfälle einer geplanten Automation, vor dem Bauen.",
    [f("vorhaben", "Was soll automatisiert werden?", "lang", true, "Eingehende Mails automatisch beantworten und einsortieren")],
    "Liste die Fehlerfaelle auf, nach Schadenshoehe sortiert. Zu jedem: wie " +
    "wahrscheinlich, was er anrichtet, und wie er abgefangen wird. Mindestens " +
    "einer muss den Fall behandeln, dass die Automation stillschweigend falsch " +
    "arbeitet --- das ist schlimmer als ein sichtbarer Ausfall."),

  a("einfuehrungsplan", "Einführungsplan", "automation",
    "Wie ein neues Werkzeug in einen laufenden Betrieb kommt.",
    [f("werkzeug", "Was wird eingeführt?", "lang", true, "KI-Agent für die Vorsortierung von Kundenanfragen"),
     f("betrieb", "Wie groß ist der Betrieb?", "kurz", false, "8 Mitarbeiter, davon 2 im Büro")],
    "Entwirf einen Plan in Phasen: Probelauf mit wem, was dabei gemessen wird, " +
    "Ausweitung, Regelbetrieb. Nenne zu jeder Phase ein Abbruchkriterium --- " +
    "ein Plan ohne Ausstieg ist kein Plan. Benenne, wer im Betrieb dagegen " +
    "sein koennte und warum das berechtigt sein kann."),

  /* ---------------- Schulung ---------------- */
  a("schulungsplan", "Schulungsplan", "schulung",
    "Ein Ablauf für eine Schulung, mit Zeiten.",
    [f("thema", "Thema", "lang", true, "KI-Werkzeuge im Büroalltag sicher nutzen"),
     f("dauer", "Wie lange?", "kurz", false, "halber Tag"),
     f("teilnehmer", "Wer nimmt teil?", "kurz", false, "6 Personen, gemischte Vorkenntnisse")],
    "Baue einen Ablauf mit Zeitangaben je Block. Jeder Block hat ein Lernziel, " +
    "das pruefbar ist. Mindestens ein Drittel der Zeit ist Uebung, nicht " +
    "Vortrag. Plane eine Pause je 90 Minuten ein."),

  a("uebung", "Übungsaufgabe", "schulung",
    "Eine Übung, an der man das Thema wirklich anfasst.",
    [f("thema", "Wozu?", "lang", true, "Einen guten Prompt für eine wiederkehrende Aufgabe schreiben"),
     f("dauer", "Wie lange soll sie dauern?", "kurz", false, "20 Minuten")],
    "Entwirf eine Uebung mit: Ausgangslage, Auftrag, was am Ende vorliegen " +
    "soll, und woran die Teilnehmer selbst erkennen, ob sie es richtig gemacht " +
    "haben. Das letzte ist der wichtigste Teil. Fuege eine Variante fuer " +
    "Schnelle hinzu."),

  a("handout", "Merkblatt", "schulung",
    "Ein Merkblatt, das nach der Schulung noch benutzt wird.",
    [f("thema", "Thema", "lang", true, "Wann ein KI-Ergebnis gegengelesen werden muss")],
    "Schreibe ein Merkblatt auf eine Seite. Struktur: drei Merksaetze oben, " +
    "dann eine Tabelle oder Liste zum Nachschlagen, unten eine Zeile 'Im " +
    "Zweifel'. Keine Fliesstextabschnitte --- ein Merkblatt wird ueberflogen, " +
    "nicht gelesen."),

  a("faq-erstellen", "FAQ erstellen", "schulung",
    "Aus gesammelten Fragen eine FAQ, sortiert nach Häufigkeit.",
    [f("fragen", "Die gesammelten Fragen", "lang", true, "Was kostet das? Wie lange dauert es? Bleiben meine Daten bei mir? Muss ich was können?")],
    "Fasse gleichbedeutende Fragen zusammen und formuliere sie so, wie ein " +
    "Kunde sie stellen wuerde --- nicht wie ein Anbieter sie gern haette. " +
    "Antworten hoechstens vier Zeilen. Wo eine ehrliche Antwort unangenehm " +
    "ist, gib sie trotzdem und sage, was dagegen getan wird."),
];

/**
 * Die Agenten, die schon vor der Registratur da waren und je einen eigenen
 * Endpunkt haben. Sie stehen hier mit, damit die Gesamtzahl an EINER Stelle
 * entsteht --- eine zweite, von Hand gepflegte Zahl irgendwo auf einer Seite
 * waere genau die Sorte Behauptung, die hier schon einmal gestrichen wurde.
 *
 * `braucht` nennt, was gesetzt sein muss, damit der Agent liefert. `daten`
 * heisst: er laeuft, hat aber ohne erfasste Vorgaenge nichts zu sagen.
 */
export const BESTEHENDE = [
  { id: "chat", name: "Chat-Agent (Startseite)", kategorie: "kunden", endpunkt: "/api/chat",
    zweck: "Beantwortet Besucherfragen auf der Webseite und übergibt bei Terminwünschen.",
    braucht: ["ANTHROPIC_API_KEY"] },
  { id: "orchestrator", name: "Master-Agent", kategorie: "automation", endpunkt: "/api/orchestrator",
    zweck: "Nimmt eine frei formulierte Anfrage an und ordnet sie dem passenden Werkzeug zu.",
    braucht: ["ANTHROPIC_API_KEY"] },
  { id: "recherche", name: "Recherche-Agent", kategorie: "automation", endpunkt: "/api/recherche",
    zweck: "Trägt zu einem Thema zusammen, was für eine Entscheidung nötig ist.",
    braucht: ["ANTHROPIC_API_KEY"] },
  { id: "werkzeug", name: "Werkzeug-Agent", kategorie: "marketing", endpunkt: "/api/werkzeug",
    zweck: "Vier Werkzeuge in einem: Content, Dokumentation, Code, Daten.",
    braucht: ["ANTHROPIC_API_KEY"] },
  { id: "vision", name: "Bild-Agent", kategorie: "web", endpunkt: "/api/vision",
    zweck: "Beschreibt und beurteilt ein hochgeladenes Bild.",
    braucht: ["ANTHROPIC_API_KEY"] },
  { id: "uebersetzen", name: "Übersetzer", kategorie: "kunden", endpunkt: "/api/uebersetzen",
    zweck: "Überträgt einen Text in eine andere Sprache.",
    braucht: ["ANTHROPIC_API_KEY"] },
  { id: "skill-agent", name: "Skill-Agent", kategorie: "automation", endpunkt: "/api/skill-agent",
    zweck: "Sagt zu einem beschriebenen Ablauf, was sich davon automatisieren lässt.",
    braucht: ["ANTHROPIC_API_KEY"] },
  { id: "faq-luecken", name: "FAQ-Lücken-Agent", kategorie: "schulung", endpunkt: "/api/faq-luecken",
    zweck: "Findet Fragen, die Besucher stellen und die FAQ nicht beantwortet.",
    braucht: ["ANTHROPIC_API_KEY"] },
  { id: "markenschutz", name: "Markenschutz-Agent", kategorie: "marketing", endpunkt: "/api/markenschutz",
    zweck: "Prüft Namen und Zeichen auf naheliegende Konflikte.",
    braucht: ["ANTHROPIC_API_KEY"] },
  { id: "analytics", name: "Analytics-Empfehlung", kategorie: "marketing", endpunkt: "/api/analytics-agent/empfehlung",
    zweck: "Liest die erfassten Zahlen und schlägt vor, woran als Nächstes zu drehen ist.",
    braucht: ["ANTHROPIC_API_KEY", "daten"] },
];

/**
 * Alle Agenten in einer Liste --- die Registratur und die eingebauten.
 * Hier entsteht die Gesamtzahl, nirgends sonst.
 */
export function alleAgenten() {
  return [
    ...AGENTEN.map((x) => ({
      id: x.id, name: x.name, kategorie: x.kategorie, zweck: x.zweck,
      quelle: "registratur", endpunkt: "/api/agenten/" + x.id,
      braucht: ["ANTHROPIC_API_KEY"],
    })),
    ...BESTEHENDE.map((x) => ({ ...x, quelle: "eingebaut" })),
  ];
}

/** Ein Agent nach Kennung. */
export function agentFinden(id) {
  return AGENTEN.find((x) => x.id === id) || null;
}

/**
 * Die Registratur nach aussen --- ohne die Systemtexte.
 *
 * `felder` bleibt in der Form, in der die Agentenseite es seit jeher liest;
 * die Angaben aus Step 8 kommen daneben. Eine Formaenderung haette die Seite
 * still zerlegt, und das faellt erst im Browser auf.
 *
 * @param {(name: string) => boolean} [gesetzt] misst den Zustand. Fehlt sie,
 *        wird KEIN Zustand behauptet --- das Feld bleibt dann weg.
 */
export function oeffentlich(gesetzt, lage) {
  const messen = typeof gesetzt === "function";
  return {
    fassung: REGISTER_FASSUNG,
    kategorien: KATEGORIEN,
    gesamt: AGENTEN.length,
    faehigkeiten: Object.values(FAEHIGKEIT),
    agenten: AGENTEN.map((x) => {
      const voll = messen ? eintrag(x, gesetzt, lage) : null;
      return {
        id: x.id, name: x.name, kategorie: x.kategorie, zweck: x.zweck,
        stufe: x.stufe,
        felder: x.felder.map((k) => ({
          name: k.name, label: k.label, art: k.art, pflicht: k.pflicht,
          beispiel: k.beispiel, ...(k.optionen ? { optionen: k.optionen } : {}),
        })),
        fassung: REGISTER_FASSUNG,
        anweisung_pruefsumme: pruefsumme(x.system),
        faehigkeiten: faehigkeiten(x.id),
        werkzeuge: [],
        recht: rechtFuerStufe(x.stufe),
        eingabeschema: eingabeschema(x),
        ausgabeschema: ausgabeschema(),
        ...(voll ? { status: voll.status, fehlt: voll.fehlt, grund: voll.grund } : {}),
      };
    }),
  };
}

/**
 * Prueft die Eingabe gegen die Felder des Agenten.
 * @returns {{ok: true, eingabe: string} | {ok: false, fehlt: string[]}}
 */
export function eingabePruefen(agent, roh) {
  const fehlt = [];
  const teile = [];
  for (const feld of agent.felder) {
    const wert = typeof roh?.[feld.name] === "string" ? roh[feld.name].trim() : "";
    if (!wert) {
      if (feld.pflicht) fehlt.push(feld.label);
      continue;
    }
    if (feld.art === "auswahl" && feld.optionen && !feld.optionen.includes(wert)) {
      fehlt.push(feld.label);
      continue;
    }
    teile.push(`${feld.label}: ${wert.slice(0, 4000)}`);
  }
  if (fehlt.length) return { ok: false, fehlt };
  return { ok: true, eingabe: teile.join("\n\n") };
}

/** Wie viele Agenten je Kategorie. Fuer die Uebersicht und fuer den Test. */
export function jeKategorie() {
  const z = Object.fromEntries(KATEGORIEN.map((k) => [k.schluessel, 0]));
  for (const x of AGENTEN) z[x.kategorie] = (z[x.kategorie] || 0) + 1;
  return z;
}


/* ================= Step 8: was jeder Eintrag zusaetzlich traegt ================= */

/**
 * Faehigkeiten je Agent. Eine Tabelle und keine Ableitung aus dem Namen:
 * "Nachfassen" und "Absage" heissen verschieden und koennen dasselbe, "Protokoll"
 * und "Aufgabenliste" heissen aehnlich und koennen Verschiedenes.
 */
const KANN = {
  /* Vertrieb */
  "angebot-entwurf": [F.ENTWERFEN, F.STRUKTURIEREN],
  "angebot-nachfassen": [F.ENTWERFEN],
  "leistungsbeschreibung": [F.STRUKTURIEREN, F.ENTWERFEN],
  "preisgespraech": [F.EINSCHAETZEN, F.ENTWERFEN],
  "einwand-behandeln": [F.EINSCHAETZEN, F.ENTWERFEN],
  "anfrage-einschaetzen": [F.EINSCHAETZEN, F.STRUKTURIEREN],
  "lastenheft-fragen": [F.STRUKTURIEREN, F.EINSCHAETZEN],
  "absage-freundlich": [F.ENTWERFEN],
  /* Kundenkommunikation */
  "mail-antwort": [F.ENTWERFEN],
  "reklamation": [F.ENTWERFEN, F.EINSCHAETZEN],
  "bewertung-antwort": [F.ENTWERFEN],
  "terminbestaetigung": [F.ENTWERFEN, F.STRUKTURIEREN],
  "terminabsage": [F.ENTWERFEN],
  "statusmeldung": [F.STRUKTURIEREN, F.ENTWERFEN],
  "uebergabe-anleitung": [F.STRUKTURIEREN, F.ENTWERFEN],
  "erinnerung-unterlagen": [F.STRUKTURIEREN, F.ENTWERFEN],
  /* Backoffice */
  "rechnungstext": [F.STRUKTURIEREN, F.PRUEFEN],
  "zahlungserinnerung": [F.ENTWERFEN],
  "protokoll": [F.STRUKTURIEREN, F.ZUSAMMENFASSEN],
  "aufgabenliste": [F.STRUKTURIEREN],
  "wochenrueckblick": [F.ZUSAMMENFASSEN, F.EINSCHAETZEN],
  "checkliste": [F.STRUKTURIEREN, F.PLANEN],
  "ablage-vorschlag": [F.EINSCHAETZEN, F.STRUKTURIEREN],
  /* Marketing */
  "social-post": [F.ENTWERFEN],
  "social-serie": [F.PLANEN, F.STRUKTURIEREN],
  "blogartikel": [F.ENTWERFEN, F.STRUKTURIEREN],
  "newsletter": [F.ENTWERFEN, F.STRUKTURIEREN],
  "produkttext": [F.ENTWERFEN],
  "seo-meta": [F.ENTWERFEN, F.PRUEFEN],
  "seo-keywords": [F.STRUKTURIEREN, F.EINSCHAETZEN],
  "anzeigentext": [F.ENTWERFEN],
  "pressemitteilung": [F.ENTWERFEN, F.STRUKTURIEREN],
  /* Web */
  "seitenstruktur": [F.PLANEN, F.STRUKTURIEREN],
  "texte-startseite": [F.ENTWERFEN],
  "formular-felder": [F.STRUKTURIEREN, F.EINSCHAETZEN],
  "fehlermeldung": [F.ENTWERFEN],
  "barrierefreiheit-tipp": [F.PRUEFEN, F.EINSCHAETZEN],
  "datenschutz-abschnitt": [F.ENTWERFEN, F.PRUEFEN],
  "technik-erklaeren": [F.ZUSAMMENFASSEN, F.ENTWERFEN],
  /* Automation */
  "prozess-zerlegen": [F.STRUKTURIEREN, F.EINSCHAETZEN],
  "automatisierbar-pruefen": [F.EINSCHAETZEN],
  "werkzeug-vorschlag": [F.EINSCHAETZEN, F.STRUKTURIEREN],
  "risiko-check": [F.EINSCHAETZEN, F.STRUKTURIEREN],
  "einfuehrungsplan": [F.PLANEN, F.STRUKTURIEREN],
  /* Schulung */
  "schulungsplan": [F.PLANEN, F.STRUKTURIEREN],
  "uebung": [F.ENTWERFEN, F.STRUKTURIEREN],
  "handout": [F.STRUKTURIEREN, F.ZUSAMMENFASSEN],
  "faq-erstellen": [F.STRUKTURIEREN, F.ZUSAMMENFASSEN],
  /* Die eingebauten */
  "chat": [F.ENTWERFEN, F.EINSCHAETZEN],
  "orchestrator": [F.EINSCHAETZEN, F.PLANEN],
  "recherche": [F.ZUSAMMENFASSEN, F.STRUKTURIEREN],
  "werkzeug": [F.ENTWERFEN, F.ZUSAMMENFASSEN],
  "vision": [F.EINSCHAETZEN, F.ZUSAMMENFASSEN],
  "uebersetzen": [F.UEBERSETZEN],
  "skill-agent": [F.EINSCHAETZEN, F.STRUKTURIEREN],
  "faq-luecken": [F.EINSCHAETZEN, F.STRUKTURIEREN],
  "markenschutz": [F.PRUEFEN, F.EINSCHAETZEN],
  "analytics": [F.EINSCHAETZEN, F.ZUSAMMENFASSEN],
};

export function faehigkeiten(id) {
  return KANN[id] ? KANN[id].slice() : [];
}

/**
 * Eine Pruefsumme der Anweisung. Damit laesst sich feststellen, ob ein
 * Systemtext geaendert wurde, ohne dass die Fassung mitgezogen ist --- sonst
 * heisst zweimal "1.0.0" zwei verschiedene Dinge.
 */
export function pruefsumme(text) {
  return crypto.createHash("sha256").update(String(text ?? "")).digest("hex").slice(0, 12);
}

/** Welches Recht eine Freigabestufe verlangt. */
export function rechtFuerStufe(stufe) {
  if (stufe >= STUFE.AUSSEN) return "VEROEFFENTLICHEN";
  if (stufe >= STUFE.INTERN) return "SCHREIBEN";
  if (stufe >= STUFE.VORSCHLAGEN) return "AUSFUEHREN";
  return "LESEN";
}

/** Das Eingabeschema, abgeleitet aus den Feldern. Nichts erfunden. */
export function eingabeschema(agent) {
  const felder = agent?.felder || [];
  return {
    art: "objekt",
    pflicht: felder.filter((f) => f.pflicht).map((f) => f.name),
    felder: felder.map((f) => ({
      name: f.name, art: f.art, pflicht: f.pflicht,
      ...(f.optionen ? { optionen: f.optionen.slice() } : {}),
    })),
  };
}

/** Das Ausgabeschema. Heute fuer alle dasselbe, und das steht auch so da. */
export function ausgabeschema() {
  return { art: AUSGABE.TEXT, feld: "ergebnis", hinweis: "Ein Entwurf. Kein Werkzeugaufruf." };
}

/**
 * Der Zustand eines Agenten --- GEMESSEN, nicht gepflegt.
 *
 * Genau die Forderung aus dem Auftrag: nicht behaupten, dass ein Agent laeuft,
 * wenn die Voraussetzung fehlt. `gesetzt` sagt, welche Umgebungsvariable belegt
 * ist; ohne die Funktion wird nichts angenommen.
 *
 * @param {object} agent
 * @param {(name: string) => boolean} gesetzt
 * @param {{daten?: boolean}} [lage]
 */
export function zustand(agent, gesetzt, lage = {}) {
  const pruefe = typeof gesetzt === "function" ? gesetzt : () => false;
  const braucht = agent?.braucht || ["ANTHROPIC_API_KEY"];
  const fehlt = braucht.filter((b) => b !== "daten" && !pruefe(b));
  if (fehlt.length) {
    return { status: "braucht_integration", fehlt, grund: "Es fehlt: " + fehlt.join(", ") };
  }
  if (braucht.includes("daten") && lage.daten === false) {
    return { status: "wartet_auf_daten", fehlt: [], grund: "Läuft, hat aber noch nichts auszuwerten." };
  }
  return { status: "verfuegbar", fehlt: [], grund: "" };
}

/** Die Zustaende, die es gibt. Was nicht hier steht, wird nicht gemeldet. */
export const ZUSTAENDE = ["verfuegbar", "wartet_auf_daten", "braucht_integration"];

/**
 * Ein vollstaendiger Eintrag nach aussen. Ohne den Systemtext --- er ist die
 * Arbeit, die hier drinsteckt. Die Pruefsumme geht mit, damit sich eine
 * Aenderung feststellen laesst, ohne den Text zu kennen.
 */
export function eintrag(agent, gesetzt, lage) {
  const z = zustand(agent, gesetzt, lage);
  return {
    id: agent.id,
    name: agent.name,
    kategorie: agent.kategorie,
    zweck: agent.zweck,
    quelle: agent.quelle || (agent.system ? "registratur" : "eingebaut"),
    endpunkt: agent.endpunkt || "/api/agenten/" + agent.id,
    fassung: agent.fassung || REGISTER_FASSUNG,
    anweisung_pruefsumme: agent.system ? pruefsumme(agent.system) : null,
    faehigkeiten: faehigkeiten(agent.id),
    werkzeuge: [],
    recht: rechtFuerStufe(agent.stufe ?? STUFE.VORSCHLAGEN),
    stufe: agent.stufe ?? STUFE.VORSCHLAGEN,
    status: z.status,
    fehlt: z.fehlt,
    grund: z.grund,
    eingabeschema: eingabeschema(agent),
    ausgabeschema: ausgabeschema(),
  };
}
