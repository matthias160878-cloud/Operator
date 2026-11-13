import numpy as np
import pandas as pd
import pytest

from algo_trading import indicators as ind
from algo_trading.backtest import max_drawdown, run
from algo_trading.config import Costs
from algo_trading.discovery import discover, generate
from algo_trading.strategies import FAMILY_SPACE, StrategyConfig, clamp_params, signals


def _bars(closes):
    c = np.asarray(closes, dtype=float)
    o = np.concatenate([[c[0]], c[:-1]])
    idx = pd.date_range("2024-01-01", periods=len(c), freq="15min", tz="UTC")
    return pd.DataFrame({"open": o, "high": np.maximum(o, c) + 0.0005, "low": np.minimum(o, c) - 0.0005, "close": c, "volume": 1.0}, index=idx)


def test_indicators_have_no_lookahead(df):
    full = ind.ema(df["close"], 20)
    part = ind.ema(df["close"].iloc[:3000], 20)
    assert np.allclose(full.iloc[:3000].dropna(), part.dropna())
    hi, _ = ind.donchian(df, 20)
    assert hi.iloc[100] == df["high"].iloc[80:100].max()  # aktuelle Kerze ausgeschlossen


def test_signals_only_use_past_data(df):
    cfg = StrategyConfig("breakout", clamp_params("breakout", {}))
    full = signals(df, cfg)
    part = signals(df.iloc[:4000], cfg)
    assert (full[:4000] == part).all()


@pytest.mark.parametrize("family", list(FAMILY_SPACE))
def test_each_family_trades(df, family):
    cfg = StrategyConfig(family, clamp_params(family, {}))
    res = run(df, cfg, Costs())
    assert res.metrics["trades"] > 0
    for t in res.trades:
        assert t.entry_time < t.exit_time or t.reason in {"stop", "target", "end"}


def test_costs_reduce_results(df):
    cfg = StrategyConfig("trend", clamp_params("trend", {"fast": 9, "slow": 50, "adx_min": 15}))
    free = run(df, cfg, Costs(0, 0, 0)).r_values
    costly = run(df, cfg, Costs(0.0005, 0.0002, 0.0001)).r_values
    assert costly.sum() < free.sum()


def test_target_hit_gives_rr_multiple():
    closes = [1.0] * 30 + [1.0 + 0.002 * i for i in range(1, 60)]
    df = _bars(closes)
    cfg = StrategyConfig("momentum", clamp_params("momentum", {"roc_period": 5, "roc_atr_mult": 1.0, "trend_ema": 50,
                                                               "sl_atr": 1.0, "tp_atr": 2.0, "max_bars": 200}))
    sig = np.zeros(len(df), dtype=np.int8)
    sig[35] = 1
    res = run(df, cfg, Costs(0, 0, 0), sig=sig)
    assert res.trades[0].reason == "target"
    assert res.trades[0].r == pytest.approx(2.0, abs=1e-6)


def test_max_drawdown():
    assert max_drawdown(np.array([1.1, 0.88, 0.99])) == pytest.approx(0.2)


def test_clamp_keeps_params_valid():
    p = clamp_params("trend", {"fast": 999, "slow": 1, "sl_atr": "x"})
    assert p["fast"] < p["slow"] and 1.0 <= p["sl_atr"] <= 3.5


def test_discovery_funnel(df):
    cfgs = generate(60, "EURUSD", "15m", 0.01, 2.0, seed=1)
    assert len(cfgs) == 60 and all(c.rr >= 2.0 - 1e-9 for c in cfgs)
    res = discover(df, cfgs, Costs(), workers=1)
    assert res.funnel.generated == 60
    assert res.funnel.passed_filter == len(res.ranked) <= res.funnel.backtested


def test_ccxt_options_pass_proxy(monkeypatch):
    from algo_trading.data import ccxt_options

    monkeypatch.setenv("HTTPS_PROXY", "http://proxy:8080")
    assert ccxt_options({"apiKey": "k"})["httpsProxy"] == "http://proxy:8080"
    monkeypatch.delenv("HTTPS_PROXY")
    monkeypatch.delenv("https_proxy", raising=False)
    assert "httpsProxy" not in ccxt_options()


def test_drop_closed_hours():
    from algo_trading.data import drop_closed_hours

    idx = pd.date_range("2026-11-13 20:00", "2026-11-15 23:00", freq="1h", tz="UTC")  # Fr 20:00 bis So 23:00
    df = pd.DataFrame({"open": 1.0, "high": 1.0, "low": 1.0, "close": 1.0, "volume": 0.0}, index=idx)
    kept = drop_closed_hours(df).index
    assert list(kept.strftime("%a %H")) == ["Fri 20", "Sun 22", "Sun 23"]
