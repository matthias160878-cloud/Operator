# Postproduktion – Tralaleros Rache, Folge 18: Die Schneeballkanone

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 3 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:03 |
| 3 | S03.mp4 | 4 s | 0:07 |
| 4 | S04.mp4 | 5 s | 0:11 |
| 5 | S05.mp4 | 4 s | 0:16 |
| 6 | S06.mp4 | 4 s | 0:20 |
| 7 | S07.mp4 | 5 s | 0:24 |
| 8 | S08.mp4 | 4 s | 0:29 |
| 9 | S09.mp4 | 4 s | 0:33 |
| 10 | S10.mp4 | 4 s | 0:37 |
| 11 | S11.mp4 | 4 s | 0:41 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass das FUMP **im ersten Frame** passiert (Hook). S04 so trimmen, dass drei PLOCKs drin sind. S08 so trimmen, dass die sanfte Landung am Clipende liegt; S09 beginnt mit dem fertigen Schneemann.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Staffel 1–4: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %). Auf weißem Schnee ggf. Kontur verstärken oder leichten Schatten dazu.
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–17) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Feder-FUMP, Kurbel-Ratschen, PLOCK, Schnee-Plopp, Glitzer, Zeitlupen-Whoosh, Fallpfeife, FLUMPF, Blinzel-Klick, maniakales Lachen).
8. Effekte sparsam: Zoom-Punch + Shake auf das FUMP in S01 und S06; kurzer Shake auf jedes PLOCK in S04; **Speed-Ramp** (100 % → 25 % → 100 %) in S07, falls Kling die Zeitlupe nicht selbst liefert; in S09 notfalls **Freeze-Frame** und nur das Blinzeln als Overlay, falls Kling Tralalero zu sehr bewegt.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- S07: Zeitverzerrung (Time Remapping) für die Speed-Ramp, Optical Flow aktivieren. Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Winter-Look der Staffel 4):
  - Kühles Blau-Weiß, aber **Schnee nicht ausbrennen lassen** – Highlights bei ca. 90 % deckeln, damit Schneebälle Struktur behalten.
  - Weißabgleich in allen Shots gleich: leicht blauer Schnee, keine Gelb-/Magenta-Stiche (Referenz 18 als Still laden, Shot Match).
  - **Mützen-Rot** per Qualifier über alle Shots angleichen; Haut des Hais blaugrau, nicht violett.
  - Ofenrohr schwarz, Kiste warmes Holzbraun (Referenz 20) – das einzige warme Element neben Tung Tung.
  - S07 Zeitlupe: minimal mehr Kontrast, leichte Vignette, Glitzer betonen.
  - S09 ruhig und symmetrisch, leicht entsättigt für den Deadpan-Moment.
  - Folge-16-Still als Referenz für den Staffel-Look laden.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Speed-Ramp in S07 über „Retiming → Geschwindigkeitsrampe“.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 4 · Folge 18: Die Schneeballkanone“, gleiche Comic-Schrift wie bisher.
- **Pfeil-Gags:** S02 Pfeil auf die Kurbel „FEDERKRAFT“; S03 Pfeil auf Tung Tungs Augen „TRAINING!“; S06 Pfeil auf den Riesenball „XXL“.
- **Baseball-Gag:** S04 kleine Anzeigetafel oben im Bild, die bei jedem PLOCK hochzählt (1, 2, 3); S10 dieselbe Tafel zeigt „HOMERUN“.
- **VFX:** S04 zusätzliche Pulverschnee-Partikel bei jedem Kontakt; S07 Glitzer-Partikel und Speedlines; S08 Schnee-Partikel, die an den fallenden Ball „andocken“.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut; Zeitlupe in S07 über den Clip-Speed-Editor.

## 7. Frame.io – Review-Runde

- [ ] Hook: FUMP und auf die Kamera zufliegender Schneeball in der **ersten Sekunde**?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Pudelmütze rot mit weißem Bommel, weißer Bommel, ohne Logo/Schrift, in allen Tralalero-Shots gleich; in S11 schief mit Mini-Schneeball?
- [ ] Schneeballkanone konsistent (Holzkiste, Blechtrichter, Kurbel, schwarzes Ofenrohr) – **kein Feuer, kein Rauch, keine Explosion**?
- [ ] Schläger-Logik: Tung Tung hält den Schläger in jedem Shot, in dem er vorkommt – nie zwei Schläger, nie verschwunden?
- [ ] Der Schläger berührt **ausschließlich Schneebälle**, nie eine Figur?
- [ ] S05: keiner der zurückgeschlagenen Bälle trifft Tralalero; S08: Landung sanft, kein Aufprall?
- [ ] Winter-Look konsistent mit Folge 16 (Schnee, Raureif, gefrorene Pfütze, kaltes Morgenlicht)?
- [ ] Kein Blut, keine Verletzungen; Tralalero wirkt in S09 unverletzt und nur verdutzt?
- [ ] Erzähler gleiche Stimme wie Folge 1–17, Untertitel synchron, auf Schnee gut lesbar, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Schnee und Mütze als bewusster Staffel-Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei FUMP, PLOCK und FLUMPF.
