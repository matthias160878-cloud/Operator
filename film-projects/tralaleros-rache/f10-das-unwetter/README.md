# Tralaleros Rache – Folge 10: Das Unwetter (Staffel 2, Folge 5 – Staffelfinale)

Ein Unwetter flutet den Wald, Tralalero rettet ausgerechnet den davontreibenden Tung Tung Sahur – und als der ihm zum Dank den Schläger schenkt, wirbelt ihn genau dieser Schläger wie einen Hubschrauber mitten in den See.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen, ergänzt um feste Wetter-Sätze (Regen, See, Sonne danach). Tung Tungs Schläger-Teilsatz ist in den Shots, in denen Tralalero den Schläger hat oder er durch die Luft fliegt, durch „his hands empty“ ersetzt (Tabelle in `01-treatment.md`). Referenzbilder 1–3 aus Folge 1, plus neue Ortsreferenz 12 (der überflutete Waldweg im Regen).

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Schläger-Logik, Wetter-Sätze, Look, Dreiakt-Struktur, Referenzbilder (1–3 aus Folge 1 + Prompt für Referenz 12) |
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

1. **Referenzbilder:** 1–3 aus Folge 1 wiederverwenden; Referenz 12 (überfluteter Waldweg im Regen) mit dem Prompt aus `01-treatment.md` erzeugen.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 12 zusätzlich für S02–S06; für S07–S10 als Kompositions-Referenz).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f10-das-unwetter`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–9 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
