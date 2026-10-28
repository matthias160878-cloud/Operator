# Postproduktion – Tralaleros Rache, Folge 4: Die Verkleidung

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 3 s | 0:08 |
| 4 | S04.mp4 | 4 s | 0:11 |
| 5 | S05.mp4 | 4 s | 0:15 |
| 6 | S06.mp4 | 5 s | 0:19 |
| 7 | S07.mp4 | 4 s | 0:24 |
| 8 | S08.mp4 | 4 s | 0:28 |
| 9 | S09.mp4 | 4 s | 0:32 |
| 10 | S10.mp4 | 5 s | 0:36 |
| 11 | S11.mp4 | 4 s | 0:41 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. In S01 den Clip so trimmen, dass der Ruck **im ersten Frame** beginnt (Hook).

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Folge 1–3: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–3) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Holz-Klonk, Knarzen, Schlucken, Kastagnetten, Ballon-Aufblähen, Platsch, Lachen).
8. Effekte sparsam: Zoom-Punch auf den KLONK in S01, Glitzer-Sticker bei S04, **keinen** Spiegel-/Split-Screen-Effekt in S05/S06 (der Spiegel-Gag muss aus dem Bild kommen), Shake auf den PLATSCH in S10.
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
  - Sattes Waldgrün, warme goldene Highlights, keine düsteren Tiefen.
  - **Holzton angleichen:** Tung Tung und das Kostüm müssen in S03–S06 dieselbe hellbraune Farbe haben (sonst funktioniert „Zwillingsbruder“ nicht) – per Qualifier auf das Holz, Hue/Sat zwischen den Shots matchen.
  - **Ab S07 bewusst dunkleres, nasses Holz** am Kostüm/Fass – den Kontrast nicht weggraden.
  - S04 darf minimal wärmer sein (Rührung).
  - Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S01 (0,5–1 s, kein eigener Shot, Hook bleibt): „TRALALEROS RACHE – Folge 4: Die Verkleidung“, gleiche Comic-Schrift wie Folge 1–3.
- **Pfeil-Gags:** S02 Pfeil auf die herausschauende Flosse „UNAUFFÄLLIG“; S04 kleine Herzchen um Tung Tungs Kopf; S08 Pfeil auf das Fass „PLAN D“.
- **VFX:** S06 Speedlines/Wassertropfen-Partikel beim Tanz; S08 kurzer Squash-and-Stretch-Bounce beim Aufblähen, falls Kling ihn zu zahm liefert; S10 zusätzliche Matsch-Partikel beim PLATSCH.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Ist in der **ersten Sekunde** der Ruck mit dem Kostüm zu sehen und klar, dass es Tung Tung imitiert?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Kostüm in allen Shots gleich (schiefe Augen, Flosse oben, Sneaker unten), Holzton wie Tung Tung?
- [ ] Spiegel-Gag lesbar: Bewegungen in S05 einen Tick verzögert, in S06 synchron?
- [ ] Tung Tung schubst **mit der Fingerspitze**, Schläger auf der Schulter – nichts sieht nach Schlagen aus?
- [ ] Kein Blut, keine Verletzungen; Fass zerfällt weich, Tralalero sitzt sichtbar unverletzt im Matsch?
- [ ] Erzähler gleiche Stimme wie Folge 1–3, Pause nach „Er sieht …“, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung beim KLONK und PLATSCH.
