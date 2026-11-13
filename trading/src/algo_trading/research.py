"""Kompletter Research-Lauf (Slide 3/4/7): Daten -> Market Analyst -> Strategy Researcher -> Coding Agent ->
Discovery (Batch-Backtest) -> Validation Gate -> Quant/Risk/Code Review -> Orchestrator -> Bericht."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import pandas as pd

from . import regime
from .agents import ResearchTeam, hypotheses_to_configs
from .config import Settings
from .discovery import discover, generate
from .journal import Journal
from .validation import validate

log = logging.getLogger("algo_trading.research")


def run_research(df: pd.DataFrame, settings: Settings, *, pair: str, timeframe: str, n_strategies: int = 1000,
                 top_k: int = 10, split: float = 0.7, seed: int = 42, workers: int | None = None,
                 data_source: str = "csv", team: ResearchTeam | None = None, journal: Journal | None = None) -> dict:
    team = team or ResearchTeam(settings)
    cut = df.index[int(len(df) * split)]
    df_is = df[df.index < cut]

    log.info("Market Analyst ...")
    reg = regime.summary(df_is)
    market = team.market_analyst(reg)
    log.info("Strategy Researcher ...")
    hyp = team.strategy_researcher(market.data, pair, timeframe)
    seeds = hypotheses_to_configs(hyp, pair, timeframe, settings.risk_per_trade, settings.min_rr)
    configs = generate(n_strategies, pair, timeframe, settings.risk_per_trade, settings.min_rr, seed,
                       market.data.get("family_weights"), seeds)

    log.info("Batch-Backtest von %d Strategien (In-Sample bis %s) ...", len(configs), cut)
    disc = discover(df_is, configs, settings.costs, workers)

    log.info("Validation Gate für Top %d ...", min(top_k, len(disc.ranked)))
    candidates = []
    for res in disc.ranked[:top_k]:
        paper = journal.paper_stats(res.config.id) if journal else None
        v = validate(df, cut, res, settings.costs, n_tested=len(configs), paper_stats=paper)
        candidates.append({"id": res.config.id, "family": res.config.family, "params": res.config.params,
                           "risk": res.config.risk, "hypothesis": res.config.hypothesis, "passed": v.passed,
                           "gates": v.gates, **v.details})
    candidates.sort(key=lambda c: (c["passed"], c["out_of_sample"]["expectancy_r"]), reverse=True)
    disc.funnel.passed_validation = sum(c["passed"] for c in candidates)

    slim = [{k: c[k] for k in ("id", "family", "params", "passed", "gates", "in_sample", "out_of_sample", "monte_carlo")} for c in candidates]
    log.info("Quant Analyst, Risk Reviewer, Code Reviewer ...")
    quant = team.quant_analyst(slim)
    risk = team.risk_reviewer(slim)
    assumptions = {"costs": vars(settings.costs), "split": str(cut), "fill": "Eröffnung der Folgekerze", "stop_first": True}
    code = team.code_reviewer(candidates[0] if candidates else (configs[0].to_dict() if configs else {}), assumptions)
    funnel = vars(disc.funnel)
    log.info("Lead Orchestrator ...")
    orch = team.orchestrator({"data_source": data_source, "funnel": funnel, "family_stats": disc.family_stats, "market": market.data,
                              "quant": quant.data, "risk": risk.data, "code_review": code.data})

    sources = {a.source for a in (market, hyp, quant, risk, code, orch)}
    return {
        "created": datetime.now(timezone.utc).isoformat(), "pair": pair, "timeframe": timeframe,
        "ai_mode": "Claude " + settings.model if sources == {"claude"} else ("gemischt" if "claude" in sources else "Vorlagen-Modus (kein API-Key)"),
        "data": {"source": data_source, "bars": len(df), "start": str(df.index[0]), "end": str(df.index[-1])},
        "funnel": funnel, "family_stats": disc.family_stats, "regime": reg,
        "market": market.data, "hypotheses": hyp.data, "candidates": candidates,
        "quant": quant.data, "risk": risk.data, "code_review": code.data, "orchestrator": orch.data,
        "assumptions": assumptions,
    }
