---
name: film-produce
description: Startet den Film-Producer-Worker-Agent, der aus einer Filmidee ein komplettes, schnittfertiges Kurzfilm-Paket erzeugt (Treatment, Drehbuch, Shotlist mit KI-Prompts, Voiceover, Untertitel, EDL/FCPXML). Verwenden bei "mach mir einen Film", "Kurzfilm", "KI-Film produzieren", "/film-produce <idee>".
---

# Film produzieren

1. Nimm die Filmidee aus den Argumenten bzw. der Nachricht des Nutzers. Fehlt
   sie komplett, frage einmal kurz nach der Idee — sonst keine Rückfragen.
2. Starte den Worker-Agent `film-studio:film-producer` über das Agent-Tool und
   gib ihm die Idee plus alle genannten Vorgaben (Länge, Format, Genre,
   Sprache, Plattform) wörtlich weiter. Bei mehreren Ideen: je Idee einen
   Agenten, alle parallel in einer Nachricht.
3. Gib die Zusammenfassung des Agenten an den Nutzer weiter (Titel, Logline,
   Projektordner, nächste Schritte).
