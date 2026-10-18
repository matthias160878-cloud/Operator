# Tralaleros Rache – Folge 12: Der Magnet (Staffel 3, Folge 2)

Tralalero richtet einen riesigen Hufeisenmagneten auf Tung Tung Sahur – doch der ist aus Holz, und auf MAXIMUM zieht der Magnet stattdessen die verrosteten Reste der Ritterrüstung aus Folge 2 an, bis Tralalero scheppernd in der Matschpfütze landet.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen; Tung Tung hält in jedem Prompt unverändert „holding a large wooden baseball bat“ und benutzt den Schläger nie. Referenzbilder 1–3 aus Folge 1, Referenz 4 (Folge 2) als Stil-Anker für die Rost-Rüstung, plus neue Objektreferenz Referenz 14 (der Hufeisenmagnet).

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Schläger-Regel, Magnet- und Rost-Rüstungs-Beschreibung, Look, Dreiakt-Struktur, Referenzbilder (1–3 aus Folge 1 + Prompt für Referenz 14) |
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

1. **Referenzbilder:** 1–3 aus Folge 1 wiederverwenden (Referenz 4 aus Folge 2 für die Rüstungs-Shots); Referenz 14 (Hufeisenmagnet) mit dem Prompt aus `01-treatment.md` erzeugen.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 14 zusätzlich für S01, S02, S04–S09).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f12-der-magnet`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–11 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
