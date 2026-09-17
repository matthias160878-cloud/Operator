import pytest

pytest.importorskip("sherpa_onnx")

from heim_assistant.voice.tts import MissingTtsModelError, TextToSpeech


def test_missing_model_raises_clear_error(voice_settings_factory):
    with pytest.raises(MissingTtsModelError):
        TextToSpeech(voice_settings_factory())
