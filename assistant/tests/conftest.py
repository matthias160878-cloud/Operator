import pytest

from heim_assistant.voice.config import VoiceSettings


def _make_voice_settings(**overrides) -> VoiceSettings:
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
        wake_word_enabled=False,
        wake_word_model="hey_jarvis",
        wake_word_threshold=0.5,
    )
    base.update(overrides)
    return VoiceSettings(**base)


@pytest.fixture
def voice_settings_factory():
    return _make_voice_settings
