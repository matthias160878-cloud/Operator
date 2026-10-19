# Vorschau: überarbeitete Hauptseite (Privatkunden / Unternehmen)

Stand 19.10.2026. **Nur Vorschau, nicht veröffentlicht.** Die Hauptseite „Secret 58 Zentrale“
(<https://claude.ai/artifact/Kha1HUHqEmbZLRgNErWC6Q>) ist unverändert. Übernahme erst nach ausdrücklicher Freigabe.

## Starten

```
python3 -m http.server 4173 --bind 127.0.0.1 --directory vorschau/hauptseite
```

Dann <http://127.0.0.1:4173/index.html> öffnen. Die Seite ist eine statische Datei ohne Server-Logik
(wie das Original), deshalb kein Next.js-Server. Neu bauen nach Änderungen an `quellcode/`:

```
python3 -I vorschau/hauptseite/quellcode/bauen.py
```

## Aufbau

- `vorschau/hauptseite/.original-index.html`: Hauptseite, Artifact-Version 72, unverändert.
- `quellcode/neu-seiten.js`, `quellcode/neu-stil.css`: neue Seiten und Stil.
- `quellcode/bauen.py`: setzt beides in eine Kopie des Originals ein. Jede Ersetzung muss genau einmal greifen.
- `index.html`: erzeugte Vorschau. Bilder, Schriften, Video, Referenzen und `hintergrund.js` sind Kopien aus dem Artifact.

## Änderungen gegenüber dem Original

- `#/start`: gemeinsame Startseite mit zwei gleichwertigen Bereichen. Gehirn-Bühne, Agenten-Arbeitsoberfläche und Live-Zustände sind entfernt. Das Logo führt jetzt auf `#/start` statt auf `start.html`.
- `#/privat` und `#/unternehmen`: eigene Startseiten mit Bereichswechsler. Social Media steht direkt nach dem Einstieg.
- `#/social`: Social-Media-Übersicht, eigener Navigationspunkt (farbig hervorgehoben).
- `#/pakete`: Paketkarten in Gruppe A–D, Sprung über `#/pakete?gruppe=a|b|c|d`.
- `#/einstieg`: „Login / Demo“. Bündelt Demo-Zentrale mit Gehirn (`#/demo`), Agenten-Bühne, Login-Testmodus, Finanzen-Demo, App-Vorschau und Angebotsrechner. Sagt klar: keine echte Anmeldung.
- `#/quellen`: diese Quellenübersicht in der Seite.
- Navigation neu geordnet. Ein mobiler Menü-Knopf schließt bei Escape und beim Seitenwechsel. Kontaktformular: Bereich „Privates Projekt“.
- Alle übrigen Seiten (Preise, Webdesign, Referenzen, Bereichsseiten, Rechtstexte) sind unverändert.

## Quellen

| Angabe | Datei | Fundstelle |
|---|---|---|
| Social-Media-Agent 69 €/Monat (Plan, Varianten je Kanal, Auswertung), Paket mit Content-Agent 149 €/Monat (beide Agenten, ein Stilprofil, ein Redaktionsplan), Einrichtung ab 290 € | Hauptseite `index.html` | `BEREICHE["social-media"].preise` |
| Content-Agent 99 €/Monat, Einrichtung ab 490 €, Redaktion inklusive auf Anfrage | Hauptseite `index.html` | `BEREICHE["content-erstellung"].preise` |
| Newsletter-Redakteur 49 €/Monat (Betreff, Text, Bildvorschlag) | Hauptseite `index.html` | Agentenkatalog `WEITERE` |
| Social-Media-Agent: Facebook-, Instagram-, TikTok-Zugänge fehlen | Hauptseite `index.html` | `ZUGANG_FEHLT` |
| Pro 590 € / Maxi 797 € netto/Monat; Jahr 6.018 € / 8.129,40 € netto | `src/lib/plans.ts`, Hauptseite | Kopfkommentar, `PLANS`; `smkPreisBlock()` |
| Pro/Maxi Monatsmengen (bestätigt 07.10.2026) | `src/lib/plans.ts` | `PLANS.PRO.quotas`, `PLANS.MAXI.quotas` |
| App-Funktionen, Stand der Anbindungen 14.10.2026, Anbieterkosten | Hauptseite `index.html` | `SEITEN["social-media-ki"]` |
| Kauf nicht freigeschaltet | `src/lib/plans.ts`, `src/app/buy/page.tsx` | `PACKAGE_TERMS_CONFIRMED`, `saleOpen` |
| Autopilot S/M/L, Zusatzpakete (vorläufig) | Hauptseite `index.html`, `src/app/buy/page.tsx` | `SEITEN["social-media-ki"]`, `AUTOPILOT` |
| KI-Start, KI-Agent System, Webdesign-Pakete, Beratung, Schulung | Hauptseite `index.html` | `BEREICHE`, `SEITEN.webdesign` |

`2-Zentrale-Verkaufsseite.html` (Version 17 vom 06.10.2026) liegt im Projekt nicht vor und wurde nicht geprüft.
Der Newsletter-Preis ist über den Agentenkatalog der Zentrale belegt.

## Offene Preis- und Leistungsfragen

1. **Steuer:**
   - Agenten und Bereichsseiten: „Endpreise, Kleinunternehmer nach § 19 UStG“.
   - Social Media KI und `plans.ts`: „netto zzgl. Steuer“ (Stripe Tax).
   - In der Vorschau stehen die Preise wie in der jeweiligen Quelle, mit dem Hinweis „uneinheitlich – noch zu klären“. Es wurden keine Endpreise neu berechnet.
2. **Anbieterkosten Pro/Maxi:**
   - Hauptseite: KI-Dienste laufen „über Ihre eigenen Zugänge“ und rechnen direkt ab.
   - `plans.ts`: „KI-Funktionen über Betreiber-Zugänge – kein eigenes KI-Abo nötig“.
   - Das widerspricht sich und ist in der Vorschau sichtbar markiert.
3. **Einheit Voiceover:** Pro/Maxi zählen 10/30 Voiceovers (Anzahl), Autopilot S/M nennt 10/30 Minuten Sprachausgabe.
4. **Einrichtungskosten** nicht dokumentiert für Social + Content, Newsletter-Redakteur und Pro/Maxi. Der Einrichtungsservice 299 € ist nur als vorläufiges Zusatzpaket genannt.
5. **Social-Media-Einzelauftrag und Beitragsserie:** kein Pauschalpreis, keine Mengen. Sie stehen auf „Anfrage“.
6. **Kennzeichnung „empfohlen“:** Die App-Kaufseite markiert Maxi als „empfohlen“, die Bereichsseite hebt das 149-€-Paket hervor. In der Vorschau gibt es bewusst keine solche Kennzeichnung.
7. **Pro/Maxi-Planungsschwerpunkte:** Die Texte („regelmäßige Inhalte …“, „größeres Inhaltskontingent …“) stammen aus dem Auftrag. Im Projekt sind nur die Mengen belegt.
8. **Fußzeile des Originals:** „Preise sind Beispielpreise“ passt nicht zu bestätigten Pro/Maxi-Preisen. In der Vorschau unverändert.

## Bekannte Einschränkungen

- `hintergrund.js` (unverändert aus dem Original) fragt `/api/einstellungen` ab. Ohne Server gibt das einen 404 in der Konsole, ohne sichtbare Auswirkung.
- Breite Tabellen (Preise, Webdesign, Quellen) scrollen auf dem Handy innerhalb ihres Rahmens. Die Seite selbst läuft nicht seitlich über.
