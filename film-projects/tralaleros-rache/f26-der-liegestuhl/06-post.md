# Postproduktion – Tralaleros Rache, Folge 26: Der Liegestuhl

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 4 s | 0:12 |
| 5 | S05.mp4 | 4 s | 0:16 |
| 6 | S06.mp4 | 3 s | 0:20 |
| 7 | S07.mp4 | 5 s | 0:23 |
| 8 | S08.mp4 | 4 s | 0:28 |
| 9 | S09.mp4 | 5 s | 0:32 |
| 10 | S10.mp4 | 3 s | 0:37 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass Hitzeflimmern und Libelle **in der ersten Sekunde** sichtbar sind und das KLACK spätestens bei ~1,5 s kommt (Hook). S05 so trimmen, dass beide Fehlzüge drin sind. S08 so trimmen, dass das KLACK etwa bei 2,5 s liegt; S09 beginnt direkt mit dem BOING.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie bisher: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–25) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Libellen-Surren, Holz-Klack, Schirm-Whump, Feder-Quietschen, Seil-Ruck, Grillenzirpen, Schnarchen, BOING, Platsch, maniakales Lachen).
8. Effekte sparsam: leichter „Hitze-Wellen“-/Distortion-Effekt nur in S01 und S03 (Hintergrund), falls Kling kein Flimmern liefert; Zoom-Punch + Shake auf das KLACK in S01 und S08; Speed-Ramp (kurz langsam am höchsten Punkt) und Shake auf den PLATSCH in S09; Zoom-Punch auf das Lachen in S10.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen (Bildaufbau gleich; schiefe Sonnenbrille und Stoffstreifen sind ein bewusster Gag). Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- Lumetri: Grüntöne und Liegestuhl-Blau über alle Shots angleichen (siehe Resolve-Hinweise). Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Sommer-Variante des Serien-Looks):
  - **Grün tiefer und satter** als im Frühling, leicht ins Blaugrün in den Schatten; Lichter warm und etwas heller (Mittagshitze), aber nicht ausgebrannt.
  - **Liegestuhl-Blau-Weiß** per Qualifier angleichen: Weiß neutral, Blau gleich satt in allen Shots (S09 im Flug und in der Pfütze besonders prüfen).
  - Schatten unter dem Schirm (S04–S07) kühler als die sonnigen Flächen – „kühler Schatten“ ist die Pointe für Tung Tung.
  - Holzbraun von Tung Tung warm halten, Harztropfen (S03/S04) leicht glänzend; Haiblau-Grau, Sneaker-Blau und Sonnenbrillen-Schwarz satt.
  - Matschpfütze in S09/S10 braun, aber freundlich (keine Schwarztöne).
  - Referenzbild 28 als Still laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Farbabgleich über „Farbe abgleichen“ mit S04 als Referenz (Liegestuhl, Schirm und Tung Tung im Bild).

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 6 · Folge 26: Der Liegestuhl“, gleiche Comic-Schrift wie bisher, optional mit kleiner Sonne am Schriftzug.
- **Pfeil-Gags:** S02 Pfeil auf die Feder „GEHEIM“; S05 Pfeil auf den Stuhl „…?“.
- **VFX:** S01/S03 Hitzeflimmern per Displacement nachschärfen; S06 kleines „Zzz“ über Tung Tung (nur wenn gewünscht – der Clip selbst bleibt textfrei); S08 Comic-„KLACK!“ und S09 „BOING!“ als Schriftbild (optional); S09 Spritzer-Partikel verstärken.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Hitzeflimmern und Libelle in der **ersten Sekunde**, KLACK und Schirm klar erkennbar?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Sonnenbrille in jedem Tralalero-Shot gleich (groß, rund, dunkel, schwarzer Rahmen, **kein Logo**), ab S09 schief?
- [ ] Liegestuhl und Schirm in allen Shots gleich (Holz, blau-weiße Streifen, **kein Logo**), Feder und Seil in S02/S05/S08/S09 gleich?
- [ ] Wald erkennbar derselbe (dicker Planungsbaum, Pfütze am Weg), durchgehend Hochsommer?
- [ ] Schläger: S03 in der Hand, S04 an die Schirmstange gelehnt, ab S05 immer am Schirm – nie benutzt, nie verschwunden, nie zwei?
- [ ] Tung Tung wird in S07 sanft getragen und abgelegt (kein Fallenlassen), schläft weiter?
- [ ] KLACK, Flug und PLATSCH harmlos, Tralalero treibt danach unverletzt im Stuhl?
- [ ] Kein Blut, keine Verletzungen, niemand wird geschlagen?
- [ ] Erzähler gleiche Stimme wie Folge 1–25, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung im Bildaufbau?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei KLACK, BOING, PLATSCH und Lachen.
