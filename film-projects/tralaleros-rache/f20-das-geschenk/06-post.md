# Postproduktion – Tralaleros Rache, Folge 20: Das Geschenk

Voraussetzung: Alle Clips liegen als `clips/S01.mp4` … `clips/S11.mp4` vor (Status: `edit/clips-checklist.md`; nach dem Ablegen Build-Skript erneut ausführen). Projekt: 1080×1920, 24 fps, 45 s.

## Schnittliste (für jeden Weg gleich)

| # | Clip | Dauer | Start |
|---|---|---|---|
| 1 | S01.mp4 | 4 s | 0:00 |
| 2 | S02.mp4 | 4 s | 0:04 |
| 3 | S03.mp4 | 4 s | 0:08 |
| 4 | S04.mp4 | 4 s | 0:12 |
| 5 | S05.mp4 | 4 s | 0:16 |
| 6 | S06.mp4 | 3 s | 0:20 |
| 7 | S07.mp4 | 5 s | 0:23 |
| 8 | S08.mp4 | 4 s | 0:28 |
| 9 | S09.mp4 | 4 s | 0:32 |
| 10 | S10.mp4 | 4 s | 0:36 |
| 11 | S11.mp4 | 5 s | 0:40 |

Kling liefert meist 5-s-Clips: auf die Dauer kürzen und den **besten Teil** nehmen. Nur harte Schnitte, keine Überblendungen, auch nicht im Rührungsmoment. S01 so trimmen, dass die Hände schon im **ersten Frame** in der Box sind (Hook) und das Wackeln der verschnürten Box am Ende drin ist. S06 so trimmen, dass die Figur spätestens bei 1 s zu sehen ist. S08: das BOING bei ca. 2–2,5 s, vorher muss das „falsch herum“ gut zu sehen sein. S09: Aufprall im ersten Drittel, die hochgehaltene Figur danach mindestens 1,5 s stehen lassen.

## 1. CapCut (Handy) – empfohlener erster Weg

1. Neues Projekt → alle 11 Clips **in der Reihenfolge S01 → S11** importieren.
2. Seitenverhältnis 9:16, Bildrate 24 fps (Export-Einstellungen).
3. Jeden Clip auf die Dauer aus der Tabelle trimmen.
4. Untertitel: **Text → Untertitel importieren / Captions → Import** → `edit/subtitles.srt` (vorher aufs Handy übertragen). Ohne SRT-Import: „Automatische Untertitel“ auf die Erzählerspur und mit der SRT abgleichen.
5. Untertitel-Stil wie in den bisherigen Staffeln: fette weiße Schrift, schwarze Kontur, über der Plattform-UI-Zone (nicht in den untersten ~20 %). Auf Schnee die Kontur ggf. dicker.
6. Audio: Erzähler-MP3 (TTS aus `04-voiceover.txt`, gleiche Stimme wie Folge 1–19) und Musik importieren; Clip-Ton ~30 %, Musik ~20 % unter dem Erzähler.
7. SFX aus `05-sound.md` aus der CapCut-Soundbibliothek ergänzen (Feder-Quietschen, Deckel-Plopp, Wackel-Boing, Schnee-Stapfen, Glitzer-Bling, Plattenkratzer, Papier-Knistern, Schniefen, BOING, Schnee-WUSCH, Schnee-PUFF, maniakales Lachen).
8. Effekte sparsam: Zoom-Punch und kurzer Shake auf das BOING in S08; in S07 höchstens ein leichter warmer Filter (Wärme +10), **keine** Herzchen-Sticker, der Moment soll ehrlich bleiben. Speedlines beim Flug in S08 nur, falls Kling ihn zu langsam macht.
9. Serien-Loop prüfen: Ende von S11 → Anfang von Folge 1, S01 müssen ineinander übergehen. Kein Fade am Ende.
10. Export: 1080p, 24 fps (oder 30 fps, falls die Plattform es verlangt), höchste Bitrate.

## 2. Premiere Pro

- Sequenz 1080×1920, 24 fps → **Datei → Importieren → `edit/timeline.edl`**.
- Offline-Clips markieren → **Medien verknüpfen** → `clips/S01.mp4` wählen, der Rest wird automatisch gefunden.
- `edit/subtitles.srt` importieren und auf die Sequenz ziehen (Untertitelspur).
- S08: kurze Speed-Ramp direkt nach dem BOING (100 % → 60 % → 100 %, Optical Flow). Essential Sound: Dialog für den Erzähler, Musik mit Ducking.

## 3. DaVinci Resolve

