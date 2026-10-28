# Postproduktion – Tralaleros Rache, Folge 8: Die Torte

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 4 s | 0:12 |
| 5 | S05.mp4 | 4 s | 0:16 |
| 6 | S06.mp4 | 4 s | 0:20 |
| 7 | S07.mp4 | 5 s | 0:24 |
| 8 | S08.mp4 | 4 s | 0:29 |
| 9 | S09.mp4 | 3 s | 0:33 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass die Torte im **ersten Frame** steht und die Augen innerhalb der ersten Sekunde herauslugen (Hook).

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie in allen Folgen: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %). Achtung: In S07/S09 ist das Bild sehr weiß (Sahne) – dort gibt es keinen Untertitel; in S08 die Kontur ggf. verstärken.
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie alle Folgen) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Plopp, Holzschritte, Tröte, Einatmen, Wind-Gust, Rutsch-Quietschen, Platsch, Lachen).
8. Effekte sparsam: Zoom-Punch auf den Plopp in S01, Glitzer-Sticker in S03, kurze **Freeze-Frame-Pause (0,2 s)** am Ende von S06 vor dem Pusten, Shake auf den WUMMS in S07 und den PLATSCH in S09.
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
  - **Sahneweiß schützen:** Torte und Sahnewolke dürfen nicht ausbrennen – Highlights in S01–S07 leicht zurücknehmen, Weiß neutral bis minimal warm (kein Blaustich), Erdbeerrot satt, aber nicht ins Magenta.
  - **Torte konsistent:** Weiß und Erdbeerrot zwischen S01, S03, S05, S06, S07 per Qualifier matchen.
  - S09/S11: Matsch-Braun und Sahne-Weiß klar trennbar halten (S11 halb/halb muss lesbar sein).
  - Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S01 (0,5–1 s, kein eigener Shot, Hook bleibt): „TRALALEROS RACHE – Folge 8: Die Torte“, gleiche Comic-Schrift wie alle Folgen.
- **Pfeil-Gags:** S01 Pfeil auf das Loch „PLAN H“ (Zählung wie Folge 4 „PLAN D“); S04 Pfeil auf den Schläger am Baum „ENTWAFFNET“; S05 kleine Konfetti-Partikel um den Partyhut.
- **VFX:** S06 Squash-and-Stretch-Verstärkung der Brust, falls Kling zu zahm aufbläht; S07 zusätzliche Sahnewolken-Partikel und Erdbeeren, Speedlines am Abflug; S08 Sahne-Spritzer seitlich; S09 Matsch-Partikel beim PLATSCH.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Steht die Torte im **ersten Frame**, und sind Tralaleros Augen im Loch in der ersten Sekunde erkennbar?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Torte in allen Shots gleich (3 Etagen, Erdbeeren, Loch oben, Kerzen) – keine Schrift auf der Torte?
- [ ] **Schläger-Kontinuität:** S02–S04 in der Hand, ab S05 lehnt er am Baum und wird nie wieder angefasst?
- [ ] Partyhut ab S05 in jedem Tung-Tung-Shot vorhanden und aus einem Blatt?
- [ ] Nur kleine Kerzenflammen, die in S07 sofort ausgehen – kein weiteres Feuer, kein Rauch?
- [ ] Kein Blut, keine Verletzungen; Landung weich auf Sahne, Tralalero taucht in S09 sichtbar unverletzt auf?
- [ ] Erzähler gleiche Stimme wie alle Folgen, Pause nach „Er sieht …“, Untertitel synchron, auf weißem Sahne-Hintergrund lesbar?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung beim WUMMS und PLATSCH.
