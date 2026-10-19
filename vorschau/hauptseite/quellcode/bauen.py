"""Baut vorschau/hauptseite/index.html aus .original-index.html (Hauptseite, Artifact-Version 72).

Aufruf:  python3 -I vorschau/hauptseite/quellcode/bauen.py
Jede Ersetzung muss genau einmal greifen, sonst bricht das Skript ab.
"""
import pathlib
import re

ordner = pathlib.Path(__file__).resolve().parent.parent
s = (ordner / ".original-index.html").read_text(encoding="utf-8")
seiten = (ordner / "quellcode" / "neu-seiten.js").read_text(encoding="utf-8")
stil = (ordner / "quellcode" / "neu-stil.css").read_text(encoding="utf-8")


def ersetze(alt, neu, text=None):
    global s
    if s.count(alt) != 1:
        raise SystemExit(f"Nicht eindeutig ({s.count(alt)}x): {alt[:80]!r}")
    s = s.replace(alt, neu)


# 1. Stil ergänzen (vor dem Ende des Haupt-Stylesheets)
ersetze("@media print{header.top,footer,.demo-bar", stil + "\n@media print{header.top,footer,.demo-bar")

# 2. Hinweisleiste: Vorschau kennzeichnen
ersetze('<div class="demo-bar">Demo-Ansicht ·', '<div class="demo-bar">Vorschau, nicht veröffentlicht · Demo-Ansicht ·')

# 3. Logo auf die gemeinsame Startseite, mobiler Menü-Knopf
ersetze('<a class="logo" href="start.html">', '<a class="logo" href="#/start">')
ersetze('<nav class="main" id="nav"></nav>',
        '<button class="menu-knopf" id="menu-knopf" type="button" aria-expanded="false" aria-controls="nav">Menü</button>\n  <nav class="main" id="nav" aria-label="Hauptnavigation"></nav>')

# 4. Navigation: Bereiche, Social Media hervorgehoben, Login/Demo gebündelt
alt_nav = re.search(r"const NAV=\[\n \['@start\.html','Startseite'\],\n", s)
if not alt_nav:
    raise SystemExit("NAV-Anfang nicht gefunden")
ersetze("const NAV=[\n ['@start.html','Startseite'],\n",
        "const NAV=[\n ['start','Startseite'],['privat','Privatkunden'],['unternehmen','Unternehmen'],['social','Social Media','nav-sm'],['pakete','Pakete'],\n")
ersetze(" ['social-media-ki','Social Media KI'],['referenzen','Referenzen'],['portfolio','Portfolio'],['preise','Preise'],['rechner','Angebotsrechner'],['faq','FAQ'],['demo','Demo'],['finanzen','Finanzen'],['login','Login']\n];",
        " ['referenzen','Referenzen'],['portfolio','Portfolio'],['preise','Preise'],['faq','FAQ'],['einstieg','Login / Demo']\n];")
ersetze("NAV.map(n=>Array.isArray(n)?`<a href=\"${n[0][0]==='@'?n[0].slice(1):'#/'+n[0]}\">${n[1]}</a>`",
        "NAV.map(n=>Array.isArray(n)?`<a href=\"${n[0][0]==='@'?n[0].slice(1):'#/'+n[0]}\"${n[2]?` class=\"${n[2]}\"`:''}>${n[1]}</a>`")

# 5. Alte Startseite (Gehirn, Bühne, Live-Zustände) durch die neuen Seiten ersetzen
a = s.index("SEITEN.start={titel:'Start',render:()=>`")
b = s.index("SEITEN['social-media-ki']=")
s = s[:a] + seiten + "\n" + s[b:]

# 6. Startseite startet keine Gehirn-Bühne mehr; Menü schließt beim Seitenwechsel; Gruppensprung
ersetze("  if(slug==='start'){const o=Orbit(document.getElementById('orbit-hero'),{onSelect:a=>{if(a)location.hash='/ki-agenten'},live:true});orbits.push(o)}\n",
        "  menuZu();\n  if(slug==='pakete'&&q.gruppe){const z=document.getElementById('gruppe-'+q.gruppe);if(z)setTimeout(()=>z.scrollIntoView(),0)}\n")
ersetze("function render(){\n  orbits.forEach",
        "function menuZu(){const h=document.querySelector('header.top'),k=document.getElementById('menu-knopf');if(h)h.classList.remove('offen');if(k)k.setAttribute('aria-expanded','false')}\n"
        "document.getElementById('menu-knopf').addEventListener('click',()=>{const h=document.querySelector('header.top');const auf=h.classList.toggle('offen');document.getElementById('menu-knopf').setAttribute('aria-expanded',String(auf))});\n"
        "addEventListener('keydown',e=>{if(e.key==='Escape')menuZu()});\n"
        "function render(){\n  orbits.forEach")

# 7. Kontaktformular: Bereich für Privatkunden
ersetze("['webseiten-aufbau','Webseiten-Aufbau'],['sonstiges','Sonstiges']].map(o=>`<option value=\"${o[0]}\"${q.bereich===o[0]?' selected':''}>",
        "['webseiten-aufbau','Webseiten-Aufbau'],['privat','Privates Projekt'],['sonstiges','Sonstiges']].map(o=>`<option value=\"${o[0]}\"${q.bereich===o[0]?' selected':''}>")

# 8. Hintergrund für die neuen Seiten
ersetze("  start:               ['konstellation', 34],\n",
        "  start:               ['konstellation', 34],\n  privat:              ['punktregen',    20],\n  unternehmen:         ['leiterbahnen',  20],\n  social:              ['punktregen',    20],\n  pakete:              ['gitter',        18],\n")

# Keine „Beliebt“-Kennzeichnung ohne belegte Grundlage
ersetze("${i===1?'Beliebt · ':''}", "")

# 9. Fußzeile: Login/Demo und Quellen
ersetze('<a href="#/ueber-uns">Über uns</a>', '<a href="#/privat">Für Privatkunden</a><a href="#/unternehmen">Für Unternehmen</a><a href="#/pakete">Pakete</a><a href="#/quellen">Quellen (Vorschau)</a><a href="#/ueber-uns">Über uns</a>')

(ordner / "index.html").write_text(s, encoding="utf-8")
print("Vorschau gebaut:", ordner / "index.html")
