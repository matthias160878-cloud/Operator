# heim-assistant

Ein eigenständiges, kleines Grundgerüst für einen lokalen KI-Assistenten -
inspiriert von der Idee eines JARVIS-artigen Desktop-Assistenten (wie z. B.
Darwin AI Assistant), aber eine **eigene, unabhängige Implementierung** und
**keine Kopie** eines bezahlten Produkts.

## Was ist enthalten

- `src/heim_assistant/brain.py` - Unterhaltung mit Claude inklusive
  Tool-Use-Schleife (manueller Loop, siehe Anthropic-API-Dokumentation)
- `src/heim_assistant/tools.py` - lokale Werkzeuge: Uhrzeit abfragen,
  Dateien in einem sandboxed Arbeitsverzeichnis auflisten/lesen
- `src/heim_assistant/__main__.py` - Kommandozeilen-Chat (Textmodus)
- `src/heim_assistant/voice/` - Sprach-Erweiterung: Wake-Word-Erkennung
  (openWakeWord), Spracherkennung (faster-whisper) und Sprachausgabe
  (sherpa-onnx), siehe unten

## Textmodus einrichten

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

## Sprach-Erweiterung einrichten

Sprachmodus mit Wake-Word: "Hey Jarvis" sagen, dann sprechen, Antwort hören.
Ohne Wake-Word-Modell (oder mit `WAKE_WORD_ENABLED=false`) fällt der Modus
automatisch auf Push-to-Talk zurück (Enter drücken, sprechen).

### 1. System-Abhängigkeiten

PortAudio wird von `sounddevice` für Mikrofon/Lautsprecher gebraucht:

```bash
# Debian/Ubuntu
sudo apt-get install portaudio19-dev

# macOS
brew install portaudio
```

### 2. Python-Pakete

```bash
pip install -e ".[dev,voice]"
```

Installiert `faster-whisper`, `sherpa-onnx`, `sounddevice`, `numpy`,
`openwakeword`.

### 3. Wake-Word (openWakeWord)

Lädt beim ersten Start automatisch ein vortrainiertes Modell herunter
(Internetverbindung nötig; eigener Download-Host, unabhängig von Hugging
Face). Standard-Wake-Word ist `hey_jarvis` (weitere vortrainierte Modelle:
`alexa`, `hey_mycroft`, `hey_rhasspy` - über `WAKE_WORD_MODEL` wählbar).

Läuft bewusst mit `inference_framework="onnx"` statt dem openWakeWord-
Standard `"tflite"`: Das vorkompilierte `tflite-runtime`-Wheel ist mit
NumPy 2.x inkompatibel (`AttributeError: _ARRAY_API not found`).
`onnxruntime` ist ohnehin schon über sherpa-onnx installiert.

Kein Audio wird gespeichert - jeder 80-ms-Frame wird direkt nach der
Vorhersage verworfen (siehe `voice/wakeword.py`).

### 4. Spracherkennung (faster-whisper)

Lädt das Modell beim ersten Start automatisch von Hugging Face herunter
(Internetverbindung nötig). Modellgröße über `STT_MODEL_SIZE` wählbar
(Standard: `small`, gut für CPU). Für bessere Genauigkeit z. B. `medium`,
für schwache Rechner `base` oder `tiny`.

### 5. Sprachausgabe (sherpa-onnx) - Modell herunterladen

sherpa-onnx bringt kein Sprachmodell mit. Ein deutsches VITS/Piper-Voice
von der offiziellen Release-Seite herunterladen und entpacken:

<https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models>

(nach einer Datei mit `de_DE` im Namen suchen, z. B. ein Piper-Voice).
Danach in `.env` auf die entpackten Dateien verweisen:

```bash
SHERPA_ONNX_TTS_MODEL=/pfad/zu/modell.onnx
SHERPA_ONNX_TTS_TOKENS=/pfad/zu/tokens.txt
# optional, falls im Archiv vorhanden:
SHERPA_ONNX_TTS_DATA_DIR=/pfad/zu/espeak-ng-data
SHERPA_ONNX_TTS_LEXICON=/pfad/zu/lexicon.txt
```

### 6. Starten

```bash
python -m heim_assistant.voice
# oder, nach `pip install -e .`:
heim-assistant-voice
```

## Tests

```bash
pytest
```

Die Tests decken die Datei-Werkzeuge (inkl. Schutz vor Pfad-Ausbrüchen aus
dem Arbeitsverzeichnis), den Fehlerfall bei fehlendem TTS-Modell und die
Audio-Konvertierung für die Wake-Word-Erkennung ab; sie brauchen keinen
API-Schlüssel, kein heruntergeladenes Modell und kein Mikrofon. Chat-Loop
und Sprachmodus selbst sind nicht Teil der automatisierten Tests (brauchen
`ANTHROPIC_API_KEY` bzw. echte Hardware).

## Konfiguration

Über Umgebungsvariablen (siehe `.env.example`, `config.py` und
`voice/config.py`):

| Variable | Bedeutung | Standard |
|---|---|---|
| `ANTHROPIC_API_KEY` | API-Schlüssel für die Claude-API | - (erforderlich) |
| `ASSISTANT_MODEL` | Claude-Modell-ID | `claude-opus-5` |
| `ASSISTANT_SYSTEM_PROMPT` | System-Prompt des Assistenten | siehe `config.py` |
| `ASSISTANT_WORKSPACE` | Arbeitsverzeichnis für Datei-Werkzeuge | `assistant/workspace/` |
| `STT_MODEL_SIZE` | faster-whisper-Modellgröße | `small` |
| `STT_DEVICE` | `cpu` oder `cuda` | `cpu` |
| `STT_COMPUTE_TYPE` | Quantisierung (z. B. `int8`, `float16`) | `int8` |
| `STT_LANGUAGE` | Sprachcode für die Spracherkennung | `de` |
| `SHERPA_ONNX_TTS_MODEL` | Pfad zum VITS-Modell (`.onnx`) | - (für Sprachausgabe erforderlich) |
| `SHERPA_ONNX_TTS_TOKENS` | Pfad zur `tokens.txt` | - (erforderlich) |
| `SHERPA_ONNX_TTS_LEXICON` | Pfad zur Lexikon-Datei (falls vorhanden) | leer |
| `SHERPA_ONNX_TTS_DATA_DIR` | Pfad zu `espeak-ng-data` (falls vorhanden) | leer |
| `ASSISTANT_MIC_SAMPLE_RATE` | Abtastrate der Mikrofonaufnahme | `16000` |
| `ASSISTANT_RECORD_SECONDS` | Aufnahmedauer pro Aufnahme-Runde | `5` |
| `WAKE_WORD_ENABLED` | Wake-Word statt Enter-Taste nutzen | `true` |
| `WAKE_WORD_MODEL` | openWakeWord-Modellname (`hey_jarvis`, `alexa`, `hey_mycroft`, `hey_rhasspy`) | `hey_jarvis` |
| `WAKE_WORD_THRESHOLD` | Erkennungsschwelle (0.0-1.0, höher = weniger Fehlauslöser) | `0.5` |
