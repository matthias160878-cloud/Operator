# Postproduktion – Tralaleros Rache, Folge 5: Das Katapult (Staffelfinale)

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
| 7 | S07.mp4 | 4 s | 0:24 |
| 8 | S08.mp4 | 5 s | 0:28 |
| 9 | S09.mp4 | 3 s | 0:33 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. S01: Den Moment nehmen, in dem das Katapult **schon im Bild** ist – der Hook muss in Frame 1 sitzen.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie in allen Folgen: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–4) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Holzknarzen, Seil-Twang, Slide-Whistle, Blätterregen, Rutsch-Quietschen, Platsch). Für S10 **dasselbe Rutsch-SFX wie in Folge 1** verwenden (Callback).
8. Effekte sparsam: Zoom-Punch bei S01 und S04, Wackeln bei S06, „Plattenkratzer“-Freeze (3 Frames) am Anfang von S10 optional.
9. Serien-Loop prüfen: Ende von S11 → Anfang von **Folge 1, S01** müssen ineinander übergehen. Kein Fade am Ende.
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
  - **Bananengelb** in S08–S10 als Signalfarbe leicht anheben (Qualifier), exakt wie die Schale in Folge 1.
  - S07–S08 (Rettung/Versöhnung) minimal wärmer, S10–S11 zurück zum neutralen Serien-Look.
  - Katapult-Holz und Tung-Tung-Holz bewusst unterschiedlich lassen (Katapult dunkler, verwittert).
  - Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S01 (0,5–1 s, kein eigener Shot, Hook bleibt): „TRALALEROS RACHE – Folge 5: Das Katapult · STAFFELFINALE“, gleiche Comic-Schrift wie Folge 1.
- **Pfeil-Gags:** S02 gestrichelte Ziel-Flugbahn nach vorn (Comic-Linie); S04 dieselbe Linie knickt senkrecht nach oben ab; S09 Pfeil auf die Schale „OH NEIN“.
- **VFX:** S04 Speedlines nach oben; S07 kleine Herzchen beim Auffangen optional; S10 Speedlines/Blätterpartikel.
- **Staffel-Ende:** In den letzten 0,5 s von S11 kleine Einblendung „Staffel 2 – in Planung“ (nicht über den Loop-Übergang hinaus).
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Ist das Katapult mit Tralalero in der **ersten Sekunde** im Bild?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Katapult in S01/S02/S04 gleich (Referenz 7), keine Symbole oder Schrift darauf?
- [ ] Tung Tung in S03 **mit** Schläger, in S06–S09 **ohne** Schläger in der Hand (lehnt am Baum)?
- [ ] Bananenschale knallgelb wie in Folge 1, in S09 und S10 an derselben Stelle?
- [ ] Kein Blut, keine Verletzungen, niemand wird geschlagen; Hängen, Fallen und Auffangen wirken weich?
- [ ] Gag-Timing: Pause vor „unkonventionell“, Ruhe in S08 nicht zu kurz?
- [ ] Erzähler gleiche Stimme wie Folge 1–4, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung beim Abschuss.
