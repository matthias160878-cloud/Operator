# Postproduktion – Tralaleros Rache, Folge 22: Der Drachen

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
| 7 | S07.mp4 | 3 s | 0:25 |
| 8 | S08.mp4 | 5 s | 0:28 |
| 9 | S09.mp4 | 4 s | 0:33 |
| 10 | S10.mp4 | 4 s | 0:37 |
| 11 | S11.mp4 | 4 s | 0:41 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass der Windstoß **im ersten Frame** zupackt (Hook). S03: Winddreher und herabpeitschende Schnur müssen drin sein. S04: Die Schnur muss sichtbar in der Hand landen. S07 so trimmen, dass das PLING bei ca. 2 s liegt. S09: Karabiner-Klick und PLATSCH beide drin.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie bisher: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %). In den Himmels-Shots (S02, S08) Kontur ggf. dicker.
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–21) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Windstoß, Whooshes, Schnur-Twang, Glitzer-Ping, PLING, Karabiner-Klick, Fallpfeife, PLATSCH, maniakales Lachen, Kratzen).
8. Effekte sparsam: Speed-Ramp beim Tiefflug in S06 (Clip-Speed-Kurve); Zoom-Punch auf das PLING in S07 und den PLATSCH in S09; Speedlines im Sturzflug S03, falls Kling zu ruhig ist.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- S06: Zeitverzerrung/Speed-Ramp am Tiefflug (Optical Flow); S08: leichte Zeitlupe 80 %, falls Kling zu schnell gleitet. Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Frühlings-Look der Staffel 5 auf Basis von Folge 1):
  - Laub **frisch hellgrün**, nicht ins Gelbe kippen; goldenes Nachmittagslicht wie Folge 1 beibehalten.
  - **Drachen-Rot und -Gelb** per Qualifier über alle Shots angleichen – Signalfarben vor Himmel und Laub; Rot nicht clippen.
  - **Sneaker-Blau**, **Gurt-Orange** und das Hai-Blaugrau konstant halten.
  - Himmels-Shots (S02, S03, S08): Himmel nicht ausfressen lassen, Highlights runter, damit der Drachen Zeichnung behält.
  - Blütenrosa (S09–S11) zart halten, nicht magenta.
  - Referenz 24 und ein Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Speed-Ramp in S06 über „Retiming → Geschwindigkeitsrampe“.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 5 · Folge 22: Der Drachen“, gleiche Comic-Schrift wie bisher.
- **Pfeil-Gags:** S02 Pfeil auf den winzigen Tung Tung „ZIEL“; S04 Pfeil auf die Schnur „OH.“; S06 gestrichelte Flugbahn (Looping + Acht).
- **VFX:** S03 Speedlines im Sturzflug; S07 kleiner Funken-/„PLING“-Stern am Reißpunkt (ohne Schrift); S09 zusätzliche Blütenblätter-Partikel nach dem PLATSCH.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut; Speed-Ramp in S06 über den Clip-Speed-Editor.

## 7. Frame.io – Review-Runde

- [ ] Hook: Windstoß reißt Tralalero in der **ersten Sekunde** hoch, mit Ton?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Drachen in allen Shots gleich (rot-gelbe Raute, vier Felder, Holzleisten, Schleifenschwanz) – **kein Logo, keine Schrift**?
- [ ] Klettergurt schwarz-orange und Fliegerbrille braun in allen Tralalero-Shots gleich; im Loop Brille auf der Stirn, Schleife auf dem Kopf?
- [ ] Schläger-Logik: Tung Tung trägt den Schläger **die ganze Folge auf dem Rücken**, nie in der Hand, nie zwei Schläger?
- [ ] Tung Tung **ohne Blüten** (die aus Folge 21 sind weg)?
- [ ] Schnur-Logik: lose in S03, in Tung Tungs Hand ab S04, reißt in S07, Ende in S10 hochgehalten?
- [ ] Kein Blut, keine Verletzungen; Tralalero nach dem PLATSCH sichtbar unverletzt, niemand wird geschlagen?
- [ ] Erzähler gleiche Stimme wie Folge 1–21, Untertitel synchron, vor Himmel lesbar, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Gurt, Brille, Schleife als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei PLING, PLATSCH und Lachen.
