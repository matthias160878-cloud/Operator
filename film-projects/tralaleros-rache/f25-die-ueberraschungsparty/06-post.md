# Postproduktion – Tralaleros Rache, Folge 25: Die Überraschungsparty

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 5 s | 0:08 |
| 4 | S04.mp4 | 5 s | 0:13 |
| 5 | S05.mp4 | 4 s | 0:18 |
| 6 | S06.mp4 | 4 s | 0:22 |
| 7 | S07.mp4 | 4 s | 0:26 |
| 8 | S08.mp4 | 4 s | 0:30 |
| 9 | S09.mp4 | 3 s | 0:34 |
| 10 | S10.mp4 | 3 s | 0:37 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass Tung Tung **im ersten Frame** schon hektisch knotet (Hook). S02: Augen-Verengen und GLUPP beide drin. S03: endet genau im Erstarren. S07: das Fallen der Schale muss klar zu sehen sein (Setup für S08). S08: Rutschen am Anfang, Zeitlupe in der Mitte. S10: Schreck kurz (≤ 0,5 s), dann Lachen und Wurf.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie bisher: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–24) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Blätterrascheln, GLUPP, Schleichschritte, Platten-Kratzer, Glitzer, Party-Popper, Schniefen, Rutsch-Quietschen, Fallpfeifen, PLATSCH, maniakales Lachen).
8. Effekte sparsam: in S01 leichte Vignette (Spion-Gefühl); in S03 0,3 s Freeze beim Erstarren; **S08 Geschwindigkeit → Kurve „Montage“/eigene Kurve** (Zeitlupe in der Mitte, falls Kling sie nicht liefert); Zoom-Punch auf den PLATSCH in S09.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- S08: Zeit-Neuzuordnung (Time Remapping) mit Optical Flow für die Zeitlupe im Bogen; S03: Halt-Frame beim Erstarren. Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Frühlings-Look der Staffel 5 auf Basis von Folge 1):
  - Grün **frisch und hell**, Wildblumen weiß/gelb klar, Blütenrosa zart – nicht übersättigen.
  - **S01–S03 (Verdacht):** einen Hauch kühler und dunkler, leichte Vignette – Spionage-Stimmung.
  - **S04–S07 (Party):** wärmer, heller, leichtes Glühen in den Highlights (Gegenlicht in S04) – die Lichtung soll „leuchten“. Party-Farben (Wimpel, Ballons, Magnet-Rot, Drachen-Rot-Gelb) per Qualifier leicht anheben.
  - **Bananengelb** in S03, S07, S08 als Signalfarbe sichern (Hue-vs-Sat), damit die Schale sofort auffällt.
  - **Sneaker-Blau** und Hai-Blaugrau per Qualifier über alle Shots angleichen; Tung Tungs Holzton in S01, S06–S08, S10 gleich halten.
  - S09 Matsch satt braun; S11 wieder neutral wie Folge 1, S01 (Loop).
  - Referenz 27 (Party-Lichtung) und Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Zeitlupe in S08 über „Retiming → Langsam“ bzw. Bereichs-Retiming.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 5 · Folge 25: Die Überraschungsparty“, gleiche Comic-Schrift wie bisher, dazu ein kleiner Sticker „JUBILÄUMSFOLGE 25“. Schrift **nur als Overlay im Schnitt**, nie im generierten Bild.
- **Pfeil-Gags:** S02 Pfeil auf Tung Tung „FALLE?“; S05 kleine Labels an den Erinnerungsstücken „F12“, „F9“, „F20“ (Lower-Third-Stil, je 0,5 s); S07 gestrichelter Pfeil auf die fallende Schale „…“.
- **Endkarte (S11, letzte 1,5 s, optional):** „ENDE STAFFEL 5 – STAFFEL 6: SOMMER“ – klein und unten, damit der Loop nicht stört.
- **VFX:** S06 zusätzliche Blütenblätter-Partikel, falls Kling zu wenig Konfetti liefert; S07 Tränen-Glanz verstärken; S09 Matsch-Spritzer-Partikel.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut; Zeitlupe in S08 über den Clip-Speed-Editor.

## 7. Frame.io – Review-Runde

- [ ] Hook: Spion-POV durch Blätter mit Tung Tung in Bewegung in der **ersten Sekunde**?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Schläger **immer auf Tung Tungs Rücken** – nie in der Hand, nie zwei Schläger, niemand wird geschlagen?
- [ ] Tung Tung trägt **keine** Blüten (Blütenblätter nur in der Luft/als Konfetti)?
- [ ] Erinnerungsstücke erkennbar und konsistent mit den alten Folgen: roter Hufeisenmagnet (F12), dunkelroter Holzbumerang (F9), rot-gelber Drachen im Baum (F22), bunte Ballons (F11), geschnitzte Holzfigur mit blauen Mini-Sneakern (F20)?
- [ ] Torte **ohne Kerzen, ohne Feuer**, Zuckerguss-Hai obendrauf?
- [ ] **Keine Schrift im Bild** (Schild nur mit gemaltem Hai, Wimpel ohne Buchstaben), keine Logos?
- [ ] Die Bananenschale fällt in S07 sichtbar vor seine Füße – der Gag in S08 ist nachvollziehbar?
- [ ] Der Flug berührt die Party nicht; Tralalero sitzt unverletzt im Matsch – kein Blut, keine Verletzungen?
- [ ] Frühlings-Look in allen Shots gleich; Lichtung in S04–S10 gleich aufgebaut (Referenz 27)?
- [ ] Erzähler gleiche Stimme wie Folge 1–24, Untertitel synchron, nicht von der UI verdeckt; „Die Natur ist grausam.“ erst nach dem PLATSCH?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Hut und Torte als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei Party-Popper, PLATSCH und Lachen.
