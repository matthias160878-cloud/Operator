# Postproduktion – Tralaleros Rache, Folge 10: Das Unwetter

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 3 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:03 |
| 3 | S03.mp4 | 4 s | 0:07 |
| 4 | S04.mp4 | 3 s | 0:11 |
| 5 | S05.mp4 | 4 s | 0:14 |
| 6 | S06.mp4 | 4 s | 0:18 |
| 7 | S07.mp4 | 5 s | 0:22 |
| 8 | S08.mp4 | 5 s | 0:27 |
| 9 | S09.mp4 | 4 s | 0:32 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01 so trimmen, dass der **Blitz im ersten Frame** steht (Hook). S06 so trimmen, dass der Regen am Clip-Ende wirklich aufgehört hat (Anschluss an die Sonne in S07). S09 so trimmen, dass der PLATSCH bei ca. 2 s liegt.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Staffel 1/2: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–9) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Blitz, Donner, Starkregen, Planschen, Uhr-Ticken, Eintauch-Platsch, Vogelstimmen, Glitzer, Rotor-Whoosh, Platsch, Holz-Klack, maniakales Lachen).
8. Effekte sparsam: **weißer Flash-Frame** (1–2 Frames) + Shake auf den Blitz in S01; Speed-Ramp (100 % → 40 % → 100 %) auf den Hai-Sprung in S05; leichter Glow/„Sonnenstrahlen“-Effekt in S07; Shake auf den PLATSCH in S09.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Serien-Look wie Folge 1, diesmal zwei Hälften):
  - **S01–S06 Gewitter:** kühles Grau-Blau in den Tiefen, Grün leicht entsättigt, aber nicht düster – Tralaleros Blau und die Sneaker bleiben knallig. Alle Regen-Shots per „Shot Match“ auf S02 angleichen.
  - **S07–S11 Sonne danach:** warme goldene Highlights, Grün voll gesättigt, leichter Glow auf nassen Flächen – wärmer als jede bisherige Folge (Finale-Gefühl).
  - **Wasser:** See in allen Shots dasselbe Braun (Matsch), nicht blau oder klar.
  - **Harzträne (S07):** Gold-Ton anheben, damit sie wie in Folge 3 leuchtet.
  - S11 auf Folge 1, S01 matchen (Loop) – Folge-1-Still als Referenz laden.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot – der Blitz-Hook bleibt frei): „TRALALEROS RACHE – Staffel 2 · Folge 10: Das Unwetter · STAFFELFINALE“, gleiche Comic-Schrift wie bisher.
- **Pfeil-Gags:** S04 zwei Pfeile „PLAN“ (Baum) und „FEIND“ (Tung Tung); S07 Pfeil auf den Schläger „GESCHENK?!“.
- **Endkarte** auf den letzten 0,5 s von S11 (klein, oben): „Staffel 3 kommt …“ – nur als Overlay, damit der Loop nicht bricht.
- **VFX:** S01 zusätzlicher Blitz-Glow und Regen-Partikel, falls Kling zu wenig Regen liefert; S05 Wasser-Spritzer an der Rückenflosse; S07 Sonnenstrahlen (Light Rays); S09 extra Wasser-Gischt beim PLATSCH.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Blitz + Donner in der **ersten Sekunde**, Regen setzt schlagartig ein?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Wetter-Logik: S01–S06 Regen, S06 hört er auf, S07–S11 Sonne – kein Shot mit Regen nach S06?
- [ ] See konsistent (gleiche Größe, Farbe, Ufer) von S03 bis S10?
- [ ] Schläger-Logik: S03–S07 bei Tung Tung, S08/S09 bei Tralalero (Tung Tung mit leeren Händen), S10 zurück bei Tung Tung – nie zwei Schläger, nie verschwunden?
- [ ] Sicherheit: Tung Tung immer **auf** dem Wasser, nie untergetaucht; Tralalero schiebt sanft mit der Nase (keine Zähne am Holz); Schläger trifft niemanden; Tralalero taucht in S09 sichtbar unverletzt auf?
- [ ] Kein Blut, keine Verletzungen?
- [ ] Erzähler gleiche Stimme wie Folge 1–9, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei Donner und PLATSCH.
