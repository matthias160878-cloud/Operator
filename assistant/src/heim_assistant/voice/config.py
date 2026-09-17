from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class VoiceSettings:
    # Spracherkennung (faster-whisper)
    stt_model_size: str
    stt_device: str
    stt_compute_type: str
    stt_language: str | None

    # Sprachausgabe (sherpa-onnx, VITS-Modell z. B. ein deutsches Piper-Voice)
    tts_model: str
    tts_tokens: str
    tts_lexicon: str
    tts_data_dir: str

    # Aufnahme
    sample_rate: int
    record_seconds: float

    @classmethod
    def from_env(cls) -> "VoiceSettings":
        return cls(
            stt_model_size=os.environ.get("STT_MODEL_SIZE", "small"),
            stt_device=os.environ.get("STT_DEVICE", "cpu"),
            stt_compute_type=os.environ.get("STT_COMPUTE_TYPE", "int8"),
            stt_language=os.environ.get("STT_LANGUAGE", "de"),
            tts_model=os.environ.get("SHERPA_ONNX_TTS_MODEL", ""),
            tts_tokens=os.environ.get("SHERPA_ONNX_TTS_TOKENS", ""),
            tts_lexicon=os.environ.get("SHERPA_ONNX_TTS_LEXICON", ""),
            tts_data_dir=os.environ.get("SHERPA_ONNX_TTS_DATA_DIR", ""),
            sample_rate=int(os.environ.get("ASSISTANT_MIC_SAMPLE_RATE", "16000")),
            record_seconds=float(os.environ.get("ASSISTANT_RECORD_SECONDS", "5")),
        )
