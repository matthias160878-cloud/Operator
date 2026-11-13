"""Marktregime-Analyse: Trend, Seitwärts, Volatil."""
from __future__ import annotations

import numpy as np
import pandas as pd

from .indicators import adx, atr

REGIMES = ("trend", "range", "volatile")


def classify(df: pd.DataFrame, adx_n: int = 14, vol_window: int = 200) -> pd.Series:
    """Pro Kerze ein Regime-Label (nur vergangene Daten)."""
    a = adx(df, adx_n)
    natr = atr(df, 14) / df["close"]
    vol_hi = natr > natr.rolling(vol_window, min_periods=50).quantile(0.8)
    labels = np.where(vol_hi, "volatile", np.where(a >= 25, "trend", "range"))
    return pd.Series(labels, index=df.index).where(a.notna() & natr.notna(), "range")


def summary(df: pd.DataFrame) -> dict:
    """Kennzahlen für den Market-Analyst-Agenten."""
    reg = classify(df)
    share = reg.value_counts(normalize=True).reindex(REGIMES, fill_value=0.0)
    rets = np.log(df["close"]).diff().dropna()
    bars_per_day = max(1, int(round(pd.Timedelta("1D") / (df.index[1] - df.index[0])))) if len(df) > 1 else 1
    recent = reg.iloc[-500:].value_counts(normalize=True).reindex(REGIMES, fill_value=0.0)
    return {
        "bars": int(len(df)),
        "start": str(df.index[0]),
        "end": str(df.index[-1]),
        "last_close": float(df["close"].iloc[-1]),
        "total_return_pct": float((df["close"].iloc[-1] / df["close"].iloc[0] - 1) * 100),
        "annualized_vol_pct": float(rets.std() * np.sqrt(bars_per_day * 252) * 100),
        "regime_share": {k: round(float(v), 3) for k, v in share.items()},
        "recent_regime_share": {k: round(float(v), 3) for k, v in recent.items()},
        "current_regime": str(reg.iloc[-1]),
        "adx_last": float(adx(df).iloc[-1]),
    }
