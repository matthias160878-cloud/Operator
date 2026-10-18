# Postproduktion – Tralaleros Rache, Folge 1: Die Bananenfalle

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`, nach dem Ablegen der Clips Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 3 s | 0:04 |
| 3 | S03.mp4 | 5 s | 0:07 |
| 4 | S04.mp4 | 4 s | 0:12 |
| 5 | S05.mp4 | 5 s | 0:16 |
| 6 | S06.mp4 | 5 s | 0:21 |
| 7 | S07.mp4 | 3 s | 0:26 |
| 8 | S08.mp4 | 5 s | 0:29 |
| 9 | S09.mp4 | 3 s | 0:34 |
| 10 | S10.mp4 | 4 s | 0:37 |
| 11 | S11.mp4 | 4 s | 0:41 |

Kling liefert meist 5- oder 10-s-Clips: auf die angegebene Dauer kürzen – den **besten Teil** nehmen, nicht zwingend den Anfang. Nur harte Schnitte, keine Überblendungen (Brainrot-Tempo).

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** auswählen und importieren.
2. Format: „Seitenverhältnis 9:16“, Projekt-Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen (Clip antippen → Ränder ziehen; Dauer wird oben angezeigt).
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` wählen (Datei vorher per AirDrop/Drive/Dateien-App aufs Handy). Falls deine CapCut-Version keinen SRT-Import anbietet: „Automatische Untertitel“ auf die Erzählerspur anwenden und mit der SRT abgleichen.
5. Untertitel-Stil: fette weiße Schrift mit schwarzer Kontur, mittig im unteren Drittel – **über** der TikTok-UI-Zone (nicht in den untersten ~20 % des Bildes).
6. Audio: Erzähler-MP3 (aus `04-voiceover.txt` per TTS) und Musik importieren; Erzähler-Einsätze an die Untertitel-Starts legen. Clip-Ton auf ~30 % senken, Musik auf ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Platsch, Slide-Whistle, Lachen, Holz-Tock).
8. Effekte sparsam: Kamerawackeln bei S09 (Aufprall), kurzer Zoom-Punch bei S02 und S10.
9. Loop-Check: Ende von S11 und Anfang von S01 hintereinander abspielen – Pose/Bildausschnitt müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Neue Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips: alle markieren → **Medien verknüpfen** → Ordner `clips/` → `S01.mp4` wählen, Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (wird zur Untertitelspur); Stil im Bedienfeld „Eigenschaften“.
- Audio: Essential Sound → Dialog für den Erzähler, Musik mit „Ducking“.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL); Medien aus `clips/` beim Import mitgeben bzw. per „Relink“ verknüpfen.
- SRT über Media Pool importieren und auf die Timeline ziehen.
- Color-Grading passend zum Look:
  - Grün-/Gelbsättigung leicht anheben (Wald saftig, Banane leuchtend), Blau der Sneaker per Qualifier schützen/leicht pushen.
  - Warme Highlights (goldene Sonne), Schatten leicht grün-neutral, keine düsteren Tiefen.
  - Wichtig: Shots auf Konsistenz angleichen (Kling-Clips schwanken in Helligkeit/Farbtemperatur) – S01 als Referenz-Still, „Shot Match“ für die übrigen.
  - Leichtes Schärfen, kein Grain (sauberer CGI-Look).

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; bei fehlenden Medien „Dateien neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titelkarte** (in S01 oder als 0,5-s-Overlay, nicht als separater Shot, damit der Hook bleibt): „TRALALEROS RACHE – Folge 1: Die Bananenfalle“, fette Comic-Schrift, Pop-in mit Overshoot.
- **Lower Third / Pfeil-Gag:** S03 – Pfeil auf die Schale mit Text „WAFFE“; S04 – Pfeil auf die herausragende Flosse „UNSICHTBAR“.
- **VFX-Verstärkung:** S09 Comic-Text „PLATSCH!“ und zusätzliche Wasser-Partikel; S10 Speedlines/Shake.
- Als `.mov` mit Alpha rendern oder per Dynamic Link in Premiere einsetzen.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder die Clips manuell in der Reihenfolge der Tabelle oben einfügen und trimmen.
- Titel-Spur für Untertitel bzw. SRT-Import (falls verfügbar), Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

Export hochladen und Reviewer diese Punkte prüfen lassen:

- [ ] Hook: Ist in der **ersten Sekunde** klar, dass Tralalero einen Racheplan schmiedet?
- [ ] Figuren konsistent über alle 11 Shots (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht und Schläger)?
- [ ] Keine Markennamen/Logos im Bild, kein Blut, keine Verletzungen.
- [ ] Bananenschale in S03, S05, S06, S08 an derselben Stelle?
- [ ] Gag-Timing: Ballett-Schritt (S06) und Ausrutscher (S08) lang genug, Lachen (S10) nicht abgeschnitten?
- [ ] Erzähler verständlich, Untertitel synchron und nicht von der Plattform-UI verdeckt?
- [ ] Loop: Übergang S11 → S01 ohne sichtbaren Sprung?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung beim Platscher.
