# Tralaleros Rache – Folge 17: Der Schlitten (Staffel 4, Folge 2)

Tralalero rast mit dem Holzschlitten auf Tung Tung Sahur zu – doch der hüpft fröhlich hinten auf, segelt nach der Schanze federleicht zu Boden, und Tralalero steckt kopfüber im Schneehaufen.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen, plus fester Winter-Zusatz der Staffel 4 in jedem `image_prompt`. Tung Tungs Schläger-Teilsatz ist auf dem Schlitten und beim Segeln durch „his large wooden baseball bat strapped across his back“ ersetzt (Tabelle in `01-treatment.md`). Referenzbilder 1–3 aus Folge 1, Referenz 18 (verschneiter Wald) aus Folge 16, plus neue Referenz 19 (Holzschlitten). Schlitten, Pudelmütze, Hang, Schanze und Schneehaufen haben feste englische Beschreibungen im Treatment.

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Schläger-Varianten, Requisiten, Winter-Look, Dreiakt-Struktur, Referenzbilder (1–3, 18 + Prompt für Referenz 19) |
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

1. **Referenzbilder:** 1–3 aus Folge 1 und 18 aus Folge 16 wiederverwenden; Referenz 19 (Holzschlitten) mit dem Prompt aus `01-treatment.md` erzeugen.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 19 zusätzlich für S01–S07 und S10).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f17-der-schlitten`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–16 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
