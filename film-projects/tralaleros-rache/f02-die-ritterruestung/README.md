# Tralaleros Rache – Folge 2: Die Ritterrüstung

Ein ewig nasser Hai zieht in einer glänzenden Ritterrüstung gegen Tung Tung Sahur in den Kampf – und rostet auf halbem Weg zur Statue ein.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → S01)** · Fortsetzung von `../tralaleros-rache-f01-die-bananenfalle/`

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten (inkl. Serie/Folge) |
| `01-treatment.md` | Logline, Figuren (feste Prompt-Beschreibungen aus Folge 1 + Rüstungs-Element), Look, Dreiakt-Struktur, Referenzbilder (3 aus Folge 1 + 1 neues) |
| `02-script.md` | Drehbuch mit Erzählertext |
| `03-shotlist.csv` | 11 Shots mit `image_prompt` und Kling-tauglichem `video_prompt` |
| `04-voiceover.txt` | Reiner Erzählertext für TTS (gleiche Stimme wie Folge 1) |
| `05-sound.md` | Musik-Brief + Generator-Prompt, Sound-Design je Shot |
| `06-post.md` | Schnitt: CapCut zuerst, dann Premiere, Resolve, FCP, After Effects, LumaFusion, Frame.io |
| `edit/timeline.edl` | CMX3600 (Premiere, Resolve, LumaFusion) |
| `edit/timeline.fcpxml` | Final Cut Pro / Resolve |
| `edit/subtitles.srt` | Untertitel aus dem Erzählertext |
| `edit/clips-checklist.md` | Welche Clips noch fehlen |
| `clips/` | Hier kommen die fertigen Clips hin |

## Nächste Schritte

1. **Referenzbilder:** Die 3 Referenzbilder aus Folge 1 wiederverwenden. Nur Referenz 4 („Tralalero in Ritterrüstung“, Prompt in `01-treatment.md`) neu in Kling erzeugen – mit Referenz 1 als Bildreferenz.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den passenden Referenzbildern erzeugen (S01–S08: Ref. 4; S09–S11: Ref. 1; dazu Ref. 3 Wald, Ref. 2 bei Tung Tung).
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video, 5 s), im Schnitt auf die Shot-Dauer trimmen. S11 so wählen, dass der Busch-Ausschnitt zu S01 passt (Loop).
4. **Ablegen:** Clips exakt als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py <dieser-ordner>`
5. **Ton:** `04-voiceover.txt` mit derselben TTS-Stimme wie Folge 1 vertonen, Musik mit dem Prompt aus `05-sound.md` erzeugen.
6. **Schneiden:** CapCut auf dem Handy (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
