# Postproduktion – Tralaleros Rache, Folge 16: Der Schneemann

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 3 s | 0:08 |
| 4 | S04.mp4 | 5 s | 0:11 |
| 5 | S05.mp4 | 4 s | 0:16 |
| 6 | S06.mp4 | 4 s | 0:20 |
| 7 | S07.mp4 | 5 s | 0:24 |
| 8 | S08.mp4 | 3 s | 0:29 |
| 9 | S09.mp4 | 4 s | 0:32 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass die Nase **in der ersten Sekunde** zuckt (Hook). S06 so trimmen, dass das HATSCHI etwa bei 1,5 s liegt. S08 endet genau auf dem Eis-Ticken, S09 beginnt mit dem KNACK.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Staffel 1–3: fette weiße Schrift, schwarze Kontur (im weißen Schnee-Bild wichtig – ggf. Kontur dicker oder leichter Schatten), über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–15) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Winterwind, Blinzel-Klick, Schneeknirschen, Glitzer-Ping, Woll-Rascheln, Nieser, Puff, Eis-Rutschen, KNACK, Platsch, Zähneklappern, maniakales Lachen).
8. Effekte sparsam: Snap-Zoom auf die Augen in S01; Shake + Zoom-Punch auf das HATSCHI in S06 (optional 2 Frames weißer Blitz); Speedlines bei den Pirouetten in S07; **Freeze-Frame ~0,5 s** auf das Lächeln in S08, falls Kling die Stille zu kurz macht; Shake auf das KNACK in S09. Optional dezenter Schneefall-Overlay, falls ein Clip zu wenig Flocken hat.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen (Bildaufbau gleich; der Jahreszeitensprung ist bewusst). Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- Lumetri: Weißabgleich über alle Shots angleichen (siehe Resolve-Hinweise). Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Winter-Variante des Serien-Looks):
  - **Schnee neutral-kühl**, leicht ins Blau-Weiß, aber nie grau oder ausgefressen – Highlights knapp unter Clipping halten, damit Schneestruktur bleibt.
  - Hautton der Figuren bleibt Serie: Haiblau-Grau und warmes Holzbraun dürfen nicht ins Cyan kippen (Qualifier auf Tung Tung, Sättigung/Wärme halten).
  - **Schal-Rot** in S02–S06 und S10 per Qualifier angleichen – einzige rote Signalfarbe; andere Rotstiche entsättigen.
  - Sneaker-Blau satt halten.
  - Eis in S07–S09 glatt und leicht spiegelnd, Wasser in S09 dunkel-klar statt braun-trüb (nicht bedrohlich).
  - Referenz 18 als Still laden und „Shot Match“ nutzen, damit alle Shots dieselbe Weiß-Balance haben.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Farbabgleich über „Farbe abgleichen“ mit S01 als Referenz.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 4 · Folge 16: Der Schneemann“, gleiche Comic-Schrift wie bisher, optional mit kleinem Schneehäubchen auf dem Schriftzug.
- **Pfeil-Gags:** S01 Pfeil auf den Schneemann „TARNUNG“; S05 Pfeil auf die zuckende Nase „GEFAHR“; S08 Pfeil auf Tralalero „SICHER?“.
- **VFX:** S06 zusätzliche Pulverschnee-Partikel und ein Comic-„HATSCHI!“ als Schriftbild (nur wenn gewünscht – der Clip selbst bleibt textfrei); S09 kleine Eissplitter-Partikel beim KNACK; S11 Funkeln am Eiszapfen.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut; Freeze-Frame in S08 über „Standbild einfügen“.

## 7. Frame.io – Review-Runde

- [ ] Hook: Nase zuckt und Augen blinzeln in der **ersten Sekunde**?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Wald erkennbar derselbe (dicker Planungsbaum links, Pfütze am Weg), durchgehend verschneit, Pfütze zugefroren (ab S09 in der Mitte gebrochen)?
- [ ] Schneemann in S01, S03–S05 gleich (schief, Karotte, leere Augenlöcher, Kieselmund, Zweigarme)?
- [ ] Schal-Logik: S02/S03 bei Tung Tung → S04/S05 am Schneemann → S06 fliegt → S10 wieder bei Tung Tung; immer derselbe rote Strickschal?
- [ ] Schläger-Logik: S02/S03/S10 in der Hand, S04–S06 unter den Arm geklemmt – nie zwei Schläger, nie verschwunden?
- [ ] Explosion harmlos (weicher Pulverschnee), Tung Tung danach unversehrt?
- [ ] Eiswasser: sichtbar flach (nur bis zum Bauch), Tralalero steht sofort wieder – keine Gefahr, kein Untertauchen?
- [ ] Kein Blut, keine Verletzungen, niemand wird geschlagen?
- [ ] Erzähler gleiche Stimme wie Folge 1–15, Untertitel synchron, auf Schnee lesbar, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung im Bildaufbau (Eiszapfen als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei HATSCHI, KNACK und Lachen.
