# Postproduktion – Tralaleros Rache, Folge 24: Die Riesenblase

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 3 s | 0:12 |
| 5 | S05.mp4 | 5 s | 0:15 |
| 6 | S06.mp4 | 4 s | 0:20 |
| 7 | S07.mp4 | 3 s | 0:24 |
| 8 | S08.mp4 | 4 s | 0:27 |
| 9 | S09.mp4 | 5 s | 0:31 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass die Blase **im ersten Frame** schon wächst (Hook). S03: das Abheben muss drin sein. S06: Platzen und Landung beide drin. S07: das TONK früh (ca. 0,5 s). S09: Blick in die Kamera, dann PLOPP bei ca. 3 s, PLATSCH direkt danach.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie bisher: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–23) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Kurbel-Quietschen, Blasebalg, Blasen-Schlupp, Sieges-Tröte, Glitzer, Holz-TONK, gedämpftes Trommeln, PLOPP, PLATSCH, Mini-Blasen, maniakales Lachen).
8. Effekte sparsam: in S08 Audio-Effekt „Unterwasser/gedämpft“ auf Tralaleros Trommeln; Zoom-Punch auf das TONK in S07; in S09 0,3 s Freeze vor dem PLOPP; Glitzer-Sticker beim Platzen in S06, falls Kling zu wenig Tröpfchen liefert.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- S05: leichte Zeitlupe (80 %, Optical Flow) für das Schweben; S09: Halt-Frame vor dem Platzen. Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Frühlings-Look der Staffel 5 auf Basis von Folge 1):
  - Grün **frisch und hell** (Hellgrün statt sattem Sommergrün), Wildblumen weiß/gelb klar, Blütenblätter zartrosa – nicht übersättigen.
  - **Blasen lesbar halten:** Highlights auf der Blasenoberfläche nicht ausfressen lassen, das Regenbogen-Schillern (Magenta/Cyan/Gold) per Sat-vs-Lum leicht anheben; Hintergrund hinter den Blasen etwas dunkler als die Blase.
  - **Sneaker-Blau** und Hai-Blaugrau per Qualifier über alle Shots angleichen; Tung Tungs Holzton in S03, S05, S06, S10 gleich halten.
  - S05 Gegenlicht warm-golden, S09 Matsch satt braun (Kontrast zum Schillern).
  - Referenz 26 (Maschine) und Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Zeitlupe in S05 über „Retiming → Langsam“.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 5 · Folge 24: Die Riesenblase“, gleiche Comic-Schrift wie bisher.
- **Pfeil-Gags:** S01 Pfeil auf die Blase „AUTO-GRÖSSE“; S06 Pfeil auf Tung Tung „5 ★“; S09 gestrichelter Pfeil von der Blase in die Pfütze.
- **VFX:** S06 zusätzliche Glitzer-Partikel beim Platzen; S08 dezente Lowpass-„Glaswand“-Spiegelung, falls Kling die Blase zu matt rendert; S09 Matsch-Spritzer-Partikel; S10 ein paar zusätzliche Mini-Blasen.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut; Zeitlupe in S05 über den Clip-Speed-Editor.

## 7. Frame.io – Review-Runde

- [ ] Hook: wachsende Blase mit Ton in der **ersten Sekunde**?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Schläger **immer auf Tung Tungs Rücken** – nie in der Hand, nie zwei Schläger, niemand wird geschlagen?
- [ ] Tung Tung trägt **keine** Blüten (Blütenblätter nur in der Luft)?
- [ ] Maschine konsistent mit Referenz 26 (Holzkiste, Eisenkurbel, Leder-Blasebalg, Drahtring, Eimer) – **keine Logos, keine Schrift**, keine Seifenmarke?
- [ ] Blasen transparent und schillernd, Figuren darin klar erkennbar?
- [ ] Der Tritt trifft nur die Maschine; Tung Tung landet weich, Tralalero sitzt unverletzt im Matsch – kein Blut, keine Verletzungen?
- [ ] Frühlings-Look in allen Shots gleich (Hellgrün, Wildblumen, Blütenblätter)?
- [ ] Erzähler gleiche Stimme wie Folge 1–23, Untertitel synchron, nicht von der UI verdeckt; „Die Natur ist grausam.“ erst nach dem PLATSCH?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Matsch und Schaum-Klecks als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei TONK, PLATSCH und Lachen.
