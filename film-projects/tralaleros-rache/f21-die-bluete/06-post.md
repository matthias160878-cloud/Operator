# Postproduktion – Tralaleros Rache, Folge 21: Die Blüte

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 5 s | 0:00 |
| 2 | S02.mp4 | 3 s | 0:05 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 3 s | 0:12 |
| 5 | S05.mp4 | 5 s | 0:15 |
| 6 | S06.mp4 | 4 s | 0:20 |
| 7 | S07.mp4 | 4 s | 0:24 |
| 8 | S08.mp4 | 4 s | 0:28 |
| 9 | S09.mp4 | 5 s | 0:32 |
| 10 | S10.mp4 | 3 s | 0:37 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass Schneeschmelze und aufploppende Blumen **in der ersten Sekunde** sichtbar sind (Hook). S04 beginnt direkt mit dem FSCHHH. S08 so trimmen, dass das HATSCHI etwa bei 2,5 s liegt.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie bisher: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–20) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Zeitraffer-Whoosh, Plopps, Metall-Thunk, Hahn-Quietschen, Sprenger-Ticken, Wasserstrahl, Knospen-Plopps, Windstoß, Nieser, Platsch, maniakales Lachen).
8. Effekte sparsam: falls der Zeitraffer in S01 zu langsam ist, Hintergrundbewegung per Geschwindigkeitskurve (Speed Ramp) in den ersten 1,5 s anziehen; Zoom-Punch + Shake auf das FSCHHH in S04 und das HATSCHI in S08 (optional 2 Frames weißer Blitz); optional goldenes Partikel-Overlay („Glitzer/Staub“) in S07–S08, falls die Pollenwolke zu blass ist; Shake auf den Platsch in S09.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen (Bildaufbau gleich; Pollenfleck auf der Nase ist ein bewusster Gag). Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- Lumetri: Grüntöne über alle Shots angleichen (siehe Resolve-Hinweise). Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Frühlings-Variante des Serien-Looks):
  - **Grün frischer und heller** als im Sommer (leicht ins Gelbgrün), aber nicht neon; goldene Nachmittagssonne aus Folge 1 bleibt.
  - S01: Schneereste neutral-weiß, nicht blau – der Wechsel zu Grün soll warm wirken.
  - **Blüten-Rosa** (S05–S07, S10) per Qualifier angleichen – zart, nicht pink-grell; Blattgrün an Tung Tung heller als das Waldgrün, damit er sich abhebt.
  - **Pollen-Gold** in S07/S08 leicht anheben (Glow), damit die Wolke klar lesbar ist.
  - Holzbraun von Tung Tung warm halten, Haiblau-Grau und Sneaker-Blau satt.
  - Matschpfütze in S09 braun, aber freundlich (keine Schwarztöne).
  - Referenzbild 3 als Still laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Farbabgleich über „Farbe abgleichen“ mit S02 als Referenz (S01 hat noch Schnee).

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 5 · Folge 21: Die Blüte“, gleiche Comic-Schrift wie bisher, optional mit kleiner Blüte am Schriftzug.
- **Pfeil-Gags:** S02 Pfeil auf die herausragende Flosse „UNSICHTBAR“; S07 Pfeil auf die Pollenwolke „OH NEIN“.
- **VFX:** S05 zusätzliche Blütenblatt-Partikel beim Aufblühen; S08 Comic-„HATSCHI!“ als Schriftbild (nur wenn gewünscht – der Clip selbst bleibt textfrei); S10 langsam fallendes Blütenblatt nachschärfen.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Schneeschmelze und aufploppende Blumen in der **ersten Sekunde**, Rammen + Hahn klar erkennbar?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, keine Mütze, Tung Tungs Holzgesicht)?
- [ ] Wald erkennbar derselbe (dicker Planungsbaum, Busch rechts, Pfütze am Weg), ab S02 durchgehend Frühling ohne Schnee?
- [ ] Rasensprenger in allen Shots gleich (silbergrau, Spieß-Fuß, Zwei-Arm-Kopf, grüner Schlauch mit Messinghahn, **kein Logo**)?
- [ ] Blüten-Logik: S03/S04 kahl → S05 Aufblühen → S06, S07, S10 gleich blühend (hellgrüne Blätter, rosa-weiße Blüten an Kopf und Schultern)?
- [ ] Schläger: in jedem Tung-Tung-Shot in der Hand, nie benutzt, nie verschwunden, nie zwei?
- [ ] Rollen und Platsch harmlos, Tralalero sitzt danach unverletzt in der Pfütze?
- [ ] Kein Blut, keine Verletzungen, niemand wird geschlagen?
- [ ] Erzähler gleiche Stimme wie Folge 1–20, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung im Bildaufbau?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei FSCHHH, HATSCHI, Platsch und Lachen.
