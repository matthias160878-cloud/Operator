# Tralaleros Rache – Folge 15: Der Roboter (Staffel 3, Folge 5 – Staffelfinale)

Im Staffelfinale steuert Tralalero einen vier Meter hohen Schrott-Roboter aus all seinen gescheiterten Plänen auf Tung Tung Sahur zu – doch ein falscher Hebel verwandelt den Angriff in den Zwillingstanz aus Folge 4, und beim großen Finale fällt der Roboter Teil für Teil auseinander, bis Tralalero in der Matschpfütze landet.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen; Tung Tung hält den Schläger in S03–S05 (beim Tanz nur als Requisite) und klemmt ihn in S10 zum Applaudieren unter den Arm. Der Schrott-Roboter hat eine feste englische Beschreibung aus Kern + fünf Anbauteilen (Fass F4, Katapult F5, Bumerang F9, Ballons F11, Magnet + Rost-Helm F12), die beim Zerfall Baustein für Baustein wegfallen (Tabelle in `01-treatment.md`). Referenzbilder 1–3 aus Folge 1, Bauteil-Referenzen 4, 6, 7, 11, 13, 14, 15, plus neue Referenz 17 (der Schrott-Roboter).

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Schläger-Regel, Roboter-Beschreibung + Zerfalls-Zustände, Look, Dreiakt-Struktur, Referenzbilder (inkl. Prompt für Referenz 17) |
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

1. **Referenzbilder:** 1–3 aus Folge 1 wiederverwenden; Referenz 17 (Schrott-Roboter) mit dem Prompt aus `01-treatment.md` erzeugen, dabei die Bauteil-Referenzen 6, 7, 11, 13, 14 mitgeben.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 17 für S01–S09; für S07–S09 zusätzlich das Endbild des Vor-Clips, damit abgefallene Teile nicht zurückkehren).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f15-der-roboter`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–14 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
