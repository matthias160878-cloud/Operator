# Tralaleros Rache – Folge 1: Die Bananenfalle

Ein Hai in blauen Sneakern stellt dem Holzschläger Tung Tung Sahur eine Bananenfalle – und tritt am Ende selbst hinein.

**45 s · 11 Shots · 9:16 · 24 fps · Deutsch · Brainrot-Comedy · Loop (S11 → S01)**

## Dateien

| Datei | Inhalt |
|---|---|
| `project.json` | Projektdaten |
| `01-treatment.md` | Logline, Figuren (feste Prompt-Beschreibungen), Look, Dreiakt-Struktur, **Figuren-Referenzbilder (Prompts)** |
| `02-script.md` | Drehbuch mit Erzählertext |
| `03-shotlist.csv` | 11 Shots mit `image_prompt` und Kling-tauglichem `video_prompt` |
| `04-voiceover.txt` | Reiner Erzählertext für TTS (z. B. ElevenLabs) |
| `05-sound.md` | Musik-Brief + Generator-Prompt, Sound-Design je Shot |
| `06-post.md` | Schnitt: CapCut (Handy) zuerst, dann Premiere, Resolve, FCP, After Effects, LumaFusion, Frame.io |
| `edit/timeline.edl` | CMX3600 (Premiere, Resolve, LumaFusion) |
| `edit/timeline.fcpxml` | Final Cut Pro / Resolve |
| `edit/subtitles.srt` | Untertitel aus dem Erzählertext |
| `edit/clips-checklist.md` | Welche Clips noch fehlen |
| `clips/` | Hier kommen die fertigen Clips hin |

## Nächste Schritte

1. **Referenzbilder erzeugen:** Die 3 Prompts aus `01-treatment.md` → Abschnitt „Figuren-Referenzbilder“ in Kling (9:16) generieren – Tralalero, Tung Tung, Wald. Beste Variante je Motiv speichern.
2. **Startbilder generieren:** Für jeden Shot den `image_prompt` aus `03-shotlist.csv` mit den Referenzbildern als Bildreferenz erzeugen.
3. **Clips animieren:** Startbild + `video_prompt` in Kling 3.0 (Image-to-Video). Kürzester Clip (5 s) reicht für alle Shots; im Schnitt auf die Shot-Dauer trimmen. S11 so wählen, dass die Endpose zu S01 passt (Loop).
4. **Ablegen:** Clips exakt als `clips/S01.mp4` … `clips/S11.mp4` speichern, dann Checkliste aktualisieren:
   `python3 /home/user/Operator/plugins/film-studio/scripts/build_edit.py <dieser-ordner>`
5. **Ton:** `04-voiceover.txt` per TTS vertonen, Musik mit dem Prompt aus `05-sound.md` erzeugen.
6. **Schneiden:** CapCut auf dem Handy (Anleitung in `06-post.md`) oder Timeline in Premiere/Resolve/FCP importieren.
