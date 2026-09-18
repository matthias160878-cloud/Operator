"""Spracherkennung (Speech-to-Text) mit faster-whisper."""

from __future__ import annotations

import numpy as np
from faster_whisper import WhisperModel

from .config import VoiceSettings


class SpeechToText:
    def __init__(self, settings: VoiceSettings):
        self._settings = settings
        self._model = WhisperModel(
            settings.stt_model_size,
            device=settings.stt_device,
            compute_type=settings.stt_compute_type,
        )

    def transcribe(self, audio: np.ndarray) -> str:
        """Transkribiert ein 1-D float32-Array (mono, siehe sample_rate der Aufnahme)."""
        segments, _info = self._model.transcribe(
            audio,
            language=self._settings.stt_language,
            vad_filter=True,
        )
        return " ".join(segment.text.strip() for segment in segments).strip()
