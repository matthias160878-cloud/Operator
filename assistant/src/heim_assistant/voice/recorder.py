"""Mikrofonaufnahme über sounddevice."""

from __future__ import annotations

import numpy as np
import sounddevice as sd


def record(seconds: float, sample_rate: int) -> np.ndarray:
    """Nimmt `seconds` Sekunden Mono-Audio auf und gibt ein 1-D float32-Array zurück."""
    audio = sd.rec(
        int(seconds * sample_rate),
        samplerate=sample_rate,
        channels=1,
        dtype="float32",
    )
    sd.wait()
    return audio.reshape(-1)
