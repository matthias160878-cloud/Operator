"""Backtest-Engine mit realistischen Kosten (Spread, Slippage, Kommission) und ATR-basierten Stops.

Ergebnisse werden in R-Multiples gemessen (Gewinn/Verlust relativ zum Risiko bis zum Stop) und
mit festem Kontorisiko pro Trade (Standard 1 %) zu einer Kapitalkurve verzinst.
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from .config import Costs
from .indicators import atr
from .strategies import StrategyConfig, signals


@dataclass
class Trade:
    entry_time: pd.Timestamp
    exit_time: pd.Timestamp
    direction: int
    entry: float
    exit: float
    stop: float
    target: float
    r: float
    reason: str


@dataclass
class Result:
    config: StrategyConfig
    trades: list[Trade] = field(default_factory=list)
    metrics: dict = field(default_factory=dict)

    @property
    def r_values(self) -> np.ndarray:
        return np.array([t.r for t in self.trades], dtype=float)


def run(df: pd.DataFrame, cfg: StrategyConfig, costs: Costs, sig: np.ndarray | None = None, atr_series: pd.Series | None = None) -> Result:
    p = cfg.params
    if sig is None:
        sig = signals(df, cfg)
    a = (atr_series if atr_series is not None else atr(df)).to_numpy()
    o, h, l, c = (df[k].to_numpy() for k in ("open", "high", "low", "close"))
    idx = df.index
    half_spread = costs.spread / 2
    trades: list[Trade] = []

    pos = 0
    entry = stop = target = risk_dist = 0.0
    entry_i = 0
    n = len(df)
    i = 1
    while i < n:
        if pos == 0:
            s = sig[i - 1]
            if s != 0 and not np.isnan(a[i - 1]) and a[i - 1] > 0:
                pos = int(s)
                entry = o[i] + pos * (half_spread + costs.slippage)
                risk_dist = p["sl_atr"] * a[i - 1]
                stop = entry - pos * risk_dist
                target = entry + pos * p["tp_atr"] * a[i - 1]
                entry_i = i
            else:
                i += 1
                continue
        # Position offen: Stop/Ziel innerhalb der Kerze prüfen (bei beidem zuerst Stop - konservativ)
        exit_px, reason = None, ""
        hit_stop = l[i] <= stop if pos > 0 else h[i] >= stop
        hit_tp = h[i] >= target if pos > 0 else l[i] <= target
        if hit_stop:
            gap = o[i] < stop if pos > 0 else o[i] > stop
            exit_px, reason = (o[i] if gap else stop), "stop"
        elif hit_tp:
            exit_px, reason = target, "target"
        elif i - entry_i >= p["max_bars"]:
            exit_px, reason = c[i], "time"
        elif i + 1 < n and sig[i] == -pos:
            exit_px, reason = o[i + 1], "reverse"
            i += 1
        elif i == n - 1:
            exit_px, reason = c[i], "end"
        if exit_px is not None:
            fill = exit_px - pos * (half_spread + costs.slippage)
            commission = costs.commission_rate * (abs(entry) + abs(fill))
            r = ((fill - entry) * pos - commission) / risk_dist
            trades.append(Trade(idx[entry_i], idx[i], pos, entry, fill, stop, target, float(r), reason))
            pos = 0
            if reason == "reverse":
                continue  # Gegensignal darf sofort neu einsteigen
        i += 1

    res = Result(cfg, trades)
    res.metrics = metrics(res.r_values, cfg.risk, df.index)
    return res


def equity_curve(r: np.ndarray, risk: float) -> np.ndarray:
    return np.cumprod(1 + risk * np.asarray(r, dtype=float))


def max_drawdown(equity: np.ndarray) -> float:
    if len(equity) == 0:
        return 0.0
    eq = np.concatenate([[1.0], equity])
    peak = np.maximum.accumulate(eq)
    return float(((peak - eq) / peak).max())


def metrics(r: np.ndarray, risk: float, index: pd.DatetimeIndex) -> dict:
    n = len(r)
    if n == 0:
        return {"trades": 0, "total_return": 0.0, "expectancy_r": 0.0, "win_rate": 0.0, "profit_factor": 0.0,
                "sharpe": 0.0, "max_drawdown": 0.0, "t_stat": 0.0}
    eq = equity_curve(r, risk)
    years = max((index[-1] - index[0]).total_seconds() / (365.25 * 86400), 1e-9)
    std = r.std(ddof=1) if n > 1 else 0.0
    gains, losses = r[r > 0].sum(), -r[r < 0].sum()
    return {
        "trades": int(n),
        "total_return": float(eq[-1] - 1),
        "expectancy_r": float(r.mean()),
        "win_rate": float((r > 0).mean()),
        "profit_factor": float(gains / losses) if losses > 0 else float("inf"),
        "sharpe": float(r.mean() / std * np.sqrt(n / years)) if std > 0 else 0.0,
        "max_drawdown": max_drawdown(eq),
        "t_stat": float(r.mean() / (std / np.sqrt(n))) if std > 0 else 0.0,
    }
