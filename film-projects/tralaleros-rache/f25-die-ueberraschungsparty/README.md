# Tralaleros Rache – Folge 25: Die Überraschungsparty (Staffel 5, Folge 5 – Staffelfinale, Jubiläumsfolge)

Tralalero hält Tung Tungs heimliche Vorbereitungen für eine Falle und schleicht mit einer Bananenschale heran – doch es ist eine Überraschungsparty für ihn, und als er gerührt zur Umarmung ansetzt, tritt er auf seine eigene Schale und fliegt über die Party hinweg in die Matschpfütze.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen, dazu der feste Frühlings-Satz aus Folge 21 und eine neue feste Lichtungs-Beschreibung. Tung Tungs Schläger-Teilsatz ist in der ganzen Folge durch „his large wooden baseball bat strapped across his back“ ersetzt (wie F7/F22–F24), keine Blüten. Die Erinnerungsstücke (Bananenschale F1, Bumerang F9, Ballons F11, Magnet F12, Holzfigur F20, Drachen F22, Blatt-Partyhut F8) stehen mit ihren festen englischen Beschreibungen im Treatment. Referenzbilder 1–3, 11, 13, 14, 22, 24 und neue Referenz 27 (Party-Lichtung).

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Schläger-Variante, Requisiten/Erinnerungsstücke, Lichtung, Frühlings-Look, Dreiakt-Struktur, Referenzbilder (+ Prompt für Referenz 27) |
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

1. **Referenzbilder:** 1–3, 11, 14, 22 (und 13/24 als Farbreferenz) wiederverwenden; Referenz 27 (Party-Lichtung mit Erinnerungsstücken) mit dem Prompt aus `01-treatment.md` erzeugen.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 27 zusätzlich für S04–S08, S10; Referenz 22 für S05 ohne Referenz 1).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f25-die-ueberraschungsparty`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–24 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
