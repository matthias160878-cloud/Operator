"""Zusammengeführte Vorschau: Staging-Kopie (public/hauptseite, Branch claude/modest-fermat-ysdjp6)
plus die neuen Bereiche Privatkunden / Unternehmen / Pakete aus neu-seiten.js.

Ergebnis: vorschau/zusammen/index.html
Aufruf:   python3 -I vorschau/hauptseite/quellcode/bauen-zusammen.py
Jede Ersetzung muss genau einmal greifen, sonst bricht das Skript ab.
"""
import pathlib
import re

quell = pathlib.Path(__file__).resolve().parent
ziel = quell.parent.parent / "zusammen"
s = (ziel / ".staging-index.html").read_text(encoding="utf-8")
original = (quell.parent / ".original-index.html").read_text(encoding="utf-8")
seiten = (quell / "neu-seiten.js").read_text(encoding="utf-8")
stil = (quell / "neu-stil.css").read_text(encoding="utf-8")
# Die Staging-Kopie hat ihren eigenen Menü-Knopf; den aus neu-stil.css nicht doppelt einsetzen.
stil = re.sub(r"/\* MENU-ANFANG \*/.*?/\* MENU-ENDE \*/\n", "", stil, flags=re.S)


def ersetze(alt, neu):
    global s
    if s.count(alt) != 1:
        raise SystemExit(f"Nicht eindeutig ({s.count(alt)}x): {alt[:80]!r}")
    s = s.replace(alt, neu)


def ausschnitt(text, anfang, ende):
    a = text.index(anfang)
    return text[a:text.index(ende, a) + len(ende)]


# Übersicht „Alle Leistungen“ aus der Staging-Startseite für den Unternehmensbereich
leistungen = ausschnitt(s, '<section class="block" id="start-leistungen">', "</section>")
leistungen = leistungen.replace('id="start-leistungen"', 'id="alle-leistungen"')
leistungen = leistungen.replace("'/dateien']", "'#/einstieg']")
seiten = seiten.replace(
    "<section class=\"block\"><div class=\"plate\"><h2>Erzählen Sie uns, was jede Woche Zeit kostet.</h2>",
    leistungen + "\n<section class=\"block\"><div class=\"plate\"><h2>Erzählen Sie uns, was jede Woche Zeit kostet.</h2>", 1)
seiten = seiten.replace(
    "'Die Agenten-Bühne mit Katalog und Gehirn-Dialog – Demo.'",
    "'Die Agenten-Bühne mit Katalog, Gehirn-Dialog und Arbeitsbereich (Kalender, Ordner, Webseiten-Links, ZIP) – Demo, nur im Browser.'")
seiten = seiten.replace(
    "['Finanzen-Demo','Einnahmen und Ausgaben mit Beispieldaten.','#/finanzen','Finanzen ansehen'],",
    "['Finanzen-Demo','Einnahmen und Ausgaben mit Beispieldaten.','#/finanzen','Finanzen ansehen'],"
    "['Dateiaustausch','Echter Dateiaustausch gibt es nur im Kundenkonto der App nach der Anmeldung. Hier in der Vorschau nicht angebunden.','#/ki-agenten','Arbeitsbereich-Demo'],")
if "alle-leistungen" not in seiten or "Arbeitsbereich (Kalender" not in seiten:
    raise SystemExit("Einfügen in neu-seiten.js fehlgeschlagen")

# 1. Stil, Hinweisleiste, Logo
ersetze("@media print{header.top,footer,.demo-bar", stil + "\n@media print{header.top,footer,.demo-bar")
ersetze('<div class="demo-bar">Demo-Ansicht ·', '<div class="demo-bar">Vorschau (zusammengeführt), nicht veröffentlicht · Demo-Ansicht ·')
ersetze('<a class="logo" href="start.html">', '<a class="logo" href="#/start">')

# 2. Navigation
ersetze("const NAV=[\n ['@start.html','Startseite'],\n",
        "const NAV=[\n ['start','Startseite'],['privat','Privatkunden'],['unternehmen','Unternehmen'],['social','Social Media','nav-sm'],['pakete','Pakete'],\n")
