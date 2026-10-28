# Tralaleros Rache – Folge 26: Der Liegestuhl (Staffel 6, Folge 1 – Auftakt der Sommer-Staffel)

Zum Sommerstart baut Tralalero einen gestreiften Liegestuhl zur Feder-Klappfalle um – doch Tung Tung schläft darin seelenruhig ein, und als Tralalero den klemmenden Mechanismus selbst testet, klappt ihn der Stuhl zum Sandwich zusammen und katapultiert ihn in die Matschpfütze.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen; danach steht in jedem `image_prompt` der feste Sommer-Zusatzsatz „Summer: hot bright midsummer day, …“. Tralalero trägt in jedem Shot dieselbe Sonnenbrille (feste Beschreibung, ab S10 zusätzlich „crooked“). Liegestuhl, Sonnenschirm und Sprungfeder mit Seil haben feste englische Beschreibungen. Schläger: S03–S04 „holding a large wooden baseball bat“, ab S05 „his large wooden baseball bat leaning against the striped beach umbrella“ – per Skript geprüft, kein Prompt widersprüchlich. Referenzbilder 1–3 aus Folge 1, plus neue Referenz 28 (Liegestuhl mit Sonnenschirm im Sommerwald).

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Sonnenbrillen- und Schläger-Regel, Requisiten, Sommer-Look, Dreiakt-Struktur, Referenzbilder (1–3 aus Folge 1 + Prompt für Referenz 28) |
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

1. **Referenzbilder:** 1–3 aus Folge 1 wiederverwenden; Referenz 28 (Liegestuhl mit Sonnenschirm im Sommerwald) mit dem Prompt aus `01-treatment.md` erzeugen – mit Referenz 3 als Bildreferenz. Referenz 28 kann die Sommer-Staffel als Sommerwald-Referenz tragen.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 3 für alle Shots; Referenz 28 für S01–S10; Referenz 1 für alle Shots mit Tralalero; Referenz 2 für S03–S08 und S10).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f26-der-liegestuhl`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–25 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
