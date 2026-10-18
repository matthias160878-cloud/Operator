# Postproduktion – Tralaleros Rache, Folge 14: Der Zaubertrick

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 4 s | 0:12 |
| 5 | S05.mp4 | 4 s | 0:16 |
| 6 | S06.mp4 | 5 s | 0:20 |
| 7 | S07.mp4 | 4 s | 0:25 |
| 8 | S08.mp4 | 4 s | 0:29 |
| 9 | S09.mp4 | 3 s | 0:33 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass der Rauch-Puff **im ersten Frame** sitzt (Hook). S03 so trimmen, dass der Türknall am Clipende liegt. S05 muss Antippen **und** offene Rückklappe zeigen. S09 so trimmen, dass der PLATSCH bei ca. 0,5 s liegt.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie bisher: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–13) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Rauch-Puff, Glitzer, Türknall, Riegel-Klack, Trommelwirbel, Plattenkratzer, Grille, Slide-Whistle, Platsch, Boing, Konfetti-Puff, maniakales Lachen).
8. Effekte sparsam: Zoom-Punch auf die Verbeugung in S01, Zoom-Punch auf den Jubel in S04, **Freeze-Frame (0,3 s) auf Tralaleros Schockgesicht** in S05, Speed-Ramp in S08, Shake auf den PLATSCH in S09.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Serien-Look wie Folge 1):
  - Sattes Waldgrün, warme goldene Highlights, keine düsteren Tiefen.
  - **Zauberkiste** in allen Shots gleiches Rot und Gold – per Qualifier matchen, Referenz 16 als Still laden.
  - **Umhang:** Schwarz nicht absaufen lassen, Goldsterne sollen lesbar bleiben (Lift in den Tiefen leicht anheben).
  - S01 Zauberrauch neutral weiß/flieder, nicht grau; S10 Konfetti bunt, leicht gesättigt.
  - S09/S11 Matsch sattbraun, nicht grau; nasser Zylinder mit Glanzlichtern.
  - Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 3 · Folge 14: Der Zaubertrick“, gleiche Comic-Schrift wie bisher, „STAFFEL 3“-Badge wie in Folge 11.
- **Pfeil-Gags:** S03 Pfeil auf den Schläger „KOMMT MIT“; S05 Pfeil auf die offene Rückklappe „HINTERTÜR“; S08 Pfeil auf die Pfütze „ZIEL“.
- **VFX:** S01 zusätzlicher Zauberrauch/Glitzer, falls Kling zu wenig liefert; S04 Glitzerspur am Zauberstab; S08 Matsch-Partikel an den Kisten-Kanten; S10 Konfetti-Partikel.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Rauch-Puff, Zauberer-Tralalero und Kiste in der **ersten Sekunde** lesbar?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Kostüm-Logik: Stab in der **rechten** Flosse bis S06, in S07 am Boden, in S10 bei Tung Tung; Zylinder auf dem Kopf bis S07, schwimmend in S09, schief in S11?
- [ ] Schläger-Logik: Tung Tung hält den Schläger **in jedem Shot**, benutzt ihn nie, nimmt ihn mit in die Kiste; Zauberstab nur mit der freien Hand?
- [ ] Rückklappe nur in S05/S06 sichtbar, nicht schon im Hook verraten?
- [ ] Gefälle des Weges in S01/S04/S07/S08 erkennbar, Schlittenfahrt logisch?
- [ ] Kein Blut, keine Verletzungen, niemand wird geschlagen; Rauch nur Zauberrauch, kein Feuer; Tralalero in S09 sichtbar unverletzt?
- [ ] Keine Schrift auf der Kiste, keine Marken im Bild?
- [ ] Erzähler gleiche Stimme wie Folge 1–13, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (schiefer Zylinder als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei Türknall und PLATSCH.
