---
name: film-feature
description: Spielfilm-Modus — plant und produziert einen langen Film (z. B. 60 Minuten) in Sequenzen. Ein Regie-Agent schreibt Film-Bibel und Sequenzplan, dann arbeiten film-producer-Agenten die Sequenzen parallel aus, am Ende entsteht eine durchgehende Timeline (FCPXML, EDL, SRT). Verwenden bei "Spielfilm", "langer Film", "Film mit einer Stunde", "/film-feature <idee>".
---

# Spielfilm produzieren

## 1. Planen

Nimm Idee und Vorgaben (Länge, Format, Sprache, Genre, Sequenzlänge) aus
den Argumenten bzw. der Nachricht. Fehlt die Idee, frage einmal kurz nach.

Starte den Agenten `film-studio:film-director` (Agent-Tool, im Vordergrund)
mit Idee und allen Vorgaben wörtlich. Er liefert den Projektordner und die
Liste der Sequenz-Ordner.

Sag dem Nutzer kurz: Titel, Logline, Anzahl Sequenzen — und dass die
Produktion jetzt startet.

## 2. Sequenzen produzieren

Für jeden Sequenz-Ordner einen `film-studio:film-producer`-Agenten starten,
**höchstens 6 gleichzeitig** (alle Agent-Aufrufe einer Welle in einer
Nachricht). Prompt je Agent:

> Sequenz eines Spielfilms ausarbeiten. Sequenz-Ordner: `<pfad>`. Lies
> zuerst `<projekt>/00-bible.md` und den Eintrag dieser Sequenz in
> `<projekt>/01-sequences.md`, dann die `project.json` der Sequenz.
> Arbeite im Sequenz-Ordner (kein neuer Ordner).

Nach jeder Welle die nächste starten. Schlägt ein Agent fehl, ihn einmal mit
demselben Prompt erneut starten; danach die Sequenz als offen melden.

## 3. Zusammenfügen

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/build_edit.py" film-projects/<slug>
```

Das baut jede Sequenz neu und erzeugt unter `film-projects/<slug>/edit/`
`film.fcpxml`, `film.edl` (bzw. `film-partN.edl` über 999 Shots), `film.srt`
und `clips-checklist.md`. Bricht es wegen doppelter `shot_id` ab, die IDs in
der genannten Sequenz auf ihr `shot_prefix` korrigieren und erneut ausführen.

## 4. Antwort

Kurz: Titel, Gesamtlänge, Anzahl Sequenzen und Shots, Pfad, offene
Sequenzen (falls welche), und die nächsten Schritte (Clips je Sequenz
generieren → `sequences/<NN-…>/clips/` → `edit/film.fcpxml` importieren).
Einzelne Sequenzen lassen sich später mit `/film-studio:film-produce
<sequenz-ordner>` überarbeiten und mit `/film-studio:film-export
film-projects/<slug>` neu zusammenfügen.
