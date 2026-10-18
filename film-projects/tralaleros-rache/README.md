# Tralaleros Rache — Serie

Brainrot-Comedy, 9:16, je 45 Sekunden, Deutsch. Erstellt mit dem
Film-Studio-Plugin (`plugins/film-studio/`).

| Folge | Titel | Inhalt |
| --- | --- | --- |
| [f01](f01-die-bananenfalle/) | Die Bananenfalle | Tralalero legt eine Bananenschale aus — und rutscht selbst darauf aus |
| [f02](f02-die-ritterruestung/) | Die Ritterrüstung | Die Rüstung rostet am ewig nassen Hai fest und zerfällt beim ersten Antippen |
| [f03](f03-der-riesenhammer/) | Der Riesenhammer | Tung Tung hält den Holzhammer für einen Verwandten und adoptiert ihn |
| [f04](f04-die-verkleidung/) | Die Verkleidung | Im Tung-Tung-Holzkostüm wird Tralalero für den Zwillingsbruder gehalten — das nasse Holz quillt zum Fass |
| [f05](f05-das-katapult/) | Das Katapult (Finale Staffel 1) | Senkrecht in die Baumkrone, Rettung, Versöhnung mit Banane — und wieder ausgerutscht |
| [f06](f06-der-geklaute-schlaeger/) | Der geklaute Schläger (Auftakt Staffel 2) | Der geklaute Schläger wirbelt Tralalero wie ein Hubschrauber in die Pfütze, Tung Tung schläft weiter |
| [f07](f07-der-laubblaeser/) | Der Laubbläser | Tung Tung segelt begeistert davon, landet perfekt — und dreht das Rohr um |

## Referenzbilder (einmal erzeugen, in allen Folgen nutzen)

1. Tralalero Tralala — Prompt in `f01-die-bananenfalle/01-treatment.md`
2. Tung Tung Sahur — ebenda
3. Wald — ebenda
4. Tralalero in Ritterrüstung — `f02-die-ritterruestung/01-treatment.md`
5. Riesenhammer — `f03-der-riesenhammer/01-treatment.md`
6. Tralalero im Tung-Tung-Holzkostüm — `f04-die-verkleidung/01-treatment.md`
7. Holzkatapult — `f05-das-katapult/01-treatment.md`
8. Laubbläser — `f07-der-laubblaeser/01-treatment.md` 
9. Riesentorte — `f08-die-torte/01-treatment.md` (Folge 8)
10. Tung Tung schlafend am Baum — `f06-der-geklaute-schlaeger/01-treatment.md`

## Ablauf je Folge

1. Startbilder aus den `image_prompt`s in `03-shotlist.csv` erzeugen (mit den Referenzbildern).
2. Mit den `video_prompt`s in Kling animieren, als `clips/S01.mp4` … `clips/S11.mp4` ablegen.
3. `04-voiceover.txt` vertonen (in allen Folgen dieselbe Stimme), Musik nach `05-sound.md`.
4. Schnitt nach `06-post.md` (CapCut zuerst), Untertitel aus `edit/subtitles.srt`.

Die Clips selbst werden nicht ins Repo eingecheckt (`film-projects/.gitignore`).
Die Datei `edit/timeline.fcpxml` enthält absolute Pfade zu den Clips; auf dem
eigenen Rechner einmal neu bauen:

```bash
python3 plugins/film-studio/scripts/build_edit.py film-projects/tralaleros-rache/f01-die-bananenfalle
```
