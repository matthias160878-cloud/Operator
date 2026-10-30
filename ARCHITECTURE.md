# ARCHITECTURE.md — Bestandsaufnahme (WP01)

Dieses Dokument ist das Ergebnis von **WORK PACKAGE 01** (reine Analyse, keine
Implementierung) der SECRET 58 AI MEDIA ENGINE Spezifikation. Es beschreibt den
tatsächlichen Zustand des Repositories `Operator` zum Zeitpunkt der Analyse.

## 1. Befund in einem Satz

Das Repository enthält **keinerlei Anwendungscode**. Es gibt kein Frontend, kein
Backend, keine Datenbank, keine Agenten, keine APIs, keine Authentifizierung, kein
Design-System und keine Media-/Video-Funktionen, die wiederverwendet werden
könnten. Jede der elf in der Spezifikation (Abschnitt 1) geforderten
Untersuchungen fällt daher auf "nicht vorhanden" zurück.

## 2. Vollständiges Bestandsverzeichnis

Tracked files (aus `git ls-files`):

```
CLAUDE.md
README.md
.claude/README.md
.claude/settings.json
.claude/skills/.gitkeep
```

Das war's — keine weiteren Verzeichnisse, keine Quellcodedateien, keine
Konfigurationsdateien für Build-Tools, keine Dependency-Manifeste (kein
`package.json`, kein `requirements.txt`, kein `pyproject.toml` etc.).

### 2.1 `README.md`

Enthält ausschließlich die Überschrift `# Operator`. Kein Beschreibungstext,
keine Setup-Anleitung.

### 2.2 `CLAUDE.md`

Projektinstruktionen für Claude Code. Bestätigt explizit den leeren Zustand:
"This repository currently contains no source code — only a `README.md`
placeholder." Enthält zusätzlich eine Anweisung zur künftigen Einbindung
externer "Jarvis"-Skills per Symlink (`.claude/skills`) — bislang ungenutzt
(`skills/` enthält nur eine `.gitkeep`-Datei).

### 2.3 `.claude/`

Enthält ausschließlich Claude-Code-Session-Konfiguration:

- `settings.json` registriert den Marketplace `obra/superpowers-marketplace`
  und aktiviert das Plugin **Superpowers** (TDD, systematisches Debugging,
  Brainstorming, Plan-Erstellung/-Ausführung, Code-Review, Git-Worktrees).
- `README.md` dokumentiert, wie weitere Skills/Plugins ergänzt werden.
- `skills/.gitkeep` — Platzhalter, kein Skill-Inhalt.

Das ist Tooling für die Entwicklungsumgebung, **kein** Teil der zu bauenden
SECRET-58-Anwendung.

## 3. Untersuchung gemäß Spezifikationsabschnitt 1 (Punkt für Punkt)

| # | Geforderte Untersuchung | Befund |
|---|---|---|
| 1 | Bestehendes SECRET-58-Projekt analysieren | Kein Projektcode vorhanden, nur Doku/Tooling-Platzhalter |
| 2 | Ordnerstruktur untersuchen | Siehe Abschnitt 2 — vollständig aufgeführt |
| 3 | Frontend identifizieren | Nicht vorhanden |
| 4 | Backend identifizieren | Nicht vorhanden |
| 5 | Datenbank identifizieren | Nicht vorhanden |
| 6 | Vorhandene Agenten identifizieren | Nicht vorhanden |
| 7 | Vorhandene APIs identifizieren | Nicht vorhanden |
| 8 | Vorhandene Authentifizierung identifizieren | Nicht vorhanden |
| 9 | Vorhandenes Design untersuchen | Nicht vorhanden |
| 10 | Vorhandene Media-/Video-Funktionen untersuchen | Nicht vorhanden |
| 11 | Bestehende Komponenten wiederverwenden | Es gibt nichts wiederzuverwenden; einzige Konstante ist die `.claude/`-Tooling-Konfiguration, die unangetastet bleiben soll |

## 4. Git-Historie

Fünf Commits, ausschließlich Dokumentations-/Tooling-Setup:

```
907fadc Merge pull request #4 (Superpowers-Skills-Doku)
533bea3 Correct how fast skills and plugins load
10499c6 Document how to add further skills and plugins
6c17dd4 Enable the Superpowers plugin for this project
bd5a63d Merge pull request #2 (Jarvis-Skills-Symlink)
47ca2a7 Document symlinking Jarvis skills instead of copying
ec2eb06 Merge pull request #1 (CLAUDE.md-Doku)
728e0bd Add placeholder CLAUDE.md
57b0641 Initial commit
```

Keine Historie von Anwendungscode, Refactorings oder Feature-Arbeit.

## 5. Konsequenz für die Spezifikation

Die Spezifikation verlangt in Abschnitt 1 ausdrücklich:

> Keine unnötigen Löschungen. Keine komplette Neuimplementierung, wenn bereits
> funktionierende Komponenten vorhanden sind.

Da keine funktionierenden Komponenten existieren, ist eine "Neuimplementierung"
in diesem Fall keine Entscheidung, sondern der einzig mögliche Weg — es gibt
nichts zu bewahren außer der bestehenden `.claude/`-Konfiguration und den
beiden Dokumentationsdateien, die unverändert bleiben (`CLAUDE.md` wird gemäß
seiner eigenen Anweisung erst aktualisiert, sobald echter Code hinzukommt).

