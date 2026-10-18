# Postproduktion – Tralaleros Rache, Folge 15: Der Roboter (Staffelfinale 3)

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 4 s | 0:12 |
| 5 | S05.mp4 | 5 s | 0:16 |
| 6 | S06.mp4 | 4 s | 0:21 |
| 7 | S07.mp4 | 3 s | 0:25 |
| 8 | S08.mp4 | 4 s | 0:28 |
| 9 | S09.mp4 | 4 s | 0:32 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass der erste BUMM-Schritt und die auffliegenden Vögel **im ersten Frame** sind (Hook). S06 so trimmen, dass das KLONG etwa bei 1,5 s liegt (Erzähler danach). S09 so trimmen, dass der PLATSCH im letzten Drittel liegt. **Roboter-Kontinuität:** Wenn ein Teil im vorherigen Clip schon abgefallen ist, darf es im nächsten nicht wieder dran sein – notfalls Endbild des Vor-Clips als Startbild-Referenz neu generieren (siehe Zustands-Tabelle in `01-treatment.md`).

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Staffel 1–3: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–14) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (schwere Schritte, Vogelflattern, Hebel-Klonk, Boing, Metall-Klong, Bumerang-Surren, Twang, Balloon-Pops, Fallpfeife, Platsch, Klatschen, maniakales Lachen).
8. Effekte sparsam: Shake auf jeden Schritt in S01 (Keyframes oder Effekt „Kamerawackeln“), Zoom-Punch auf den falschen Hebel in S04, Shake auf das KLONG in S06, **je ein Zoom-Punch auf jeden Pop** in S08 (falls Kling die Snap-Zooms nicht liefert), Shake auf den PLATSCH in S09.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende – auch nicht zum Staffelfinale.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- Essential Sound: Dialog für den Erzähler, Musik mit Ducking. Schritt-Shake in S01 per „Transformieren“-Keyframes oder Camera-Shake-Preset.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Serien-Look wie Folge 1):
  - Sattes Waldgrün, warme goldene Highlights, keine düsteren Tiefen – auch S01 (Roboter gegen das Blätterdach) bleibt freundlich-hell: Tiefen anheben, damit der Roboter nicht als dunkle Silhouette absäuft.
  - **Magnet-Rot** per Qualifier über alle Shots angleichen (Referenz 14 als Still) – Rot darf nur am Magneten und an den roten Ballons knallen.
  - **Rost-Orange** des Helms und **Fass-Holz** (dunkel/nass) gegenüber Tung Tungs hellem Holz getrennt halten, damit Roboter und Tung Tung im Tanz (S05) klar unterscheidbar sind.
  - Ballonfarben in S01–S08 identisch halten (Referenz 13 als Still).
  - S09 Matsch sattbraun, nicht grau.
  - Folge-1-Still und Referenz 17 als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffelfinale 3 · Folge 15: Der Roboter“, gleiche Comic-Schrift wie bisher.
- **Bauteil-Labels (Lower-Third-Pfeile, je ~1 s) in S01 oder S02:** kleine Pfeile mit Herkunft der Teile – „F5“ am Katapult-Arm, „F12“ am Magneten und am Helm, „F9“ am Bumerang, „F11“ an den Ballons, „F4“ am Fass. Easter Egg für Stammzuschauer, nur kurz einblenden.
- **Pfeil-Gags:** S04 Pfeil auf den gezogenen Hebel „FALSCH“; S07 gestrichelte Kreisbahn des Bumerangs.
- **VFX:** S06 kleine Funken-freie Cartoon-Staubwolke beim KLONG (kein Feuer, keine Funken); S08 bunte Gummi-Fetzen-Partikel bei jedem Pop; S09 zusätzliche Matsch-Partikel beim PLATSCH.
- **Endkarte (optional, über die letzte Sekunde von S11, ohne den Loop zu stören):** kleine Einblendung „Staffel 4 – bald“ in der oberen Bildhälfte.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Roboter-Schritt mit BUMM und auffliegenden Vögeln in der **ersten Sekunde**?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Roboter konsistent mit Referenz 17 (Fass-Bauch mit schiefen gemalten Augen, Rost-Helm, Katapult-Arm, roter Magnet rechts, Bumerang links, Ballons)?
- [ ] Zerfalls-Kontinuität: Helm+Magnet ab S07 weg, Bumerang ab S08 weg, Katapult-Arm und Ballons ab S09 weg – nichts taucht wieder auf?
- [ ] Roboter rein mechanisch: keine Lichter, Kabel, Funken, Feuer, Elektronik?
- [ ] Schläger-Logik: S03–S05 in der Hand (beim Tanz nur Requisite), S10 unter dem Arm – nie benutzt, nie zwei Schläger?
- [ ] Spiegel-Gag S05: Roboter und Tung Tung wirklich synchron?
- [ ] Bumerang streift niemanden, landet in S10 sanft als Hut; in S11 noch auf dem Kopf?
- [ ] Kein Blut, keine Verletzungen; Tralalero sitzt in S09/S10 sichtbar unverletzt in der Pfütze?
- [ ] Erzähler gleiche Stimme wie Folge 1–14, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Bumerang-Hut als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei Stampfen, KLONG, Pops und PLATSCH.
