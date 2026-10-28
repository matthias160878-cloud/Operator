# Postproduktion – Tralaleros Rache, Folge 13: Die Seilrutsche

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 3 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:03 |
| 3 | S03.mp4 | 4 s | 0:07 |
| 4 | S04.mp4 | 4 s | 0:11 |
| 5 | S05.mp4 | 5 s | 0:15 |
| 6 | S06.mp4 | 4 s | 0:20 |
| 7 | S07.mp4 | 4 s | 0:24 |
| 8 | S08.mp4 | 3 s | 0:28 |
| 9 | S09.mp4 | 5 s | 0:31 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass der Seil-Ruck **im ersten Frame** passiert (Hook). S05 so trimmen, dass der Überflug genau in der Clipmitte liegt. S07 so trimmen, dass das PLING am Clipanfang liegt und der Hängemoment mindestens 2 s dauert.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Staffel 1–3: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–12) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Seil-Knarzen/Twang, Whoosh, Sirren, Glitzer-Ping, Zeitlupen-Whoosh, Schlucken, PLING, Fallpfeife, Platsch, maniakales Lachen).
8. Effekte sparsam: Zoom-Punch + Shake auf den Seil-Ruck in S01, Speedlines in S03/S06, **Speed-Ramp** (100 % → 25 % → 100 %) in S05, falls Kling die Zeitlupe nicht selbst liefert; in S07 **Freeze-Frame** von ca. 1 s auf den Hängemoment, falls Kling ihn zu kurz macht; Shake auf den PLATSCH in S08.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- S05: Zeitverzerrung (Time Remapping) für die Speed-Ramp, Optical Flow aktivieren. Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Serien-Look wie Folge 1):
  - Sattes Waldgrün, warme goldene Highlights, keine düsteren Tiefen.
  - **Seil** in allen Shots gleich hell-hanffarben, damit die Diagonale lesbar bleibt (Referenz 15 als Still laden, Shot Match).
  - **Helm-Gelb** und **Pilz-Rot** per Qualifier angleichen; Rot darf nur am Pilz knallen – rote Stiche anderswo entsättigen.
  - S01 (Gegenlicht im Baumwipfel) Tiefen anheben, damit Tralaleros Gesicht nicht absäuft.
  - S05 Zeitlupe: minimal mehr Kontrast und leichte Vignette für den „Moment“.
  - S08 Matsch sattbraun, nicht grau.
  - Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Speed-Ramp in S05 über „Retiming → Geschwindigkeitsrampe“.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 3 · Folge 13: Die Seilrutsche“, gleiche Comic-Schrift wie bisher.
- **Pfeil-Gags:** S03 gestrichelte Flugbahn-Linie vom Seil auf Tung Tungs Kopf „ZIEL“; S04 Pfeil auf den Pilz „OH!“; S06 Pfeil auf das Seilende „ENDE“.
- **VFX:** S05 Speedlines und ein feiner Abstandsmarker zwischen Sneaker und Kopf („1 mm“) als Gag; S07 kleine Cartoon-Staubwolke am Seilriss; S08 zusätzliche Matsch-Partikel beim PLATSCH; S09 kleiner Glitzer-Stern am Pilz.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut; Zeitlupe in S05 über den Clip-Speed-Editor.

## 7. Frame.io – Review-Runde

- [ ] Hook: Seil-Ruck mit hörbarem Twang in der **ersten Sekunde**?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Helm gelb, ohne Logo/Schrift, in allen Shots gleich; im Loop-Shot schief?
- [ ] Seilrutsche konsistent (Verlauf vom Planungsbaum über den Weg, Seilende genau über der Pfütze, Holzgriff)?
- [ ] Schläger-Logik: S03/S04 in der Hand, ab S05 unter den Arm geklemmt – nie zwei Schläger, nie verschwunden?
- [ ] Beinahe-Treffer S05: Sneaker berühren Tung Tungs Kopf **nicht**?
- [ ] Pilz wird nie gegessen, nur gezeigt und angeboten?
- [ ] Kein Blut, keine Verletzungen; Tralalero sitzt in S08 sichtbar unverletzt in der Pfütze?
- [ ] Erzähler gleiche Stimme wie Folge 1–12, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Seilrest und schiefer Helm als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei Twang, PLING und PLATSCH.
