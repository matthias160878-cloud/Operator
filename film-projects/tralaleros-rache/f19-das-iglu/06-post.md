# Postproduktion – Tralaleros Rache, Folge 19: Das Iglu

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 5 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:09 |
| 4 | S04.mp4 | 4 s | 0:13 |
| 5 | S05.mp4 | 4 s | 0:17 |
| 6 | S06.mp4 | 4 s | 0:21 |
| 7 | S07.mp4 | 3 s | 0:25 |
| 8 | S08.mp4 | 4 s | 0:28 |
| 9 | S09.mp4 | 5 s | 0:32 |
| 10 | S10.mp4 | 3 s | 0:37 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass der Zeitraffer **im ersten Frame** läuft (Hook). S04 so trimmen, dass der Sprungscheitel über dem Zweig in der Clipmitte liegt. S07 so trimmen, dass das KLAPP bei ca. 2 s liegt (vorher der Blick in die Kamera). S09: Schnee-FLUMP und Tassen-Ankunft müssen beide drin sein.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Staffel 1–3: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %). Auf weißem Schnee Kontur ggf. dicker.
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–18) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Zeitraffer-Whoosh, Schneeblock-Wummern, Zweig-Knacks, Zähneklappern, KLAPP, Fallpfeife, Rutsch-Rauschen, Eis-Quietschen, Schnee-FLUMP, Tassen-Schlittern, Tropfen, Schlürfen, maniakales Lachen).
8. Effekte sparsam: Falls Kling S01 nicht schnell genug macht, Clip-Speed 200–300 %; Zoom-Punch auf das KLAPP in S07; Speedlines und Shake beim Herausschießen in S08; kleine Sternchen-Sticker über Tralaleros Kopf in S09, falls Kling sie nicht liefert.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- S01: Zeitverzerrung für zusätzlichen Zeitraffer; S04: kurze Speed-Ramp am Sprungscheitel (Optical Flow). Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Winter-Look der Staffel 4 auf Basis von Folge 1):
  - Schnee **neutral weiß mit leichtem Blaustich**, nie grau oder gelblich; Lichter nicht ausfressen lassen (Highlights runter, Blockfugen am Iglu müssen sichtbar bleiben).
  - **Mützen-Rot** und **Sneaker-Blau** per Qualifier über alle Shots angleichen – sie sind die Signalfarben im Weiß.
  - **S05 (innen):** einziger warmer Shot – goldgrünes Glühwürmchenlicht betonen, Schneewände leicht warm getönt, Tiefen weich; kein Orange-Rot, damit es nicht nach Feuer aussieht.
  - S06 und S10: das warme Licht aus dem Iglu-Eingang gegen das kalte Außenlicht halten (Kontrast = Pointe).
  - S09 Eisfläche mit leichtem Glanz, Tralalero nicht absaufen lassen.
  - Referenz 21 (Iglu) und Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Speed-Ramp in S04 über „Retiming → Geschwindigkeitsrampe“.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 4 · Folge 19: Das Iglu“, gleiche Comic-Schrift wie bisher.
- **Schild-Gag (optional):** auf das leere Holzschild in S02/S03 per Corner-Pin einen Schriftzug „GRATIS-IGLU“ in Kreide-Schrift tracken – nur als Overlay, nie im generierten Bild.
- **Pfeil-Gags:** S02 Pfeil auf den Zweig „GETARNT“; S04 gestrichelte Sprungbahn über die Falltür; S07 Pfeil auf den Sneaker „OH.“
- **VFX:** S08 Speedlines entlang der Schnee-Beule und Pulverschnee-Partikel beim Herausschießen; S09 Cartoon-Sternchen; S05 ein paar zusätzliche Glühwürmchen-Partikel.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut; Zeitraffer in S01 und Speed-Ramp in S04 über den Clip-Speed-Editor.

## 7. Frame.io – Review-Runde

- [ ] Hook: Zeitraffer-Bau mit Ton in der **ersten Sekunde**?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Pudelmütze rot mit weißem Bommel (wie Folge 17), ohne Logo/Schrift, in allen Tralalero-Shots gleich; im Loop-Shot schief?
- [ ] Iglu konsistent mit Referenz 21 (Kuppel, Blockfugen, Tunnel-Eingang zum Weg); Schild **ohne** Schrift/Buchstabensalat?
- [ ] Falltür: in S02 sichtbar zugedeckt, in S04 berührt Tung Tung sie **nicht**, in S07 klappt sie unter Tralalero auf?
- [ ] Schläger-Logik: S03/S04 in Tung Tungs Hand, ab S05 an der Iglu-Wand – nie zwei Schläger, niemand wird geschlagen?
- [ ] **Kein offenes Feuer**: Licht innen nur aus der Glühwürmchen-Laterne?
- [ ] Kein Blut, keine Verletzungen; Tralalero nach Rutsche und Schnee sichtbar unverletzt?
- [ ] Leere Tasse in S09 und S11 dieselbe (weiß, blauer Rand)?
- [ ] Erzähler gleiche Stimme wie Folge 1–18, Untertitel synchron, auf Schnee lesbar, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Schnee, Mütze und Tasse als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei KLAPP, PLOPP und Lachen.
