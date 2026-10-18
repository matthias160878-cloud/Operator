# Film Studio — Claude-Code-Plugin

Eigenständiges Plugin für KI-Kurzfilme: ein **Worker-Agent** plant, schreibt
und bereitet einen Kurzfilm schnittfertig vor — von der Idee bis zur
importierbaren Timeline für Premiere Pro, DaVinci Resolve, Final Cut Pro,
After Effects, LumaFusion und Frame.io.

Unabhängig von der Next.js-App und dem Python-Assistenten in diesem Repo.

## Installation

In Claude Code (CLI, Desktop oder Web):

```
/plugin marketplace add matthias160878-cloud/Operator
/plugin install film-studio@operator-plugins
```

Lokal aus einem Checkout geht auch:

```
/plugin marketplace add /pfad/zu/Operator
/plugin install film-studio@operator-plugins
```

## Inhalt

| Bestandteil | Typ | Zweck |
| --- | --- | --- |
| `film-producer` | Worker-Agent | Arbeitet selbstständig: Idee → Treatment → Drehbuch → Shotlist mit Bild-/Video-Prompts → Voiceover → Sound-Brief → Schnittdateien → Post-Anleitung |
| `film-director` | Regie-Agent | Spielfilm-Modus: Film-Bibel (Figuren, Orte, Look), Sequenzplan mit Anfangs-/Endzuständen, legt die Sequenz-Ordner an |
| `/film-studio:film-feature <idee>` | Skill | Spielfilm-Modus: Director plant, dann je Sequenz ein film-producer (bis zu 6 parallel), am Ende eine Gesamt-Timeline |
| `/film-studio:film-produce <idee>` | Skill | Startet den Worker-Agent (mehrere Ideen laufen parallel) |
| `/film-studio:film-plan` | Skill | 60-Sekunden-Quiz → persönlicher 28-Tage-Plan zum ersten KI-Film |
| `/film-studio:film-export [projekt]` | Skill | Baut EDL, FCPXML, SRT und Clip-Checkliste neu (z. B. nach Shotlist-Änderungen) |
| `scripts/build_edit.py` | Skript | Erzeugt die Schnittdateien aus `03-shotlist.csv` (nur Python-Standardbibliothek) |

## Ergebnis eines Laufs

```
film-projects/<slug>/
  project.json         Metadaten (Titel, Länge, Format, fps)
  01-treatment.md      Logline, Figuren, Look, Dreiakter
  02-script.md         Drehbuch
  03-shotlist.csv      Shots mit image_prompt / video_prompt
  04-voiceover.txt     Sprechertext für TTS
  05-sound.md          Musik- und Sound-Brief
  06-post.md           Anleitung je Schnittprogramm
  clips/               hier die generierten Clips als S01.mp4, S02.mp4, … ablegen
  edit/
    timeline.edl       Premiere Pro, DaVinci Resolve, LumaFusion
    timeline.fcpxml    Final Cut Pro, DaVinci Resolve
    subtitles.srt      Untertitel
    clips-checklist.md fehlende Clips
```

## Spielfilm-Modus

Für lange Filme (z. B. 60 Minuten) teilt `/film-studio:film-feature` den Film
in Sequenzen (Standard 5 Minuten). Der `film-director` schreibt die
verbindliche Film-Bibel mit festen Figuren- und Look-Beschreibungen, damit
die parallel arbeitenden Producer stimmig bleiben.

```
film-projects/<slug>/
  project.json         "type": "feature", Gesamtlänge, Format
  00-bible.md          Story, Figuren, Orte, Look, Ton, Akte
  01-sequences.md      Sequenzplan mit Anfangs-/Endzustand
  sequences/
    01-<name>/         je Sequenz ein komplettes Paket wie beim Kurzfilm
    02-<name>/         (Shot-IDs Q01S001, Q02S001, … — im Film eindeutig)
  edit/
    film.fcpxml        Gesamt-Timeline (Final Cut Pro, DaVinci Resolve)
    film.edl           Gesamt-EDL; über 999 Shots als film-part1.edl, film-part2.edl, …
    film.srt           Untertitel für den ganzen Film
    clips-checklist.md Fortschritt je Sequenz
```

Einzelne Sequenzen überarbeitest du mit
`/film-studio:film-produce film-projects/<slug>/sequences/<NN-name>` und fügst
danach mit `/film-studio:film-export film-projects/<slug>` neu zusammen.

Realistisch: Eine Stunde sind etwa 600–1000 Shots. Planung und Schnittdateien
liefert das Plugin, das Erzeugen der Clips im Bild-/Videogenerator bleibt die
eigentliche Arbeit. Am besten erst einen Kurzfilm testen.

## Was das Plugin nicht tut

Es generiert keine Bilder oder Videos und rendert nichts. Dafür nutzt du die
Prompts aus der Shotlist mit einem Bild-/Video-Generator deiner Wahl. Die
Schnittprogramme selbst werden nicht installiert oder ferngesteuert. Das
Plugin liefert Dateien, die sie importieren können.
