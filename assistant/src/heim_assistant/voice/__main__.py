"""Sprachmodus: Push-to-Talk-Schleife (Enter drücken, sprechen, Antwort hören).

Braucht Mikrofon und Lautsprecher - läuft daher nicht in dieser Sandbox,
sondern auf einem echten Rechner. Siehe README.md für die Einrichtung.
"""

from __future__ import annotations

import sys

from ..brain import Brain
from ..config import Settings
from .config import VoiceSettings
from .recorder import record
from .stt import SpeechToText
from .tts import MissingTtsModelError, TextToSpeech


def main() -> None:
    settings = Settings.from_env()
    if not settings.api_key:
        print(
            "Kein ANTHROPIC_API_KEY gesetzt. Siehe README.md für die Einrichtung.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    voice_settings = VoiceSettings.from_env()

    print("Lade Spracherkennungsmodell (faster-whisper) ...")
    stt = SpeechToText(voice_settings)

    print("Lade Sprachausgabemodell (sherpa-onnx) ...")
    try:
        tts = TextToSpeech(voice_settings)
    except MissingTtsModelError as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)

    brain = Brain(settings)

    print(
        f"\nSprachmodus bereit. Enter drücken, {voice_settings.record_seconds:.0f}s "
        "sprechen, Antwort hören. Strg+C zum Beenden.\n"
    )
    while True:
        try:
            input("[Enter] zum Aufnehmen ... ")
        except (EOFError, KeyboardInterrupt):
            print()
            break

        print("Aufnahme läuft ...")
        audio = record(voice_settings.record_seconds, voice_settings.sample_rate)

        text = stt.transcribe(audio)
        if not text:
            print("(nichts verstanden)\n")
            continue
        print(f"Du: {text}")

        antwort = brain.ask(text)
        print(f"Assistent: {antwort}\n")
        tts.speak(antwort)


if __name__ == "__main__":
    main()