- **Datei → Importieren → Timeline → `edit/timeline.fcpxml`** (oder EDL), Medien aus `clips/` verknüpfen; SRT über den Media Pool.
- Color-Grading (Winter-Look der Staffel 4 auf Basis von Folge 1):
  - Schnee **neutral weiß mit leichtem Blaustich**, nie grau oder gelblich; Highlights runter, damit der Pulverschnee in S08/S09 Struktur behält.
  - **Mützen- und Schleifen-Rot**, **Box-Grün** und **Sneaker-Blau** per Qualifier über alle Shots angleichen. Das Blau der Mini-Sneaker an der Figur (S06, S07, S09, S11) auf das Blau von Tralaleros Sneakern matchen.
  - **S07 ist der einzige warme Shot:** Lichter leicht golden, Mitten weich, Schneeflocken als goldene Glanzpunkte; Hautton bzw. Haiblau dabei nicht ins Grüne kippen lassen. Harter Schnitt zurück ins kalte Blau-Weiß in S08 (Kontrast = Pointe).
  - Holzfigur und Tung Tung auf denselben hellen Holzton bringen (Referenz 22 + Referenz 2 laden, „Shot Match“).
  - Referenz 18 und das Folge-1-Still als Referenz für den Wald.

## 4. Final Cut Pro

- **Ablage → Importieren → XML → `edit/timeline.fcpxml`**; fehlende Medien „neu verbinden“ → `clips/`.
- SRT: Ablage → Importieren → Untertitel. Speed-Ramp in S08 über „Retiming → Geschwindigkeitsrampe“.

## 5. After Effects (optional)

- **Titel-Overlay** in S02 (0,5–1 s, kein eigener Shot, der Hook S01 bleibt frei): „TRALALEROS RACHE – Staffel 4 · Folge 20: Das Geschenk“, gleiche Comic-Schrift wie bisher.
- **Pfeil-Gags:** S02 Pfeil auf die zuckende Box „HARMLOS“; S08 gestrichelter Pfeil von der Box-Öffnung zu Tralalero „FALSCH HERUM“.
- **Staffelfinale-Karte (Overlay in S11, letzte 1,5 s):** kleine Ecke oben „ENDE STAFFEL 4“, dezent, damit der Loop-Übergang zu Folge 1 nicht stört. Alternativ nur in der Plattform-Version ohne Loop.
- **VFX:** S08 Pulverschnee-Partikel und ein Feder-Motion-Blur, falls Kling die Feder verschmiert; S09 ein kleiner Glitzer-Funke an der hochgehaltenen Figur; S07 ein paar zusätzliche goldene Schneeflocken im Lichtstrahl.
- Als `.mov` mit Alpha rendern oder per Dynamic Link nach Premiere.

## 6. LumaFusion (iPad/iPhone)

- Projekt 9:16, 24 fps → `edit/timeline.edl` importieren oder Clips manuell nach der Tabelle einfügen und trimmen.
- Untertitel per SRT-Import (falls verfügbar) oder Titelspur; Audio wie bei CapCut; Speed-Ramp in S08 über den Clip-Speed-Editor.

## 7. Frame.io – Review-Runde

- [ ] Hook: Feder und Schnee in der Box, Deckel und Schleife in der **ersten Sekunde** erkennbar, Box wackelt?
- [ ] Figuren konsistent mit Folge 1 (Hai-Farbe, **blaue Sneaker ohne Logos**, Tung Tungs Holzgesicht)?
- [ ] Pudelmütze rot mit weißem Bommel (wie Folge 17), ohne Logo/Schrift, in allen Tralalero-Shots gleich; im Loop-Shot schief?
- [ ] Geschenkbox: einfarbig dunkelgrün, rote Satinschleife, **keine Muster, Sterne, Tannenbäume, Figuren oder Schrift**; in S01–S05, S08, S10 dieselbe?
- [ ] Kleines Päckchen: Packpapier, rot-weiße Kordel, Kiefernzweig, ohne Aufdruck?
- [ ] Holzfigur konsistent mit Referenz 22 (helles Holz, nur die Sneaker blau) in S06, S07, S09, S11, kein lebendiger Mini-Hai?
- [ ] Schläger-Logik: S03 in Tung Tungs Hand, ab S04 unter dem Arm, nie zwei Schläger, niemand wird geschlagen?
- [ ] BOING: Die Feder trifft **niemanden**, nur der weiche Schnee pustet; Tralalero landet sichtbar unverletzt im weichen Haufen?
- [ ] Figur in S09 und S11 unversehrt?
- [ ] Keine religiösen Symbole, keine bekannten Weihnachtsfiguren, keine Weihnachtslieder in der Musik?
- [ ] Kein Blut, keine Verletzungen?
- [ ] Erzähler gleiche Stimme wie Folge 1–19, Untertitel synchron, auf Schnee lesbar, nicht von der UI verdeckt?
- [ ] Loop: Übergang S11 → Folge 1, S01 ohne sichtbaren Sprung (Schnee, Mütze und Figur als bewusster Gag)?
- [ ] Lautheit ca. -14 LUFS, keine Übersteuerung bei BOING, WUSCH und Lachen.
