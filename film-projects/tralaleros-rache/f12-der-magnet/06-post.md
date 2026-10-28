# Postproduktion – Tralaleros Rache, Folge 12: Der Magnet

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 3 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:03 |
| 3 | S03.mp4 | 5 s | 0:07 |
| 4 | S04.mp4 | 3 s | 0:12 |
| 5 | S05.mp4 | 5 s | 0:15 |
| 6 | S06.mp4 | 5 s | 0:20 |
| 7 | S07.mp4 | 4 s | 0:25 |
| 8 | S08.mp4 | 3 s | 0:29 |
| 9 | S09.mp4 | 3 s | 0:32 |
| 10 | S10.mp4 | 5 s | 0:35 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass der Magnet **im ersten Frame** formatfüllend im Bild ist und die Blitze sofort zucken (Hook). S06 so trimmen, dass der letzte Helm-BONG kurz vor dem Schnitt liegt. S08 endet direkt nachdem der Magnet aus dem Bild ist.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie bisher: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–11) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Elektro-Brummen, Funken, Holz-Tock, Grille, Ratsche, Blech-Klong, Fallpfeife, Platsch, Metall-Klonk, maniakales Lachen).
8. Effekte sparsam: Zoom-Punch + Shake auf das Einschalten in S01; Text-Sticker **„MAXIMUM“** (rot, kurz pulsierend) über dem Regler in S04; Shake auf jeden KLONG in S06; Shake auf den PLATSCH in S08; in S03 **kein** Effekt (die Stille ist der Gag).
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
  - **Magnet-Rot angleichen:** in allen Shots dasselbe glänzende Rot mit silbernen Polen (Qualifier, Referenz 14 als Still laden); Rot nicht ins Orange kippen lassen, damit es sich vom Rost unterscheidet.
  - **Rost-Orange** (S05–S11) warm und körnig, aber nicht übersättigt; die blauen Sneaker müssen in S06–S08 als einziger kühler Akzent am Ritter lesbar bleiben.
  - Blitzlinien (S01, S04) leicht mit Glow betonen.
  - S08 Matsch sattbraun, nicht grau.
  - Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 3 · Folge 12: Der Magnet“, gleiche Comic-Schrift wie bisher.
- **„MAXIMUM“-Overlay** in S04 auf den Regler getrackt (Tracker auf den Zeiger), rot, mit kurzem Wackeln.
- **Pfeil-Gags:** S03 Pfeil auf Tung Tung „HOLZ“; S06 Pfeil auf den Helm „FOLGE 2“; S09 Herzchen über Magnet und Eimer.
- **VFX:** S01/S04 zusätzliche Blitzlinien und Glow, falls Kling zu wenig liefert; S05 Motion-Blur-Streaks hinter den fliegenden Teilen; S08 zusätzliche Matsch-Partikel.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Magnet in der **ersten Sekunde** formatfüllend, Brummen und Blitze sofort da?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Magnet in allen Shots gleich (Rot, silberne Pole, Regler, Größe) – ohne Schrift im Bild?
- [ ] Schläger-Logik: Tung Tung hält den Schläger in S03 und S10 in der Hand, benutzt ihn nie, gestikuliert nur mit der freien Hand?
- [ ] Rüstung erkennbar als die (jetzt rostige) Rüstung aus Folge 2, ohne Wappen; in S06–S08 wirklich nur Augen und Sneaker sichtbar?
- [ ] Kein Blut, keine Verletzungen, niemand wird geschlagen; Tralalero blinzelt in S08 sichtbar unverletzt?
- [ ] S03 wirklich still (keine Musik), Gag kommt an?
- [ ] Erzähler gleiche Stimme wie Folge 1–11, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Rost-Helm als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei der KLONG-Serie und beim PLATSCH.
