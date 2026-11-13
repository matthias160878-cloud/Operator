"""Validation Gate: Out-of-Sample, Walk-Forward, Monte Carlo, Regime-Test, Multiple-Testing-Korrektur.

Status je Stufe: PASSED / REVIEW / FAILED. Paper-Trading ist danach immer REQUIRED,
Live-Deployment bleibt BLOCKED, bis genug Paper-Trades mit positivem Erwartungswert vorliegen.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from statistics import NormalDist

import numpy as np
import pandas as pd

from .backtest import Result, equity_curve, max_drawdown, metrics, run
from .config import Costs
from .discovery import MIN_EXPECTANCY_R, neighbours, passes_filter, score
from .indicators import atr
from .regime import REGIMES, classify

PASSED, REVIEW, FAILED, REQUIRED, BLOCKED = "PASSED", "REVIEW", "FAILED", "REQUIRED", "BLOCKED"
MIN_PAPER_TRADES = 30


@dataclass
class Validation:
    strategy_id: str
    gates: dict[str, str] = field(default_factory=dict)
    details: dict = field(default_factory=dict)

    @property
    def passed(self) -> bool:
        return all(self.gates.get(g) == PASSED for g in ("backtest", "out_of_sample", "walk_forward")) and self.gates.get("monte_carlo") != FAILED


def _slice(result: Result, start=None, end=None) -> np.ndarray:
    return np.array([t.r for t in result.trades if (start is None or t.entry_time >= start) and (end is None or t.entry_time < end)])


def monte_carlo(r: np.ndarray, risk: float, sims: int = 1000, seed: int = 1) -> dict:
    if len(r) < 10:
        return {"status": FAILED, "reason": "zu wenige Trades"}
    rng = np.random.default_rng(seed)
    samples = rng.choice(r, size=(sims, len(r)), replace=True)
    dds = np.array([max_drawdown(equity_curve(s, risk)) for s in samples])
    finals = np.prod(1 + risk * samples, axis=1) - 1
    p95_dd, p_loss = float(np.percentile(dds, 95)), float((finals < 0).mean())
    status = PASSED if p95_dd <= 0.20 and p_loss <= 0.10 else (REVIEW if p95_dd <= 0.35 and p_loss <= 0.30 else FAILED)
    return {"status": status, "p95_max_drawdown": p95_dd, "prob_loss": p_loss, "median_return": float(np.median(finals))}


def walk_forward(df: pd.DataFrame, cfg_result: Result, costs: Costs, folds: int = 5, candidates: int = 16) -> dict:
    """Verankerter Walk-Forward: in jedem Fold wird aus Kandidat + Nachbarn der Beste auf den
    bisherigen Daten gewählt und auf dem nächsten Abschnitt getestet."""
    a = atr(df)
    pool = [cfg_result] + [run(df, c, costs, atr_series=a) for c in neighbours(cfg_result.config, candidates, seed=11)]
    edges = df.index[np.linspace(0, len(df) - 1, folds + 1).astype(int)]
    oos_r, fold_rows = [], []
    for k in range(1, folds):
        train_end, test_end = edges[k], edges[k + 1]
        best = max(pool, key=lambda res: score(metrics(_slice(res, None, train_end), res.config.risk, df.index[df.index < train_end])))
        test_r = _slice(best, train_end, test_end)
        oos_r.extend(test_r.tolist())
        fold_rows.append({"fold": k, "chosen": best.config.id, "trades": int(len(test_r)), "expectancy_r": float(test_r.mean()) if len(test_r) else 0.0})
    oos = np.array(oos_r)
    profitable = sum(1 for f in fold_rows if f["expectancy_r"] > 0)
    ok = len(oos) >= 20 and oos.mean() > 0 and profitable >= int(np.ceil(0.6 * len(fold_rows)))
    weak = len(oos) >= 10 and oos.mean() > 0
    return {"status": PASSED if ok else (REVIEW if weak else FAILED), "folds": fold_rows,
            "oos_trades": int(len(oos)), "oos_expectancy_r": float(oos.mean()) if len(oos) else 0.0}


def regime_test(df: pd.DataFrame, result: Result) -> dict:
    labels = classify(df)
    per = {}
    for reg in REGIMES:
        rs = np.array([t.r for t in result.trades if labels.asof(t.entry_time) == reg])
        per[reg] = {"trades": int(len(rs)), "expectancy_r": float(rs.mean()) if len(rs) else 0.0}
    losing = [k for k, v in per.items() if v["trades"] >= 10 and v["expectancy_r"] < 0]
    return {"status": REVIEW if losing else PASSED, "per_regime": per, "losing_regimes": losing}


def multiple_testing(t_stat: float, n_tested: int, alpha: float = 0.05) -> dict:
    """Bonferroni-Schwelle: Je mehr Varianten getestet wurden, desto höher muss die t-Statistik sein."""
    threshold = NormalDist().inv_cdf(1 - alpha / max(1, n_tested))
    return {"status": PASSED if t_stat >= threshold else REVIEW, "t_stat": t_stat, "required_t": threshold, "n_tested": n_tested}


def validate(df: pd.DataFrame, split: pd.Timestamp, candidate: Result, costs: Costs, n_tested: int,
             paper_stats: dict | None = None) -> Validation:
    v = Validation(candidate.config.id)
    full = run(df, candidate.config, costs)
    is_r, oos_r = _slice(full, None, split), _slice(full, split, None)
    is_m = metrics(is_r, candidate.config.risk, df.index[df.index < split])
    oos_m = metrics(oos_r, candidate.config.risk, df.index[df.index >= split])
    v.details["in_sample"], v.details["out_of_sample"] = is_m, oos_m

    v.gates["backtest"] = PASSED if passes_filter(is_m) else FAILED
    oos_ok = oos_m["trades"] >= 10 and oos_m["expectancy_r"] >= MIN_EXPECTANCY_R and oos_m["profit_factor"] >= 1.1
    v.gates["out_of_sample"] = PASSED if oos_ok else (REVIEW if oos_m["expectancy_r"] > 0 else FAILED)

    wf = walk_forward(df, full, costs)
    v.details["walk_forward"], v.gates["walk_forward"] = wf, wf["status"]
    mc = monte_carlo(full.r_values, candidate.config.risk)
    v.details["monte_carlo"], v.gates["monte_carlo"] = mc, mc["status"]
    rt = regime_test(df, full)
    v.details["regimes"], v.gates["regimes"] = rt, rt["status"]
    mt = multiple_testing(is_m["t_stat"], n_tested)
    v.details["multiple_testing"], v.gates["overfitting"] = mt, mt["status"]

    paper = paper_stats or {}
    paper_ok = paper.get("trades", 0) >= MIN_PAPER_TRADES and paper.get("expectancy_r", 0.0) > 0
    v.gates["paper_trading"] = PASSED if paper_ok else REQUIRED
    v.gates["live"] = REVIEW if (paper_ok and v.passed) else BLOCKED
    v.details["paper"] = paper
    return v
