# Tralaleros Rache – Folge 11: Die Wasserbomben (Staffel 3, Folge 1)

Tralalero bombardiert Tung Tung Sahur vom Ballonbündel aus mit Wasserbomben – doch der genießt die Dusche, und am Ende platzen Tralaleros Ballons einer nach dem anderen über der Matschpfütze.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen; Tung Tungs Schläger-Teilsatz ist nach dem Abstellen durch „his large wooden baseball bat leaning against a tree nearby“ ersetzt (Tabelle in `01-treatment.md`). Referenzbilder 1–3 aus Folge 1, plus neue Referenz 13 (Tralalero am Ballonbündel mit Wasserbomben-Gürtel).

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Schläger-Varianten, Ballonbündel und Wasserbomben-Gürtel, Look, Dreiakt-Struktur, Referenzbilder (1–3 aus Folge 1 + Prompt für Referenz 13) |
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

1. **Referenzbilder:** 1–3 aus Folge 1 wiederverwenden; Referenz 13 (Tralalero am Ballonbündel) mit dem Prompt aus `01-treatment.md` und Referenz 1 als Bildreferenz erzeugen.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 13 zusätzlich für S01, S02, S05, S07, S08).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f11-die-wasserbomben`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–10 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
