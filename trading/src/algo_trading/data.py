"""Data Engine: historische Kursdaten laden (CSV, CCXT, MT5) oder synthetisch erzeugen."""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

COLUMNS = ["open", "high", "low", "close", "volume"]
TIMEFRAMES = {"1m": "1min", "5m": "5min", "15m": "15min", "30m": "30min", "1h": "1h", "4h": "4h", "1d": "1D"}


def _validate(df: pd.DataFrame) -> pd.DataFrame:
    missing = [c for c in COLUMNS[:4] if c not in df.columns]
    if missing:
        raise ValueError(f"Spalten fehlen: {missing}")
    if "volume" not in df.columns:
        df["volume"] = 0.0
    df = df[COLUMNS].astype(float).sort_index()
    df = df[~df.index.duplicated(keep="last")].dropna()
    bad = (df["high"] < df[["open", "close"]].max(axis=1)) | (df["low"] > df[["open", "close"]].min(axis=1))
    if bad.any():
        raise ValueError(f"{int(bad.sum())} Kerzen mit inkonsistentem High/Low - Daten prüfen (Bad Data).")
    return df


def load_csv(path: str | Path) -> pd.DataFrame:
    """CSV mit Spalten timestamp/time/date, open, high, low, close[, volume]."""
    df = pd.read_csv(path)
    df.columns = [c.strip().lower() for c in df.columns]
    ts_col = next((c for c in ("timestamp", "time", "date", "datetime") if c in df.columns), None)
    if ts_col is None:
        raise ValueError("Keine Zeitspalte (timestamp/time/date/datetime) gefunden.")
    ts = df[ts_col]
    unit = "ms" if np.issubdtype(ts.dtype, np.number) and ts.iloc[0] > 1e11 else ("s" if np.issubdtype(ts.dtype, np.number) else None)
    df.index = pd.to_datetime(ts, unit=unit, utc=True)
    return _validate(df.drop(columns=[ts_col]))


def resample(df: pd.DataFrame, timeframe: str) -> pd.DataFrame:
    rule = TIMEFRAMES.get(timeframe, timeframe)
    agg = {"open": "first", "high": "max", "low": "min", "close": "last", "volume": "sum"}
    return df.resample(rule).agg(agg).dropna()


def synthetic_ohlcv(bars: int = 20_000, timeframe: str = "15m", start_price: float = 1.10, seed: int = 7) -> pd.DataFrame:
    """Synthetische Kursreihe mit wechselnden Regimen (Trend, Seitwärts, Volatil) - nur für Tests und Demos."""
    rng = np.random.default_rng(seed)
    regime_len = rng.integers(300, 1500, size=bars // 300 + 2)
    drift, vol = [], []
    for length in regime_len:
        kind = rng.choice(["trend_up", "trend_down", "range", "volatile"])
        d = {"trend_up": 4e-5, "trend_down": -4e-5, "range": 0.0, "volatile": 0.0}[kind]
        v = {"trend_up": 6e-4, "trend_down": 6e-4, "range": 4e-4, "volatile": 1.2e-3}[kind]
        drift += [d] * int(length)
        vol += [v] * int(length)
    drift, vol = np.array(drift[:bars]), np.array(vol[:bars])
    rets = drift + vol * rng.standard_normal(bars)
    close = start_price * np.exp(np.cumsum(rets))
    open_ = np.concatenate([[start_price], close[:-1]])
    wick = np.abs(rng.standard_normal((2, bars))) * vol * close * 0.6
    high = np.maximum(open_, close) + wick[0]
    low = np.minimum(open_, close) - wick[1]
    idx = pd.date_range("2022-01-03", periods=bars, freq=TIMEFRAMES.get(timeframe, timeframe), tz="UTC")
    return pd.DataFrame({"open": open_, "high": high, "low": low, "close": close, "volume": rng.integers(50, 500, bars)}, index=idx).astype(float)


def fetch_ccxt(symbol: str, timeframe: str = "15m", limit: int = 5000, exchange: str = "phemex") -> pd.DataFrame:  # pragma: no cover - Netzwerk
    """Historische Kerzen über CCXT (öffentliche Endpunkte, kein API-Key nötig)."""
    try:
        import ccxt
    except ImportError as exc:
        raise SystemExit('CCXT fehlt: pip install -e ".[crypto]"') from exc
    ex = getattr(ccxt, exchange)({"enableRateLimit": True})
    rows: list[list[float]] = []
    since = None
    while len(rows) < limit:
        batch = ex.fetch_ohlcv(symbol, timeframe=timeframe, since=since, limit=min(1000, limit - len(rows)))
        if not batch:
            break
        rows += batch
        since = batch[-1][0] + 1
        if len(batch) < 2:
            break
    df = pd.DataFrame(rows, columns=["timestamp", *COLUMNS])
    df.index = pd.to_datetime(df.pop("timestamp"), unit="ms", utc=True)
    return _validate(df)


def fetch_mt5(symbol: str, timeframe: str = "15m", bars: int = 20_000) -> pd.DataFrame:  # pragma: no cover - nur Windows
    """Historische Kerzen aus einem laufenden MetaTrader-5-Terminal."""
    try:
        import MetaTrader5 as mt5
    except ImportError as exc:
        raise SystemExit("MetaTrader5-Paket fehlt (nur Windows): pip install MetaTrader5") from exc
    tf = {"1m": mt5.TIMEFRAME_M1, "5m": mt5.TIMEFRAME_M5, "15m": mt5.TIMEFRAME_M15, "30m": mt5.TIMEFRAME_M30,
          "1h": mt5.TIMEFRAME_H1, "4h": mt5.TIMEFRAME_H4, "1d": mt5.TIMEFRAME_D1}[timeframe]
    if not mt5.initialize():
        raise SystemExit(f"MT5-Initialisierung fehlgeschlagen: {mt5.last_error()}")
    rates = mt5.copy_rates_from_pos(symbol, tf, 0, bars)
    mt5.shutdown()
    df = pd.DataFrame(rates)
    df.index = pd.to_datetime(df.pop("time"), unit="s", utc=True)
    df = df.rename(columns={"tick_volume": "volume"})
    return _validate(df)
