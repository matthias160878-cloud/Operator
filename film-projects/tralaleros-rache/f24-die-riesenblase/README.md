# Tralaleros Rache – Folge 24: Die Riesenblase (Staffel 5, Folge 4)

Tralalero will Tung Tung mit einer selbstgebauten Seifenblasen-Maschine wegschweben lassen – doch Tung Tung genießt den Rundflug, landet sanft, und nach einem Wut-Tritt gegen die Maschine schwebt Tralalero selbst davon, genau bis über die Matschpfütze.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen, dazu der feste Frühlings-Satz der Staffel 5. Tung Tungs Schläger-Teilsatz ist in der ganzen Folge durch „his large wooden baseball bat strapped across his back“ ersetzt (wie F7/F22/F23). Referenzbilder 1–3 aus Folge 1 und neue Referenz 26 (die Seifenblasen-Maschine). Maschine, Riesenblase, kleiner Drahtring und Schaum-Klecks haben feste englische Beschreibungen im Treatment.

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Schläger-Variante, Requisiten, Frühlings-Look, Dreiakt-Struktur, Referenzbilder (1–3 + Prompt für Referenz 26) |
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

1. **Referenzbilder:** 1–3 aus Folge 1 wiederverwenden; Referenz 26 (Seifenblasen-Maschine) mit dem Prompt aus `01-treatment.md` erzeugen.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 26 zusätzlich für S01–S04, S06–S08).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f24-die-riesenblase`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–23 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
