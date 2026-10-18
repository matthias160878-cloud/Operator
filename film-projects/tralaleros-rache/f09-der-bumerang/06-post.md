# Postproduktion – Tralaleros Rache, Folge 9: Der Bumerang

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
| 7 | S07.mp4 | 5 s | 0:24 |
| 8 | S08.mp4 | 3 s | 0:29 |
| 9 | S09.mp4 | 4 s | 0:32 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass der Bumerang **im ersten Frame schon groß und wirbelnd** im Bild ist (Hook) und der Schnitt auf S02 direkt nach dem Vorbeiflug kommt. S09 so trimmen, dass die Hut-Landung bei ca. 2 s liegt (Stille davor).

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Staffel 1/2: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–8) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Sirren/Whoosh, Doppler, Holz-Klack, Panik-Schrei, Fallpfeife, Platsch, Tock, Klatschen, maniakales Lachen).
8. Effekte sparsam: Zoom-Punch + kleiner Shake auf den Vorbeiflug in S01, **Speed-Ramp** (100 % → 40 % → 100 %) auf den Abwurf in S05, Speedlines in S06/S07, Shake auf den PLATSCH in S08, in S09 **kein** Effekt (Stille wirken lassen).
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
  - **Bumerang-Ton angleichen:** In allen Shots dasselbe dunkle Rotbraun – klar dunkler als Tung Tungs hellbraunes Holz und der Schläger (per Qualifier matchen, Referenz 11 als Still laden).
  - S07 (Slalom von oben) nicht zu dunkel – Sneaker-Blau und Qualm müssen lesbar bleiben.
  - S08/S09 Matsch sattbraun, nicht grau; S09 minimal entsättigt für den Stille-Moment, S10 wieder voll gesättigt.
  - Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 2 · Folge 9: Der Bumerang“, gleiche Comic-Schrift wie bisher.
- **Pfeil-Gags:** S04 Pfeil auf den gefangenen Bumerang „SPIELZEUG?“; S07 gestrichelte Flugbahn-Linie, die sich in Schleifen um Tralalero zieht; S09 Pfeil auf den Kopf „HUT“.
- **VFX:** S01 Motion-Blur-Verstärkung und Wind-Partikel; S06/S07 Speedlines und extra Sneaker-Qualm, falls Kling zu wenig liefert; S08 zusätzliche Matsch-Partikel beim PLATSCH.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Bumerang wirbelt in der **ersten Sekunde** auf die Kamera zu und hörbar vorbei?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Bumerang in allen Shots gleich (Form, dunkles Rotbraun, Größe) und klar vom Schläger unterscheidbar?
- [ ] Schläger-Logik: S03 in der Hand, S04/S05/S10 unter den Arm geklemmt – nie zwei Schläger, nie verschwunden?
- [ ] Niemand wird getroffen: Bumerang verfehlt in S01, S06, S07 immer knapp; Landung in S09 sichtbar sanft?
- [ ] Kein Blut, keine Verletzungen; Tralalero hebt in S09 sichtbar unverletzt den Kopf?
- [ ] Stille vor der Hut-Landung (S09) wirklich still – keine Musik, kein Erzähler bis nach dem „Tock“?
- [ ] Erzähler gleiche Stimme wie Folge 1–8, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Bumerang-Hut als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung beim Sirren und PLATSCH.
