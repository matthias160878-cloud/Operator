"""Strategy Discovery Engine: Hypothesen -> Regeln -> Parametersuche -> Batch-Backtest -> Ranking."""
from __future__ import annotations

import os
import random
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, field

import pandas as pd

from .backtest import Result, run
from .config import Costs
from .indicators import atr
from .strategies import FAMILY_SPACE, StrategyConfig, clamp_params, random_params

# Erster Filter (In-Sample)
MIN_TRADES = 30
MIN_EXPECTANCY_R = 0.05
MIN_PROFIT_FACTOR = 1.15
MAX_DRAWDOWN = 0.30


@dataclass
class Funnel:
    generated: int = 0
    backtested: int = 0
    passed_filter: int = 0
    passed_validation: int = 0


@dataclass
class DiscoveryResult:
    funnel: Funnel
    ranked: list[Result] = field(default_factory=list)  # gefiltert und sortiert (bestes zuerst)
    family_stats: dict = field(default_factory=dict)


def generate(n: int, pair: str, timeframe: str, risk: float, min_rr: float, seed: int = 42,
             family_weights: dict[str, float] | None = None, seeds: list[StrategyConfig] | None = None) -> list[StrategyConfig]:
    """Erzeugt n eindeutige Strategie-Konfigurationen; KI-Hypothesen (seeds) zuerst."""
    rng = random.Random(seed)
    weights = {f: max(0.0, float((family_weights or {}).get(f, 1.0))) for f in FAMILY_SPACE}
    if sum(weights.values()) <= 0:
        weights = {f: 1.0 for f in FAMILY_SPACE}
    families, w = zip(*weights.items())
    out: dict[str, StrategyConfig] = {s.id: s for s in (seeds or [])}
    attempts = 0
    while len(out) < n and attempts < n * 20:
        attempts += 1
        fam = rng.choices(families, weights=w)[0]
        cfg = StrategyConfig(fam, random_params(fam, rng, min_rr), pair, timeframe, risk)
        out.setdefault(cfg.id, cfg)
    return list(out.values())[:n]


def neighbours(cfg: StrategyConfig, k: int, seed: int = 0) -> list[StrategyConfig]:
    """Parameter-Nachbarn (für Walk-Forward-Reoptimierung und Robustheit)."""
    from .strategies import COMMON_SPACE

    rng = random.Random(seed)
    space = {**FAMILY_SPACE[cfg.family], **COMMON_SPACE}
    out = []
    for _ in range(k):
        params = dict(cfg.params)
        for key, (_, _, step) in space.items():
            if rng.random() < 0.5:
                params[key] = params[key] + rng.choice([-2, -1, 1, 2]) * step
        out.append(StrategyConfig(cfg.family, clamp_params(cfg.family, params), cfg.pair, cfg.timeframe, cfg.risk, cfg.hypothesis))
    return out


def passes_filter(m: dict) -> bool:
    return (m["trades"] >= MIN_TRADES and m["expectancy_r"] >= MIN_EXPECTANCY_R
            and m["profit_factor"] >= MIN_PROFIT_FACTOR and m["max_drawdown"] <= MAX_DRAWDOWN)


def score(m: dict) -> float:
    return m["sharpe"] * (1 - m["max_drawdown"])


_WORKER: dict = {}


def _init(df: pd.DataFrame, costs: Costs) -> None:
    _WORKER["df"], _WORKER["costs"], _WORKER["atr"] = df, costs, atr(df)


def _run_chunk(cfgs: list[StrategyConfig]) -> list[Result]:
    return [run(_WORKER["df"], c, _WORKER["costs"], atr_series=_WORKER["atr"]) for c in cfgs]


def batch_backtest(df: pd.DataFrame, configs: list[StrategyConfig], costs: Costs, workers: int | None = None) -> list[Result]:
    workers = workers if workers is not None else min(8, os.cpu_count() or 1)
    if workers <= 1 or len(configs) < 50:
        _init(df, costs)
        return _run_chunk(configs)
    size = max(10, len(configs) // (workers * 4))
    chunks = [configs[i:i + size] for i in range(0, len(configs), size)]
    with ProcessPoolExecutor(max_workers=workers, initializer=_init, initargs=(df, costs)) as pool:
        return [r for part in pool.map(_run_chunk, chunks) for r in part]


def discover(df_is: pd.DataFrame, configs: list[StrategyConfig], costs: Costs, workers: int | None = None) -> DiscoveryResult:
    results = batch_backtest(df_is, configs, costs, workers)
    funnel = Funnel(generated=len(configs), backtested=sum(1 for r in results if r.metrics["trades"] > 0))
    passed = [r for r in results if passes_filter(r.metrics)]
    funnel.passed_filter = len(passed)
    passed.sort(key=lambda r: score(r.metrics), reverse=True)
    fam_stats = {}
    for fam in FAMILY_SPACE:
        rs = [r for r in results if r.config.family == fam]
        fam_stats[fam] = {
            "tested": len(rs),
            "passed_filter": sum(1 for r in passed if r.config.family == fam),
            "median_expectancy_r": float(pd.Series([r.metrics["expectancy_r"] for r in rs]).median()) if rs else 0.0,
        }
    return DiscoveryResult(funnel, passed, fam_stats)
