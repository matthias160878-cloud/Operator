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
| [f08](f08-die-torte/) | Die Torte | Tung Tung hält die Hinterhalt-Torte für seine Geburtstagsüberraschung und pustet Tralalero samt Sahne weg |
| [f09](f09-der-bumerang/) | Der Bumerang | Tung Tung wirft den Bumerang mit Pirouette zurück — er jagt Tralalero bis in die Pfütze und landet als Hut |
| [f10](f10-das-unwetter/) | Das Unwetter (Finale Staffel 2) | Tralalero rettet Tung Tung aus dem Hochwasser, bekommt den Schläger geschenkt — und wird damit in den See gewirbelt |
| [f11](f11-die-wasserbomben/) | Die Wasserbomben (Auftakt Staffel 3) | Tung Tung genießt die Wasserbomben als Dusche — Tralaleros Ballons platzen einer nach dem anderen |
| [f12](f12-der-magnet/) | Der Magnet | Tung Tung ist aus Holz — der Magnet zieht stattdessen die rostige Rüstung aus Folge 2 an Tralalero |
| [f13](f13-die-seilrutsche/) | Die Seilrutsche | Tung Tung bückt sich im letzten Moment nach einem Pilz — Tralalero rauscht über ihn hinweg bis ans Seilende über der Pfütze |
| [f14](f14-der-zaubertrick/) | Der Zaubertrick | Die Zauberkiste hat eine Hintertür — Tralalero rutscht am Ende selbst darin in die Pfütze |
| [f16](f16-der-schneemann/) | Der Schneemann (Auftakt Staffel 4, Winter) | Tralalero lauert im Schneemann, niest — und bricht ins Eis der zugefrorenen Pfütze ein |

## Referenzbilder (einmal erzeugen, in allen Folgen nutzen)

1. Tralalero Tralala — Prompt in `f01-die-bananenfalle/01-treatment.md`
2. Tung Tung Sahur — ebenda
3. Wald — ebenda
4. Tralalero in Ritterrüstung — `f02-die-ritterruestung/01-treatment.md`
5. Riesenhammer — `f03-der-riesenhammer/01-treatment.md`
6. Tralalero im Tung-Tung-Holzkostüm — `f04-die-verkleidung/01-treatment.md`
7. Holzkatapult — `f05-das-katapult/01-treatment.md`
8. Laubbläser — `f07-der-laubblaeser/01-treatment.md` 
9. Riesentorte — `f08-die-torte/01-treatment.md`
10. Tung Tung schlafend am Baum — `f06-der-geklaute-schlaeger/01-treatment.md`
11. Holzbumerang — `f09-der-bumerang/01-treatment.md`
12. Überfluteter Waldweg im Regen — `f10-das-unwetter/01-treatment.md`
13. Tralalero am Ballonbündel mit Wasserbomben-Gürtel — `f11-die-wasserbomben/01-treatment.md`
14. Hufeisenmagnet — `f12-der-magnet/01-treatment.md`
15. Seilrutsche zwischen den Bäumen — `f13-die-seilrutsche/01-treatment.md`
16. Tralalero als Zauberer mit der Zauberkiste — `f14-der-zaubertrick/01-treatment.md`
18. Verschneiter Wald mit zugefrorener Pfütze — `f16-der-schneemann/01-treatment.md`

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
