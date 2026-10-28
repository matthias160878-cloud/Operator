# Tralaleros Rache – Folge 20: Das Geschenk (Staffel 4, Folge 5 – Staffelfinale)

Tralalero überreicht Tung Tung Sahur ein Geschenk mit Sprungfeder und Schneeladung – doch Tung Tung hat auch eines für ihn, eine geschnitzte Holzfigur, und öffnet die Falle danach falsch herum.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen, dazu der feste Winter-Satz aus Folge 16 sowie Pudelmütze und Schneehaufen-Satz aus Folge 17. Tung Tungs Schläger-Teilsatz ist beim Überreichen und Öffnen durch „his large wooden baseball bat tucked under one arm“ ersetzt (Tabelle in `01-treatment.md`, per Skript geprüft). Referenzbilder 1–3 aus Folge 1, Referenz 18 (verschneiter Wald, Folge 16) und die neue Referenz 22 (geschnitzte Tralalero-Holzfigur). Geschenkbox, Schleife, Sprungfeder, kleines Päckchen und Holzfigur haben feste englische Beschreibungen im Treatment.

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Mütze, Schläger-Varianten, Requisiten, Winter-Look, Dreiakt-Struktur, Referenzbilder (1–3, 18 + Prompt für Referenz 22) |
| `02-script.md` | Drehbuch mit Erzählertext |
| `03-shotlist.csv` | 11 Shots mit `image_prompt` und Kling-tauglichem `video_prompt` |
| `04-voiceover.txt` | Reiner Erzählertext für TTS |
| `05-sound.md` | Musik-Brief + Generator-Prompt, Sound-Design je Shot |
| `06-post.md` | Schnitt: CapCut zuerst, dann Premiere, Resolve, FCP, After Effects, LumaFusion, Frame.io |
| `edit/timeline.edl` | CMX3600 (Premiere, Resolve, LumaFusion) |
| `edit/timeline.fcpxml` | Final Cut Pro / Resolve |
| `edit/subtitles.srt` | Untertitel aus dem Erzählertext |
| `edit/clips-checklist.md` | Welche Clips noch fehlen |
| `clips/` | Hier kommen die fertigen Clips hin |

## Nächste Schritte

1. **Referenzbilder:** 1–3 aus Folge 1 und 18 aus Folge 16 wiederverwenden; Referenz 22 (Holzfigur) mit dem Prompt aus `01-treatment.md` erzeugen, **ohne** Referenz 1.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 22 zusätzlich für S06–S09 und S11).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann die Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f20-das-geschenk`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–19 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
