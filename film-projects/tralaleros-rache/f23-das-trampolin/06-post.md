# Postproduktion – Tralaleros Rache, Folge 23: Das Trampolin

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 3 s | 0:12 |
| 5 | S05.mp4 | 5 s | 0:15 |
| 6 | S06.mp4 | 4 s | 0:20 |
| 7 | S07.mp4 | 4 s | 0:24 |
| 8 | S08.mp4 | 5 s | 0:28 |
| 9 | S09.mp4 | 3 s | 0:33 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass der Planen-Wurf **im ersten Frame** läuft (Hook). S04 so trimmen, dass das BOING (tiefster Punkt des Tuchs) bei ca. 1 s liegt. S05: Spagat am Scheitel muss drin sein. S07: Tung Tungs weiche Landung auf den Füßen muss sichtbar sein. S08: Probesprung + Abschuss beide im Clip.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie bisher: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–22) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Planen-Whoosh, Laub, Zwinker-Ding, Holz-Hüpfer, BOING, Salto-Whooshs, Schnauben, Schubs-Puff, Fallpfeife, PLATSCH, maniakales Lachen). Boings in S05/S10 auf die Musik-Beats legen.
8. Effekte sparsam: Zoom-Punch auf das BOING in S04; kurze Speed-Ramp (Kurve „Montage“) am Spagat in S05 und am Scheitel in S08; Shake auf den PLATSCH in S09; Sternchen-Sticker über Tralaleros Kopf in S09, falls Kling sie nicht liefert.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- Speed-Ramps in S05 und S08 per Zeitverzerrung (Optical Flow). Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Frühlings-Look der Staffel 5 auf Basis von Folge 1):
  - Frisches **Hellgrün** im Laub leicht Richtung Gelb, aber nicht neon; Moos und Weg erdig halten.
  - **Blütenrosa** zart, nie magenta; Wildblumen Weiß/Gelb sauber.
  - **Sneaker-Blau** und **Trampolin-Blau** (Randpolster) per Qualifier über alle Shots angleichen; Sprungtuch tiefschwarz, aber mit Zeichnung.
  - Goldenes Nachmittagslicht wie Folge 1; S05 Gegenlicht auf den Blütenblättern betonen.
  - S09 und S11: Matsch braun, nicht grau; Tralaleros Haut nicht absaufen lassen.
  - Referenz 25 (Trampolin) und Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Speed-Ramps in S05/S08 über „Retiming → Geschwindigkeitsrampe“.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 5 · Folge 23: Das Trampolin“, gleiche Comic-Schrift wie bisher.
- **Pfeil-Gags:** S02 gestrichelte Wunsch-Flugbahn vom Trampolin in die Pfütze („PLAN“); S04 dieselbe Linie wird durchgestrichen, neuer Pfeil senkrecht nach oben („REALITÄT“); S08 die Wunsch-Linie passt plötzlich – auf Tralalero.
- **VFX:** S05 Bewegungslinien und zusätzliche Blütenblatt-Partikel; S09 Cartoon-Sternchen.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut; Speed-Ramps über den Clip-Speed-Editor.

## 7. Frame.io – Review-Runde

- [ ] Hook: Plane fliegt mit Ton in der **ersten Sekunde**, Trampolin sofort lesbar?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Tung Tungs Schläger **in jedem Shot auf dem Rücken** – nie in der Hand, nie zwei Schläger?
- [ ] Tung Tung trägt **keine** Blüten (nur Blütenblätter in der Luft um ihn)?
- [ ] Trampolin konsistent mit Referenz 25 (rund, schwarzes Tuch, blaue Polster, **ohne Logo/Schrift**, schräg zur Pfütze)?
- [ ] Getarnt in S02/S04 – aber noch erkennbar genug für den Gag?
- [ ] Schubs in S07 sichtbar **sanft**, Tung Tung landet sicher auf den Füßen?
- [ ] Kein Blut, keine Verletzungen; Tralalero nach dem PLATSCH sichtbar unverletzt?
- [ ] Frühlingslook (Hellgrün, Wildblumen, Blütenblätter) in allen Shots gleich, passend zu Folge 21/22?
- [ ] Erzähler gleiche Stimme wie Folge 1–22, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Matsch und Blüten als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei BOING, PLATSCH und Lachen.
