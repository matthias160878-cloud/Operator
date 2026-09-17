"""Sprachausgabe (Text-to-Speech) mit sherpa-onnx (VITS-Modell, z. B. ein
deutsches Piper-Voice). Siehe README.md für den Modell-Download."""

from __future__ import annotations

from pathlib import Path

import sherpa_onnx
import sounddevice as sd

from .config import VoiceSettings


class MissingTtsModelError(RuntimeError):
    pass


class TextToSpeech:
    def __init__(self, settings: VoiceSettings):
        if not settings.tts_model or not settings.tts_tokens:
            raise MissingTtsModelError(
                "SHERPA_ONNX_TTS_MODEL und SHERPA_ONNX_TTS_TOKENS müssen gesetzt sein "
                "(siehe README.md, Abschnitt 'Sprachmodell einrichten')."
            )
        vits_config = sherpa_onnx.OfflineTtsVitsModelConfig(
            model=settings.tts_model,
            lexicon=settings.tts_lexicon,
            tokens=settings.tts_tokens,
            data_dir=settings.tts_data_dir,
        )
        model_config = sherpa_onnx.OfflineTtsModelConfig(vits=vits_config, provider="cpu")
        self._tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=model_config))

    def synthesize(self, text: str):
        """Erzeugt Audio für `text`. Gibt (samples: np.ndarray[float32], sample_rate: int) zurück."""
        audio = self._tts.generate(text)
        return audio.samples, audio.sample_rate

    def save(self, text: str, out_path: Path) -> Path:
        samples, sample_rate = self.synthesize(text)
        sherpa_onnx.write_wave(str(out_path), samples, sample_rate)
        return out_path

    def speak(self, text: str) -> None:
        samples, sample_rate = self.synthesize(text)
        sd.play(samples, sample_rate)
        sd.wait()
