# Postproduktion – Tralaleros Rache, Folge 7: Der Laubbläser

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 5 s | 0:12 |
| 5 | S05.mp4 | 4 s | 0:17 |
| 6 | S06.mp4 | 4 s | 0:21 |
| 7 | S07.mp4 | 4 s | 0:25 |
| 8 | S08.mp4 | 4 s | 0:29 |
| 9 | S09.mp4 | 3 s | 0:33 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. In S01 so trimmen, dass der Ruck am Startseil bzw. die Blätter-Explosion **im ersten Frame** sichtbar ist (Hook).

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Folge 1–6: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–6) und Musik importieren; Clip-Ton ~25 % (Motor ist laut!), Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Startseil, Motor, Wind, Adlerschrei, „Ding“, Klatschen, Fallpfeife, Platsch, Lachen).
8. Effekte sparsam: Zoom-Punch + Shake auf den Motorstart in S01, Slow-Motion-Feinschliff (Speed 0,8×) in S04 nur falls Kling zu hektisch liefert, Shake auf den PLATSCH in S09.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- Essential Sound: Dialog für den Erzähler, Musik und Clip-Ton (Motor) mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Serien-Look wie Folge 1):
  - Sattes Waldgrün, warme goldene Highlights, keine düsteren Tiefen.
  - **Laubbläser-Rot angleichen:** Das Gehäuse muss in allen Shots (S01–S03, S05–S08, S10) denselben Rotton haben – per Qualifier isolieren und Hue/Sat matchen; nicht ins Orange kippen lassen.
  - **S04 (Flug):** darf heller und wärmer sein, Sonnenstrahlen betonen (leichter Glow) – der kitschig-majestätische Höhepunkt.
  - Tung Tungs Holzton wie in Folge 1 (Folge-1-Still als Referenz laden, „Shot Match“).

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S01 (0,5–1 s, kein eigener Shot, Hook bleibt): „TRALALEROS RACHE – Staffel 2, Folge 2: Der Laubbläser“, gleiche Comic-Schrift wie Folge 1–6.
- **Gags:** S02 Pfeil auf das Rohr „WINDSTÄRKE 12“; S05 Punktetafel-Grafik „10,0“ (wie Turnier-Wertung) neben Tung Tung; S08 Pfeil auf den flatternden Hai „PLAN B?“.
- **VFX:** S01/S03 zusätzliche Laub-Partikel Richtung Kamera; S04 Lens-Flare/Lichtstrahlen; S08 Speedlines; S09 Matsch-Partikel beim PLATSCH.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Knattert der Laubbläser und explodieren Blätter in der **ersten Sekunde**?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Tung Tungs Schläger in **allen** Shots quer auf dem Rücken (nie in der Hand, nie geschwungen)?
- [ ] Laubbläser überall gleich (rot, riesiges Rohr, eimergroße Düse) und **ohne Logo/Schrift/Markenanmutung**?
- [ ] Schutzbrille: S01–S08 auf (S06–S08 schief), fliegt in S09 weg, in S11 nicht mehr da?
- [ ] Flug in S04 wirkt majestätisch, Landung in S05 klar „perfekt auf beiden Füßen“?
- [ ] Kein Blut, keine Verletzungen, niemand wird geschlagen; Tralalero taucht in S09 sichtbar unverletzt auf?
- [ ] Erzähler gleiche Stimme wie Folge 1–6, Pausen bei „Er möchte … nochmal“, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Motorlärm übertönt den Erzähler nirgends?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung beim Motorstart und beim PLATSCH.
