# Tralaleros Rache – Folge 16: Der Schneemann (Staffel 4, Folge 1 – Auftakt der Winter-Staffel)

Als Schneemann getarnt lauert Tralalero auf Tung Tung Sahur – doch der verliebt sich in den Schneemann, schenkt ihm seinen kratzigen Wollschal, und ein einziger Nieser schleudert Tralalero auf die zugefrorene Pfütze, deren Eis genau in der Mitte bricht.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → Folge 1, S01)**

Serienkonsistenz: Figuren-, Wald- und Stilbeschreibungen sind wörtlich aus Folge 1 (`../f01-die-bananenfalle/`) übernommen; danach steht in jedem `image_prompt` ein fester Winter-Zusatzsatz, der das Sommerlicht ersetzt (S09–S11 in der festen Variante „ice … broken open in the middle“). Tung Tungs Schläger-Teilsatz ist beim Schal-Umwickeln/Umarmen durch „his large wooden baseball bat tucked under one arm“ ersetzt (Tabelle in `01-treatment.md`, per Skript geprüft). Referenzbilder 1–3 aus Folge 1, plus neue Referenz 18 (der verschneite Wald mit zugefrorener Pfütze). Schal, Schneemann, Tannenzapfen-Hut und Eiszapfen haben feste englische Beschreibungen im Treatment.

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren, Schläger- und Schal-Logik, Requisiten, Winter-Look, Dreiakt-Struktur, Referenzbilder (1–3 aus Folge 1 + Prompt für Referenz 18) |
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

1. **Referenzbilder:** 1–3 aus Folge 1 wiederverwenden; Referenz 18 (verschneiter Wald, zugefrorene Pfütze) mit dem Prompt aus `01-treatment.md` erzeugen – mit Referenz 3 als Bildreferenz. Referenz 18 bleibt Basis für die ganze Winter-Staffel.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern erzeugen (Referenz 18 für alle Shots). Zeigt der Generator in S01/S03–S05 den ganzen Hai statt nur der Augen im Schneemann, dort Referenz 1 weglassen.
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video), 5-s-Clips, im Schnitt trimmen. S11 so wählen, dass die Endpose zu Folge 1, S01 passt.
4. **Ablegen:** Clips als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f16-der-schneemann`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1–15 vertonen, Musik mit dem Prompt aus `05-sound.md`.
6. **Schneiden:** CapCut (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