ersetze(" ['social-media-ki','Social Media KI'],['referenzen','Referenzen'],['portfolio','Portfolio'],['preise','Preise'],['rechner','Angebotsrechner'],['faq','FAQ'],['demo','Demo'],['finanzen','Finanzen'],['login','Login']",
        " ['referenzen','Referenzen'],['portfolio','Portfolio'],['preise','Preise'],['faq','FAQ'],['einstieg','Login / Demo']")
ersetze("NAV.map(n=>Array.isArray(n)?`<a href=\"${n[0][0]==='@'?n[0].slice(1):'#/'+n[0]}\">${n[1]}</a>`",
        "NAV.map(n=>Array.isArray(n)?`<a href=\"${n[0][0]==='@'?n[0].slice(1):'#/'+n[0]}\"${n[2]?` class=\"${n[2]}\"`:''}>${n[1]}</a>`")

# 3. Startseite durch die neuen Seiten ersetzen
a = s.index("SEITEN.start={titel:'Start',render:()=>`")
b = s.index("SEITEN['social-media-ki']=")
s = s[:a] + seiten + "\n" + s[b:]

# 4. Startseite ohne Gehirn-Bühne, Sprung zu Paketgruppen
ersetze("  if(slug==='start'&&document.getElementById('orbit-hero')){const o=Orbit(document.getElementById('orbit-hero'),{onSelect:a=>{if(a)location.hash='/ki-agenten'},live:true});orbits.push(o)}\n", "")
ersetze("  menuZu();\n",
        "  menuZu();\n  if(slug==='pakete'&&q.gruppe){const z=document.getElementById('gruppe-'+q.gruppe);if(z)setTimeout(()=>z.scrollIntoView(),0)}\n")

# 5. Kontaktformular in der Vorschau nur als Demo (kein Versand an /api/kontakt)
handler_neu = ausschnitt(original, "  if(slug==='kontakt'){", "})}\n")
handler_alt = ausschnitt(s, "  if(slug==='kontakt'){", "})}\n")
ersetze(handler_alt, handler_neu)
ersetze("Die Anfrage geht an unser Team und landet im Posteingang. Wir antworten per E-Mail; eine automatische Bestätigung wird nicht verschickt.",
        "Demo: In dieser Vorschau wird nichts versendet. In der echten Seite geht die Anfrage an das Team von Secret 58.")
ersetze("['webseiten-aufbau','Webseiten-Aufbau'],['sonstiges','Sonstiges']]",
        "['webseiten-aufbau','Webseiten-Aufbau'],['privat','Privates Projekt'],['sonstiges','Sonstiges']]")

# 5b. Arbeitsbereich: Beispieldateien relativ laden, keine Serverabfrage in der Vorschau
s = s.replace("fetch('/hauptseite/beispiele/'", "fetch('beispiele/'")
a = s.index("if(!el)return;try{const r=await fetch('/api/dateien/status'")
b = s.index("· Unten: Demo im Browser.'}", a) + len("· Unten: Demo im Browser.'}")
s = s[:a] + "if(!el)return;el.innerHTML='<b>Vorschau:</b> Echter Dateiaustausch gibt es nur im Kundenkonto der App nach der Anmeldung – hier nicht angebunden. Unten: Demo im Browser.'}" + s[b:]
if re.search(r"fetch\(\s*['\"`]/api/", s):
    raise SystemExit("Noch Server-Aufrufe in der Vorschau: " + ", ".join(re.findall(r"fetch\(\s*['\"`](/api/[^'\"`]+)", s)))

# 6. Hintergrund und Fußzeile
ersetze("  start:               ['konstellation', 34],\n",
        "  start:               ['konstellation', 34],\n  privat:              ['punktregen',    20],\n  unternehmen:         ['leiterbahnen',  20],\n  social:              ['punktregen',    20],\n  pakete:              ['gitter',        18],\n")
ersetze('<a href="#/ueber-uns">Über uns</a>',
        '<a href="#/privat">Für Privatkunden</a><a href="#/unternehmen">Für Unternehmen</a><a href="#/pakete">Pakete</a><a href="#/quellen">Quellen (Vorschau)</a><a href="#/ueber-uns">Über uns</a>')

if "orbit-hero" in s:
    raise SystemExit("Gehirn-Bühne noch auf der Startseite")
(ziel / "index.html").write_text(s, encoding="utf-8")
print("Zusammengeführte Vorschau gebaut:", ziel / "index.html")
