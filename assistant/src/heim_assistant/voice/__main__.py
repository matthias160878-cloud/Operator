"""Sprachmodus: Wake-Word ("Hey Jarvis") oder Enter drücken, sprechen, Antwort hören.

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


def _build_wake_word_detector(voice_settings: VoiceSettings):
    if not voice_settings.wake_word_enabled:
        return None
    try:
        from .wakeword import WakeWordDetector
    except ImportError:
        print(
            "WAKE_WORD_ENABLED ist gesetzt, aber openwakeword ist nicht installiert "
            "('pip install -e \".[voice]\"'). Falle zurück auf Enter-Taste.",
            file=sys.stderr,
        )
        return None

    print(f"Lade Wake-Word-Modell ('{voice_settings.wake_word_model}') ...")
    return WakeWordDetector(
        voice_settings.wake_word_model,
        voice_settings.wake_word_threshold,
        voice_settings.sample_rate,
    )


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

    wake_word = _build_wake_word_detector(voice_settings)
    brain = Brain(settings)

    if wake_word is not None:
        print(
            f"\nSprachmodus bereit. Sag '{voice_settings.wake_word_model.replace('_', ' ')}', "
            f"dann {voice_settings.record_seconds:.0f}s sprechen. Strg+C zum Beenden.\n"
        )
    else:
        print(
            f"\nSprachmodus bereit. Enter drücken, {voice_settings.record_seconds:.0f}s "
            "sprechen, Antwort hören. Strg+C zum Beenden.\n"
        )

    while True:
        try:
            if wake_word is not None:
                print(f"Warte auf Wake-Word ('{voice_settings.wake_word_model}') ...")
                wake_word.wait_for_wake_word()
                print("Wake-Word erkannt!")
            else:
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
