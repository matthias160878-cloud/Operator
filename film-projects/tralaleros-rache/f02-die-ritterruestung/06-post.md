# Postproduktion – Tralaleros Rache, Folge 2: Die Ritterrüstung

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 3 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:03 |
| 3 | S03.mp4 | 4 s | 0:07 |
| 4 | S04.mp4 | 4 s | 0:11 |
| 5 | S05.mp4 | 4 s | 0:15 |
| 6 | S06.mp4 | 5 s | 0:19 |
| 7 | S07.mp4 | 4 s | 0:24 |
| 8 | S08.mp4 | 3 s | 0:28 |
| 9 | S09.mp4 | 4 s | 0:31 |
| 10 | S10.mp4 | 5 s | 0:35 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen. S01: so trimmen, dass der Helm **im ersten Frame** schon in Bewegung ist (Hook).
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt`. Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil **wie Folge 1** (fette weiße Schrift, schwarze Kontur, unteres Drittel über der TikTok-UI-Zone) – als Stilvorlage speichern, falls noch nicht geschehen.
6. Audio: Erzähler-MP3 (aus `04-voiceover.txt`, gleiche Stimme wie Folge 1) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Bibliothek: Metall-Scheppern, Quietschen, Grillen, Holz-Tock, Sand-Rieseln, Lachen.
8. Effekte sparsam: Glint/„Shine“-Effekt auf den Helm in S01; **Geschwindigkeit → Kurve „Abbremsen“** auf S06 (verstärkt das Einrosten); Zoom-Punch auf das „Tock“ in S08; Shake in S10.
9. Loop-Check: Ende S11 (Busch raschelt, Tralalero taucht ab) → Anfang S01 (Helm kommt aus demselben Busch). Kein Fade.
10. Export: 1080p, 24 fps (oder 30 fps, falls nötig), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → Ordner `clips/` → `S01.mp4`, Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- S06: Zeitverzerrung (Time Remapping) mit abbremsender Kurve auf die letzte Sekunde.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen.
- SRT über den Media Pool auf die Timeline.
- Color-Grading (Serien-Look aus Folge 1, S01 von Folge 1 als Referenz-Still nutzen):
  - Waldgrün satt, warme goldene Highlights, keine düsteren Tiefen; Sneaker-Blau per Qualifier schützen.
  - **Rüstung S01–S03:** Highlights auf dem Stahl leicht kühl/neutral halten, damit der Glint knallt.
  - **Rost S05–S09:** Orange per Qualifier leicht in Sättigung anheben – Rost ist die Signalfarbe der Folge, soll aber nicht ins Rote kippen.
  - Shot Match über alle Clips (Kling schwankt in Helligkeit/Farbtemperatur), leichtes Schärfen, kein Grain.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titelkarte** als 0,5-s-Overlay in S01/S02 (kein eigener Shot, Hook bleibt): „TRALALEROS RACHE – Folge 2: Die Ritterrüstung“, gleiche Comic-Schrift und Pop-in wie Folge 1.
- **Pfeil-Gags (Lower Thirds):** S02 Pfeil auf die Rüstung „UNVERWUNDBAR“; S05 Pfeil auf die Tropfen „H₂O“ + Pfeil auf den Rost „Fe“ (Mini-Chemiestunde); S09 Pfeil auf die Sneaker „ÜBERLEBT“.
- **VFX:** S01 zusätzlicher Lens-Glint auf dem Helm; S08 Comic-Schriftzug „tock.“ (klein, kleingeschrieben – bewusst unspektakulär); S09 zusätzliche Rost-Staubpartikel.
- Als `.mov` mit Alpha rendern oder per Dynamic Link in Premiere einsetzen.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach der Tabelle oben einfügen und trimmen.
- Titelspur für Untertitel bzw. SRT-Import (falls verfügbar), Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Ist der Helm **im ersten Frame** in Bewegung und sofort lustig?
- [ ] Serienkonsistenz zu Folge 1: Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht und Schläger, gleicher Wald, gleicher Busch, gleiche Erzählerstimme, gleicher Untertitel-Stil?
- [ ] Rüstung ohne Wappen/Symbole/Logos, Sneaker unter der Rüstung sichtbar?
- [ ] Rost-Verlauf logisch: S04 erste Flecken → S05 Ausbreitung → S06 komplett rostig → S07/S08 bleibt rostig?
- [ ] „Tock“ (S08) eindeutig sanft, Zerfall (S09) wie Sand – keine Verletzung, kein Blut, Tralalero unversehrt?
- [ ] Unterhose schlicht und unauffällig (plattformtauglich)?
- [ ] Erzähler verständlich, Pause vor „Rost“ sitzt auf dem Erstarren, Untertitel synchron?
- [ ] Loop S11 → S01 ohne Sprung (gleicher Busch, gleicher Bildausschnitt)?
- [ ] Lautheit ca. -14 LUFS.
