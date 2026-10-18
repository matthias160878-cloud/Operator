# Tralaleros Rache – Folge 21: Die Blüte (Staffel 5, Folge 1 – Auftakt der Frühlings-Staffel)

Zum Frühlingsstart stellt Tralalero Tung Tung Sahur einen Rasensprenger in den Weg – doch der Holzkopf erblüht unter der Dusche zum Baum, und seine Pollenwolke lässt Tralalero so gewaltig niesen, dass er rückwärts in die Matschpfütze rollt.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen; danach steht in jedem `image_prompt` ein fester Frühlings-Zusatzsatz (S01 in der festen Hook-Variante „the last patches of snow melting away“). Ab dem Aufblühen (S05) trägt Tung Tung die feste Zusatzbeschreibung „with fresh light-green leaves and pink-and-white blossoms sprouting from his head and shoulders“. Der Schläger bleibt in jedem Shot „holding a large wooden baseball bat“ und wird nie benutzt (per Skript geprüft). Referenzbilder 1–3 aus Folge 1, plus neue Referenz 23 (Tung Tung blühend). Rasensprenger und Pollenwolke haben feste englische Beschreibungen im Treatment.

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Blüten- und Schläger-Regel, Requisiten, Frühlings-Look, Dreiakt-Struktur, Referenzbilder (1–3 aus Folge 1 + Prompt für Referenz 23) |
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

1. **Referenzbilder:** 1–3 aus Folge 1 wiederverwenden; Referenz 23 (Tung Tung blühend) mit dem Prompt aus `01-treatment.md` erzeugen – mit Referenz 2 als Bildreferenz. Referenz 23 kann die ganze Frühlings-Staffel tragen.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 3 für alle Shots; Referenz 2 für S03/S04, Referenz 23 für S05–S07 und S10; Referenz 1 für alle Shots mit Tralalero).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f21-die-bluete`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–20 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
