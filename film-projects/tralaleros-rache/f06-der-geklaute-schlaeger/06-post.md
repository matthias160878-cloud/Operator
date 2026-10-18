# Postproduktion – Tralaleros Rache, Folge 6: Der geklaute Schläger

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 4 s | 0:12 |
| 5 | S05.mp4 | 5 s | 0:16 |
| 6 | S06.mp4 | 4 s | 0:21 |
| 7 | S07.mp4 | 3 s | 0:25 |
| 8 | S08.mp4 | 4 s | 0:28 |
| 9 | S09.mp4 | 4 s | 0:32 |
| 10 | S10.mp4 | 5 s | 0:36 |
| 11 | S11.mp4 | 4 s | 0:41 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen, den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen. In S01 so trimmen, dass der **erste Schnarcher samt Blätter-Stoß im ersten Frame** beginnt (Hook). S08 so trimmen, dass der Schläger am Clipende ruhig am Stamm lehnt (Anschluss zu S09).

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie Staffel 1: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %).
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–5) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Schnarchen, Psst, Kichern, Hubschrauber-Wusch, Fallpfeife, Platsch, Holz-Klack, Gähnen).
8. Effekte sparsam: kleiner Zoom-Punch auf jeden Schnarcher in S01, **Speed-Ramp** (100 % → 130 %) in S05 für die Beschleunigung, Shake auf den PLATSCH in S07, Herzchen-Sticker um Tung Tung in S10.
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
  - **Schläger-Holzton angleichen:** Der Schläger muss in allen Shots (am Baum, in Tralaleros Flossen, in der Luft, im Arm) dieselbe hellbraune Farbe wie Tung Tung haben – per Qualifier matchen.
  - **Bemooster Baum** in S01–S03 und S08–S10 gleich grün/braun halten (Shot Match auf S01).
  - S10 minimal wärmer (Kuschel-Moment), S07 Matsch sattbraun, nicht grau.
  - Folge-1-Still als Referenz laden und „Shot Match“ nutzen.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel.

## 5. After Effects (optional)

- **Titel-Overlay** in S01 (0,5–1 s, kein eigener Shot, Hook bleibt): „TRALALEROS RACHE – Staffel 2 · Folge 6: Der geklaute Schläger“, gleiche Comic-Schrift wie Staffel 1, mit kleinem „STAFFEL 2“-Stempel.
- **Pfeil-Gags:** S02 Pfeil auf die Sneaker „LAUTLOS“; S03 Pfeil auf den Schläger „MEINS“; S08 Pfeil auf den gelandeten Schläger „ZURÜCK“.
- **VFX:** S01 „Z“-Schnarch-Grafiken + extra Blatt-Partikel, falls Kling zu wenig Blätter liefert; S05/S06 Speedlines und Rotor-Motion-Blur; S07 zusätzliche Matsch-Partikel beim PLATSCH.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut.

## 7. Frame.io – Review-Runde

- [ ] Hook: Schnarchen + wegfliegende Blätter in der **ersten Sekunde** sichtbar und hörbar?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Schläger-Logik stimmt: S01/S02 am Baum, S03–S07 bei Tralalero, S08 in der Luft → am Baum, S09 am Baum, S10 im Arm – nie doppelt, nie verschwunden?
- [ ] Nichts sieht nach Schlagen aus: Schwung in S04 geht ins Leere, in S08 landet der Schläger **neben** Tung Tung?
- [ ] Kein Blut, keine Verletzungen; Tralalero hebt in S07 sichtbar unverletzt den Kopf?
- [ ] Hubschrauber-Phase (S04–S06) liest sich als eine durchgehende Beschleunigung?
- [ ] Erzähler gleiche Stimme wie Folge 1–5, Untertitel synchron, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung beim Schnarchen und PLATSCH.
