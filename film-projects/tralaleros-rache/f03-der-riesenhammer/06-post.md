# Postproduktion – Tralaleros Rache, Folge 3: Der Riesenhammer

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 5 s | 0:08 |
| 4 | S04.mp4 | 4 s | 0:13 |
| 5 | S05.mp4 | 4 s | 0:17 |
| 6 | S06.mp4 | 4 s | 0:21 |
| 7 | S07.mp4 | 3 s | 0:25 |
| 8 | S08.mp4 | 5 s | 0:28 |
| 9 | S09.mp4 | 3 s | 0:33 |
| 10 | S10.mp4 | 5 s | 0:36 |
| 11 | S11.mp4 | 4 s | 0:41 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Folge 1: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Holz-Tock, Knarzen, Seufzer, Grillen, Glitzer).
8. Effekte sparsam: Wackeln bei S01, Zoom-Punch bei S02 und S06, Herz-/Glitzer-Sticker bei S06 optional.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Serien-Look wie Folge 1):
  - Grün sattes Waldgrün, warme goldene Highlights, keine düsteren Tiefen.
  - **Holzton angleichen:** Hammer und Tung Tung müssen exakt dieselbe hellbraune Farbe haben (Pointe der Folge!) – per Qualifier auf das Holz, Hue/Sat zwischen den Shots matchen.
  - S06 darf minimal wärmer sein (Rührung).
  - Folge-1-Still als Referenz laden und „Shot Match“ nutzen, damit die Serie einheitlich aussieht.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S01 (0,5–1 s, kein eigener Shot, Hook bleibt): „TRALALEROS RACHE – Folge 3: Der Riesenhammer“, gleiche Comic-Schrift wie Folge 1.
- **Pfeil-Gags:** S03 Pfeil auf den Hammer „WAFFE (SCHWER)“; S06 kleine Herzchen um Tung Tungs Kopf; S10 Pfeil auf die leeren Flossen „PLAN C“.
- **VFX:** S08 Speedlines/Blätterpartikel beim Herumwirbeln; S06 Glanzlicht auf der Harzträne verstärken.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Ist in der **ersten Sekunde** klar, dass Tralalero mit einem absurd großen Hammer etwas vorhat?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Hammer in allen Shots gleich groß, gleiche Holzfarbe wie Tung Tung, **ohne Gesicht**?
- [ ] Tung Tung ab S07 ohne Schläger in der Hand; Schläger liegt in S10 auf dem Weg?
- [ ] Kein Blut, keine Verletzungen, niemand wird geschlagen; Sturz in S04 wirkt weich?
- [ ] Gag-Timing: Pause vor „Familie“, Augenrollen in S09 nicht abgeschnitten?
- [ ] Erzähler gleiche Stimme wie Folge 1, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung beim „TOCK“.
