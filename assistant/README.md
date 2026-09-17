# heim-assistant

Ein eigenständiges, kleines Grundgerüst für einen lokalen KI-Assistenten im
Textmodus - inspiriert von der Idee eines JARVIS-artigen Desktop-Assistenten
(wie z. B. Darwin AI Assistant), aber eine **eigene, unabhängige
Implementierung** und **keine Kopie** eines bezahlten Produkts.

## Was ist enthalten

- `src/heim_assistant/brain.py` - Unterhaltung mit Claude inklusive
  Tool-Use-Schleife (manueller Loop, siehe Anthropic-API-Dokumentation)
- `src/heim_assistant/tools.py` - lokale Werkzeuge: Uhrzeit abfragen,
  Dateien in einem sandboxed Arbeitsverzeichnis auflisten/lesen
- `src/heim_assistant/__main__.py` - Kommandozeilen-Chat (Textmodus)
- `src/heim_assistant/voice/` - Platzhalter für eine optionale
  Sprach-Erweiterung (siehe unten)

## Was bewusst fehlt

Wake-Word-Erkennung, Spracherkennung (STT) und Sprachausgabe (TTS) sind
nicht enthalten, da sie Mikrofon-/Lautsprecher-Hardware brauchen, die in
einer Cloud-Sandbox nicht vorhanden ist. Auf einem echten Rechner lassen sie
sich ergänzen mit:

- **Wake-Word:** [openWakeWord](https://github.com/dscripka/openWakeWord)
- **Spracherkennung:** [faster-whisper](https://github.com/SYSTRAN/faster-whisper)
- **Sprachausgabe:** [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx)

Jeder Baustein würde Text an `heim_assistant.brain.Brain.ask()` übergeben und
die Textantwort zurückbekommen - die Schnittstelle ist bereits vom
Textmodus entkoppelt.

## Einrichtung

```bash
cd assistant
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

cp .env.example .env
# .env bearbeiten und ANTHROPIC_API_KEY eintragen
export $(grep -v '^#' .env | xargs)   # oder eine .env-Bibliothek nutzen

python -m heim_assistant
```

## Tests

```bash
pytest
```

Die Tests decken die Datei-Werkzeuge ab (inkl. Schutz vor Pfad-Ausbrüchen
aus dem Arbeitsverzeichnis) und brauchen keinen API-Schlüssel. Der
Chat-Loop selbst braucht einen gültigen `ANTHROPIC_API_KEY` und ist nicht
Teil der automatisierten Tests.

## Konfiguration

Über Umgebungsvariablen (siehe `.env.example` und `config.py`):

| Variable | Bedeutung | Standard |
|---|---|---|
| `ANTHROPIC_API_KEY` | API-Schlüssel für die Claude-API | - (erforderlich) |
| `ASSISTANT_MODEL` | Claude-Modell-ID | `claude-opus-5` |
| `ASSISTANT_SYSTEM_PROMPT` | System-Prompt des Assistenten | siehe `config.py` |
| `ASSISTANT_WORKSPACE` | Arbeitsverzeichnis für Datei-Werkzeuge | `assistant/workspace/` |
