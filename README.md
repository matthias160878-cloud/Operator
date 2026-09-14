# Operator — Jarvis-Core

MCP-Server für die Auftragsführung im Agentic OS: Aufträge anlegen, Ergebnisse
ablegen, Freigaben einholen, Wissen merken, Kosten buchen, Not-Aus.

## Start

```
pip install -e .
python -m core.mcp_server
```

Die Datenbank liegt standardmäßig unter `jarvis.db` im Arbeitsverzeichnis
(überschreibbar mit der Umgebungsvariable `JARVIS_DB_PATH`).

## Tests

```
pip install -e ".[dev]"
pytest
```

Siehe `CLAUDE.md` für Architektur- und Regeldetails.
