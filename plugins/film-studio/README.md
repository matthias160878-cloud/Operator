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

## Was das Plugin nicht tut

Es generiert keine Bilder oder Videos und rendert nichts. Dafür nutzt du die
Prompts aus der Shotlist mit einem Bild-/Video-Generator deiner Wahl. Die
Schnittprogramme selbst werden nicht installiert oder ferngesteuert. Das
Plugin liefert Dateien, die sie importieren können.
