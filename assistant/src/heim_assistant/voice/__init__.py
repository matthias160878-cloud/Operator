"""Sprach-Erweiterung: Spracherkennung (faster-whisper) und Sprachausgabe
(sherpa-onnx). Start über ``python -m heim_assistant.voice`` - siehe
README.md für die Einrichtung (Modelle, Mikrofon/Lautsprecher).

Wake-Word-Erkennung ist bewusst nicht enthalten (push-to-talk statt
Dauerlauschen); sie ließe sich mit openWakeWord ergänzen, indem sie vor
``recorder.record()`` gehängt wird.
"""
