import pytest

# Nur mit der optionalen Sprach-Erweiterung (pip install -e ".[voice]") lauffähig.
np = pytest.importorskip("numpy")
pytest.importorskip("openwakeword")

from heim_assistant.voice.wakeword import to_int16


def test_to_int16_zero_stays_zero():
    assert to_int16(np.array([0.0], dtype=np.float32))[0] == 0


def test_to_int16_full_scale():
    result = to_int16(np.array([1.0, -1.0], dtype=np.float32))
    assert result[0] == 32767
    assert result[1] == -32767


def test_to_int16_clips_out_of_range():
    result = to_int16(np.array([2.0, -2.0], dtype=np.float32))
    assert result[0] == 32767
    assert result[1] == -32767


def test_to_int16_dtype():
    result = to_int16(np.zeros(4, dtype=np.float32))
    assert result.dtype == np.int16
