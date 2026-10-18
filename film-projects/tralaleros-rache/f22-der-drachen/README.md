# Tralaleros Rache – Folge 22: Der Drachen (Staffel 5, Folge 2)

Tralalero will an einem riesigen Lenkdrachen im Sturzflug über Tung Tung Sahur herfallen – doch die Schnur landet in Tung Tungs Hand, der begeistert Drachen steigen lässt, bis sie reißt und Tralalero in die Pfütze segelt.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen, dazu der feste Frühlings-Satz der Staffel 5. Tung Tung trägt den Schläger die ganze Folge auf dem Rücken („his large wooden baseball bat strapped across his back“, wie Folge 7) und keine Blüten. Drachen, Klettergurt, Fliegerbrille, Schnur und Blütenbaum haben feste englische Beschreibungen im Treatment. Referenzbilder 1–3 aus Folge 1 und neue Referenz 24 (Tralalero am Drachen).

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Schläger-Variante, Requisiten, Frühlings-Look, Dreiakt-Struktur, Referenzbilder (1–3 + Prompt für Referenz 24) |
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

1. **Referenzbilder:** 1–3 aus Folge 1 wiederverwenden; Referenz 24 (Tralalero am Drachen) mit dem Prompt aus `01-treatment.md` erzeugen (Referenz 1 als Bildreferenz).
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 24 zusätzlich für S01–S03, S05, S06, S08, S09, S11).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f22-der-drachen`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–21 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
