"""Optionale Sprach-Erweiterung (Wake-Word, Spracherkennung, Sprachausgabe).

Diese Bausteine sind absichtlich nicht enthalten - sie brauchen Mikrofon-/
Lautsprecher-Hardware und zusätzliche Modelle, die in dieser Sandbox nicht
verfügbar sind. Auf einem echten Rechner lassen sie sich ergänzen mit:

- Wake-Word-Erkennung: openWakeWord (siehe Skill "wake-word-detection")
- Spracherkennung (STT): faster-whisper (siehe Skill "faster-whisper")
- Sprachausgabe (TTS): sherpa-onnx (siehe Skill "sherpa-onnx-tts")

Jeder Baustein würde Audio entgegennehmen/liefern und an
``heim_assistant.brain.Brain.ask()`` andocken, das bereits Text-Ein- und
-Ausgabe kapselt.
"""
