---
name: film-export
description: Baut für ein bestehendes Filmprojekt (film-projects/<slug>/) die Schnittdateien neu — EDL (Premiere Pro, DaVinci Resolve, LumaFusion), FCPXML (Final Cut Pro, DaVinci Resolve), SRT-Untertitel und Clip-Checkliste — z. B. nachdem die Shotlist geändert wurde. Verwenden bei "Timeline exportieren", "EDL/FCPXML neu bauen", "/film-export".
---

# Schnittdateien exportieren

1. Projektordner bestimmen: aus den Argumenten, sonst den einzigen bzw.
   zuletzt geänderten Ordner unter `film-projects/` (bei mehreren
   Kandidaten kurz nachfragen).
2. Ausführen:
   ```bash
   python3 "${CLAUDE_PLUGIN_ROOT}/scripts/build_edit.py" film-projects/<slug>
   ```
   Optional `--fps 25` o. ä., um die Bildrate aus `project.json` zu
   überschreiben.
3. Bei Fehlern (z. B. ungültige CSV-Zeile) die genannte Zeile in
   `03-shotlist.csv` korrigieren und erneut ausführen.
4. Melde die erzeugten Dateien unter `edit/` und welche Clips laut
   `edit/clips-checklist.md` noch fehlen.
