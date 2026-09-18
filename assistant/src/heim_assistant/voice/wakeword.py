"""Wake-Word-Erkennung mit openWakeWord.

Privacy-first: Es wird kein Audio gespeichert. Jeder 80-ms-Frame wird direkt
nach der Vorhersage verworfen; nach einer Erkennung wird der interne
Modellzustand zurückgesetzt (`Model.reset()`).

Hinweis: `inference_framework="onnx"` ist hier bewusst statt des
openWakeWord-Standards "tflite" gesetzt - das vorkompilierte
`tflite-runtime`-Wheel ist inkompatibel mit NumPy 2.x (führt zu einem
`AttributeError: _ARRAY_API not found` beim Laden des Modells). ONNX
Runtime ist ohnehin schon eine Abhängigkeit dieses Projekts (über
sherpa-onnx) und funktioniert mit NumPy 2.x einwandfrei.
"""

from __future__ import annotations

import numpy as np
import sounddevice as sd
from openwakeword.model import Model

FRAME_SAMPLES = 1280  # 80ms bei 16kHz - von openWakeWord vorgegebene Fenstergröße


def to_int16(frame: np.ndarray) -> np.ndarray:
    """Wandelt ein float32-Array im Bereich [-1, 1] in 16-Bit-PCM um.

    openWakeWord ist auf 16-Bit-PCM-Audio trainiert; sounddevice liefert
    Mikrofondaten standardmäßig als float32 in [-1, 1].
    """
    clipped = np.clip(frame, -1.0, 1.0)
    return (clipped * 32767.0).astype(np.int16)


class WakeWordDetector:
    def __init__(self, model_name: str, threshold: float, sample_rate: int = 16000):
        self._threshold = threshold
        self._sample_rate = sample_rate
        self._model = Model(wakeword_models=[model_name], inference_framework="onnx")

    def wait_for_wake_word(self) -> None:
        """Blockiert, bis das Wake-Word erkannt wird (oder Strg+C kommt)."""
        detected = False

        def callback(indata, _frames, _time_info, _status) -> None:
            nonlocal detected
            if detected:
                return
            frame = to_int16(indata[:, 0])
            predictions = self._model.predict(frame)
            if max(predictions.values(), default=0.0) >= self._threshold:
                detected = True

        with sd.InputStream(
            samplerate=self._sample_rate,
            channels=1,
            dtype="float32",
            blocksize=FRAME_SAMPLES,
            callback=callback,
        ):
            while not detected:
                sd.sleep(50)

        self._model.reset()
