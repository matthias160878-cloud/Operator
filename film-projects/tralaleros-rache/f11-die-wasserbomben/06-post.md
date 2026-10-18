# Postproduktion – Tralaleros Rache, Folge 11: Die Wasserbomben

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 4 s | 0:12 |
| 5 | S05.mp4 | 4 s | 0:16 |
| 6 | S06.mp4 | 5 s | 0:20 |
| 7 | S07.mp4 | 4 s | 0:25 |
| 8 | S08.mp4 | 4 s | 0:29 |
| 9 | S09.mp4 | 3 s | 0:33 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass Ballonbündel, Gürtel und Grinsen **im ersten Frame** schon im Bild sind (Hook). S03 so trimmen, dass der PLATSCH bei ca. 1 s liegt. S04 muss das Abstellen des Schlägers vollständig zeigen.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Staffel 1/2: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–10) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Ballon-Quietschen, Fallpfeife, Platsch, Grille, Holz-Tock, Dusche, Summen, Pop-Kette, Boing, maniakales Lachen, Luft-Entweichen).
8. Effekte sparsam: leichter Zoom-Punch auf das Grinsen in S01, Zoom-Punch + Shake auf den PLATSCH in S03, Glitzer-Overlay auf Tung Tung in S06/S10, **Shake-Impuls auf jeden POP** in S07/S08, Shake auf den PLATSCH in S09.
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
  - **Himmel-Shots (S01, S02, S05, S07, S08):** Himmel nicht ausbrennen lassen, Ballonfarben (Rot, Gelb, Grün, Orange, Lila) in allen Shots gleich – per Qualifier matchen, Referenz 13 als Still laden.
  - **Wasserbomben** überall gleich durchsichtig hellblau, klar unterscheidbar von den bunten Luftballons.
  - S06 Wellness-Look: etwas wärmer, weiche Highlights auf Schaum und Seifenblasen-Kugeln; S10 Tung Tungs Holz glänzend, etwas heller als in S03/S04 (frisch geputzt).
  - S09/S11 Matsch sattbraun, nicht grau.
  - Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 3 · Folge 11: Die Wasserbomben“, gleiche Comic-Schrift wie bisher; neu: kleines „STAFFEL 3“-Badge mit Pop-Animation.
- **Pfeil-Gags:** S02 Fadenkreuz über dem winzigen Tung Tung; S06 Pfeil auf Tung Tung „WELLNESS“; S07 Pfeil auf den spitzen Ast „OH NEIN“.
- **VFX:** S03 zusätzliche Wassertropfen; S06 zusätzliche Seifenblasen-Kugeln aus Blätterschaum, falls Kling zu wenig liefert; S08 bunte Gummifetzen-Partikel synchron zu den Pops; S09 Matsch-Partikel beim PLATSCH.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Ballonbündel, Wasserbomben-Gürtel und diabolisches Grinsen in der **ersten Sekunde** lesbar?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Ballonschnüre immer an der **linken** Flosse, Wasserbomben immer durchsichtig hellblau?
- [ ] Schläger-Logik: S02/S03 in der Hand, in S04 an den Baum gelehnt, in S06/S10 lehnt er am Baum – nie zwei Schläger, nie verschwunden?
- [ ] Kein Seifenprodukt, keine Marke im Bild – Schaum nur aus Blättern?
- [ ] Kein Blut, keine Verletzungen; Wasserbombe nur harmloses Wasser; Tralalero hebt in S09 sichtbar unverletzt den Kopf?
- [ ] Pop-Kette (S08) rhythmisch, jeder Pop hörbar und sichtbar?
- [ ] Erzähler gleiche Stimme wie Folge 1–10, „Staffel drei.“ klar abgesetzt, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Ballonrest an der Flosse als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei Pops und PLATSCH.
