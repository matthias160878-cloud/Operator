# Postproduktion – Tralaleros Rache, Folge 17: Der Schlitten

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 4 s | 0:12 |
| 5 | S05.mp4 | 5 s | 0:16 |
| 6 | S06.mp4 | 3 s | 0:21 |
| 7 | S07.mp4 | 4 s | 0:24 |
| 8 | S08.mp4 | 4 s | 0:28 |
| 9 | S09.mp4 | 4 s | 0:32 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass die Zeigegeste **im ersten Frame** steht (Hook). S04 so trimmen, dass der Hüpfer in der Clipmitte liegt. S09 so trimmen, dass das PUFF am Clipanfang liegt und die Sneaker mindestens 2 s zappeln.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Staffel 1–4: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %). Auf hellem Schnee ggf. leichten Schatten hinter die Schrift legen.
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–16) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Wind, Paukenschlag, Bauchklatscher, Kufen-Schaben, Boing, Schlucken, Fallpfeife, Ding, Schnee-Puff, maniakales Lachen).
8. Effekte sparsam: Zoom-Punch auf die Zeigegeste in S01, Speedlines in S02/S05, **Speed-Ramp** (100 % → 30 % → 100 %) auf den Hüpfer in S04, Zeitlupe in S07 falls Kling sie nicht selbst liefert, Shake auf das PUFF in S09. Optional Overlay „Schneefall“ ganz leicht über alle Clips, falls Kling den Schneefall ungleichmäßig liefert.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- S04/S07: Zeitverzerrung (Time Remapping) für Speed-Ramp bzw. Zeitlupe, Optical Flow aktivieren. Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Serien-Look im Winterkleid):
  - Schnee **neutral weiß mit leichtem Blaustich** in den Schatten, Highlights nicht ausfressen (Schnee-Detail erhalten, Highlights ca. -0,3 Blenden).
  - Weißabgleich über alle Shots angleichen – Kling liefert Schnee gern mal gelblich, mal violett. Referenz 18 (verschneiter Wald) als Still laden, Shot Match.
  - **Pudelmütze-Rot** und **Sneaker-Blau** per Qualifier stabil halten; Rot darf nur an der Mütze knallen.
  - Holz von Tung Tung und Schlitten warm halten (Referenz 19 als Still) – warmer Kontrast zum kalten Schnee.
  - S01 Untersicht gegen hellen Himmel: Tiefen anheben, damit Tralaleros Gesicht nicht absäuft.
  - S07 Zeitlupe: minimal mehr Kontrast, leichte Vignette.
  - Folge-1-Still als Referenz für die Figurenfarben laden.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Speed-Ramp in S04 über „Retiming → Geschwindigkeitsrampe“.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 4 · Folge 17: Der Schlitten“, gleiche Comic-Schrift wie bisher, mit kleinem Schneeflocken-Akzent der Winter-Staffel.
- **Pfeil-Gags:** S01 gestrichelte Abfahrtslinie den Hang hinunter auf Tung Tung „ZIEL“; S05 Pfeil auf Tung Tung „+1 PASSAGIER“; S06 Pfeil auf die Schanze „?!“.
- **VFX:** S02/S05 Speedlines und Schnee-Partikel; S07 eine kleine animierte Feder neben Tung Tung als Gag; S09 zusätzliche Pulverschnee-Wolke beim PUFF.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut; Speed-Ramp/Zeitlupe in S04/S07 über den Clip-Speed-Editor.

## 7. Frame.io – Review-Runde

- [ ] Hook: Untersicht, Zeigegeste mit Paukenschlag in der **ersten Sekunde**?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Pudelmütze rot mit weißem Bommel, ohne Logo/Schrift, in allen Tralalero-Shots gleich; im Loop-Shot schief?
- [ ] Holzschlitten in allen Shots gleich (Referenz 19: Lattensitz, zwei Kufen, Zugseil), keine Markierungen?
- [ ] Winter-Look konsistent (Schnee, Schneefall, blau-weißes Morgenlicht, Pfütze gefroren) – kein grünes Sommer-Bild dazwischen?
- [ ] Schläger-Logik: S03/S04/S10 in der Hand, S05–S08 auf dem Rücken – nie zwei Schläger, nie verschwunden?
- [ ] Niemand wird umgefahren oder geschlagen; Tralalero im Schneehaufen sichtbar unverletzt, Schnee weich?
- [ ] Erzähler gleiche Stimme wie Folge 1–16, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Schnee und schiefe Mütze als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei Paukenschlag, Boing und PUFF.
