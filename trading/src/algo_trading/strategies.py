"""Strategie-Familien, Parameterräume und Signalerzeugung.

Signale sind Einstiegs-EREIGNISSE (+1 Long, -1 Short, 0 nichts) am Schluss einer Kerze;
der Backtest steigt frühestens zur Eröffnung der nächsten Kerze ein (kein Lookahead).
"""
from __future__ import annotations

import hashlib
import json
import random
from dataclasses import asdict, dataclass, field

import numpy as np
import pandas as pd

from . import indicators as ind

# Parameterräume je Familie: (min, max, Schritt). Gemeinsame Risiko-Parameter stehen in COMMON_SPACE.
FAMILY_SPACE: dict[str, dict[str, tuple[float, float, float]]] = {
    "trend": {"fast": (5, 30, 1), "slow": (30, 200, 5), "adx_min": (15, 35, 1)},
    "breakout": {"lookback": (10, 120, 5), "vol_filter": (0.8, 1.6, 0.1)},
    "mean_reversion": {"rsi_period": (2, 21, 1), "rsi_low": (10, 35, 1), "bb_period": (10, 50, 5), "bb_std": (1.5, 3.0, 0.25)},
    "momentum": {"roc_period": (5, 60, 1), "roc_atr_mult": (1.0, 5.0, 0.25), "trend_ema": (50, 300, 10)},
}
COMMON_SPACE: dict[str, tuple[float, float, float]] = {
    "sl_atr": (1.0, 3.5, 0.25),
    "tp_atr": (2.0, 8.0, 0.5),
    "max_bars": (12, 200, 4),
}
FAMILY_LABELS = {
    "trend": "Trend Following (EMA-Crossover, ADX-Filter)",
    "breakout": "Breakout (Donchian-Hoch/Tief, Volatilitätsfilter)",
    "mean_reversion": "Mean Reversion (RSI, Bollinger Bands)",
    "momentum": "Momentum (Rate of Change, ATR, Trendfilter)",
}


@dataclass(frozen=True)
class StrategyConfig:
    family: str
    params: dict
    pair: str = "EURUSD"
    timeframe: str = "15m"
    risk: float = 0.01
    hypothesis: str = ""
    id: str = field(default="")

    def __post_init__(self) -> None:
        if self.family not in FAMILY_SPACE:
            raise ValueError(f"Unbekannte Strategie-Familie: {self.family}")
        if not self.id:
            digest = hashlib.sha1(json.dumps([self.family, self.params, self.pair, self.timeframe], sort_keys=True).encode()).hexdigest()
            object.__setattr__(self, "id", f"{self.family[:2]}-{digest[:10]}")

    @property
    def rr(self) -> float:
        return self.params["tp_atr"] / self.params["sl_atr"]

    def to_dict(self) -> dict:
        return asdict(self)


def _snap(value: float, lo: float, hi: float, step: float) -> float | int:
    value = min(max(value, lo), hi)
    snapped = lo + round((value - lo) / step) * step
    snapped = min(max(snapped, lo), hi)
    return int(round(snapped)) if float(step).is_integer() and float(lo).is_integer() else round(snapped, 4)


def clamp_params(family: str, params: dict) -> dict:
    """Bringt (z. B. KI-vorgeschlagene) Parameter in den gültigen Raum - die 'Coding Agent'-Rolle, deterministisch."""
    space = {**FAMILY_SPACE[family], **COMMON_SPACE}
    out = {}
    for key, (lo, hi, step) in space.items():
        raw = params.get(key, (lo + hi) / 2)
        try:
            out[key] = _snap(float(raw), lo, hi, step)
        except (TypeError, ValueError):
            out[key] = _snap((lo + hi) / 2, lo, hi, step)
    if family == "trend" and out["fast"] >= out["slow"]:
        out["slow"] = _snap(out["fast"] * 3, *FAMILY_SPACE["trend"]["slow"])
    return out


def random_params(family: str, rng: random.Random, min_rr: float = 2.0) -> dict:
    space = {**FAMILY_SPACE[family], **COMMON_SPACE}
    params = {}
    for key, (lo, hi, step) in space.items():
        n = int(round((hi - lo) / step))
        params[key] = lo + rng.randint(0, n) * step
    params["tp_atr"] = max(params["tp_atr"], params["sl_atr"] * min_rr)
    return clamp_params(family, params)


def signals(df: pd.DataFrame, cfg: StrategyConfig) -> np.ndarray:
    p = cfg.params
    close = df["close"]
    if cfg.family == "trend":
        fast, slow = ind.ema(close, int(p["fast"])), ind.ema(close, int(p["slow"]))
        strong = ind.adx(df) >= p["adx_min"]
        above = fast > slow
        cross_up = above & ~above.shift(1, fill_value=False)
        cross_dn = ~above & above.shift(1, fill_value=False) & fast.notna() & slow.notna()
        sig = np.where(cross_up & strong, 1, np.where(cross_dn & strong, -1, 0))
    elif cfg.family == "breakout":
        hi, lo = ind.donchian(df, int(p["lookback"]))
        a = ind.atr(df)
        vol_ok = a > a.rolling(100, min_periods=20).mean() * p["vol_filter"]
        up = (close > hi) & ~(close.shift(1) > hi.shift(1))
        dn = (close < lo) & ~(close.shift(1) < lo.shift(1))
        sig = np.where(up & vol_ok, 1, np.where(dn & vol_ok, -1, 0))
    elif cfg.family == "mean_reversion":
        r = ind.rsi(close, int(p["rsi_period"]))
        lower, _, upper = ind.bollinger(close, int(p["bb_period"]), p["bb_std"])
        long_c = (r < p["rsi_low"]) & (close < lower)
        short_c = (r > 100 - p["rsi_low"]) & (close > upper)
        sig = np.where(long_c & ~long_c.shift(1, fill_value=False), 1, np.where(short_c & ~short_c.shift(1, fill_value=False), -1, 0))
    elif cfg.family == "momentum":
        a = ind.atr(df)
        move = close - close.shift(int(p["roc_period"]))
        trend = ind.ema(close, int(p["trend_ema"]))
        long_c = (move > p["roc_atr_mult"] * a) & (close > trend)
        short_c = (move < -p["roc_atr_mult"] * a) & (close < trend)
        sig = np.where(long_c & ~long_c.shift(1, fill_value=False), 1, np.where(short_c & ~short_c.shift(1, fill_value=False), -1, 0))
    else:  # pragma: no cover - durch StrategyConfig ausgeschlossen
        raise ValueError(cfg.family)
    return np.asarray(sig, dtype=np.int8)
