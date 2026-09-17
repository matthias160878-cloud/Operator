import pytest

sherpa_onnx = pytest.importorskip("sherpa_onnx")

from heim_assistant.voice.config import VoiceSettings
from heim_assistant.voice.tts import MissingTtsModelError, TextToSpeech


def _settings(**overrides) -> VoiceSettings:
    base = dict(
        stt_model_size="small",
        stt_device="cpu",
        stt_compute_type="int8",
        stt_language="de",
        tts_model="",
        tts_tokens="",
        tts_lexicon="",
        tts_data_dir="",
        sample_rate=16000,
        record_seconds=5.0,
    )
    base.update(overrides)
    return VoiceSettings(**base)


def test_missing_model_raises_clear_error():
    with pytest.raises(MissingTtsModelError):
        TextToSpeech(_settings())