## 6. Integrationspunkte für künftigen Code

Da nichts existiert, gibt es keine bestehenden Integrationspunkte im engeren
Sinn. Relevant sind lediglich:

- **`.claude/skills/`**: laut `CLAUDE.md` vorgesehen für einen künftigen
  Symlink auf eine externe "Jarvis"-Skills-Sammlung — nicht Teil der
  SECRET-58-Anwendungsarchitektur selbst, sondern der Claude-Code-Tooling-Ebene.
- **`CLAUDE.md`**: muss nach Einführung von echtem Code um Build-/Lint-/Test-
  Befehle und Architekturhinweise ergänzt werden (explizite Anweisung in der
  Datei selbst).

## 7. Mögliche Konflikte

Keine inhaltlichen Konflikte mit vorhandenem Code, da keiner existiert. Zu
beachten:

- Der Ordnername des Repositories ist `Operator`, nicht `SECRET-58` oder
  `S58-MediaEngine`. Die Spezifikation benennt das Produkt
  "SECRET 58 AI MEDIA ENGINE" (Kurzname `S58-MediaEngine`) — dies ist ein
  Namensunterschied zwischen Repository und Produkt, kein technischer
  Konflikt. Empfehlung: Produktname in Doku/README führen, Repository-Namen
  nicht zwingend umbenennen (spart eine schwer reversible Aktion).
- `.claude/settings.json` und die Superpowers-Skills bleiben unverändert
  bestehen; neue Projekt-Dependencies (Python/Node) dürfen diese Tooling-Ebene
  nicht überschreiben.

## 8. Benötigte Dependencies (Vorschau, keine Installation in WP01)

Basierend auf der Spezifikation (Abschnitte 9–20, 40–44) wird künftig
voraussichtlich benötigt:

**Backend (Python)**: ein async-fähiges Web-Framework (z. B. FastAPI) für
Master-Agent-API und Agenten-Endpunkte, ein ORM/DB-Layer, ein Task-Queue-System
für lange laufende Renderjobs (Abschnitt 40 nennt `redis` + `worker`), sowie
`ffmpeg-python`/Subprocess-Wrapper um FFmpeg (Abschnitt 16).

**Frontend (Node)**: ein Framework für das in Abschnitt 29–32 beschriebene
Dashboard (Eingabeformular, Produktionsmonitor, Video-Preview, Approval-System).

**System**: FFmpeg, Git, Python, Node.js — genau die Voraussetzungen, die das
geforderte `INSTALLIEREN.ps1` (Abschnitt 41) prüfen soll.

Konkrete Versionen/Pakete werden erst in WP02+ festgelegt, wenn die
Kern-Datenmodelle und die Provider-Interfaces entworfen werden — die
Spezifikation verlangt ausdrücklich "nur tatsächlich benötigte Dependencies"
(Abschnitt 43).

## 9. Vorgeschlagene Implementierungsreihenfolge

Deckt sich mit den in der Spezifikation (Abschnitt 46) vorgegebenen Work
Packages WP01–WP20. Da keine Altlasten existieren, kann diese Reihenfolge ohne
Anpassung übernommen werden:

1. WP01 — Projektanalyse (dieses Dokument) ✓
2. WP02 — Core-Datenmodelle (Project, Scene, Asset, Costs, ...)
3. WP03 — Master Agent (Orchestrator-Grundgerüst, noch ohne echte Provider)
4. WP04 — Script Agent
5. WP05 — Storyboard Agent
6. WP06 — Provider-Interfaces (`VideoProvider`, `ImageProvider`,
   `VoiceProvider`, ...) als abstrakte Basisklassen
7. WP07 — AI Model Router (Auswahllogik nach Qualität/Kosten/Aufgabe)
8. WP08 — Mock-Provider (Voraussetzung für MOCK_MODE / End-to-End-Tests ohne
   Kosten)
9. WP09–WP11 — echte Video-/Voice-/Music-Provider-Adapter
10. WP12 — FFmpeg-Editor-Engine
11. WP13 — Caption Engine (SRT/VTT/ASS)
12. WP14 — Format Engine (16:9 / 9:16 / 1:1 Reframing)
13. WP15 — Thumbnail Engine
14. WP16 — QA Engine
15. WP17 — Dashboard (Frontend)
16. WP18 — Cost Engine
17. WP19 — Publishing-Adapter (zunächst ohne aktive Veröffentlichung)
18. WP20 — End-to-End-System (Mock-basiert, dann optional echte Provider)

Jedes Paket folgt der in Abschnitt 47 vorgegebenen Regel: Implementieren →
Testen → Fehler beheben → Dokumentieren → Status melden, bevor das nächste
Paket beginnt.

## 10. Status

**WP01 ist abgeschlossen.** Es wurde ausschließlich analysiert und
dokumentiert; kein Anwendungscode wurde geschrieben oder verändert, wie von
der Spezifikation gefordert. Als Nächstes wartet dieses Vorhaben auf die
ausdrückliche Freigabe für **WORK PACKAGE 02** (Core-Datenmodelle), bevor
weitere Arbeiten aufgenommen werden.
