import numpy as np
import pandas as pd

from algo_trading.backtest import run
from algo_trading.config import Costs
from algo_trading.journal import Journal
from algo_trading.paper import PaperRunner, closed_bars
from algo_trading.pipeline import SignalPipeline
from algo_trading.strategies import StrategyConfig, clamp_params


def _runner(settings, df, cfg):
    feed = {"df": df.iloc[:300]}
    p = SignalPipeline(settings, Journal(":memory:", 10_000))
    r = PaperRunner(p, cfg, "EURUSD", lambda: feed["df"], pd.Timedelta("15min"))
    return r, p, feed


def test_closed_bars_drops_forming_candle(df):
    now = df.index[100] + pd.Timedelta("10min")
    assert closed_bars(df, pd.Timedelta("15min"), now).index[-1] == df.index[99]


def test_paper_runner_matches_backtest_direction(df, settings):
    cfg = StrategyConfig("breakout", clamp_params("breakout", {"lookback": 20, "vol_filter": 0.8, "sl_atr": 1.0,
                                                               "tp_atr": 2.0, "max_bars": 40}))
    r, p, feed = _runner(settings, df, cfg)
    far = df.index[-1] + pd.Timedelta("1D")
    assert "Start" in r.step(far)[0]
    assert p.journal.orders() == []  # beim ersten Start wird nicht gehandelt
    feed["df"] = df.iloc[:2500]
    events = r.step(far)
    assert any("Signal" in e for e in events)
    closed = p.journal.orders(status="closed")
    assert closed and all(o["strategy_id"] == cfg.id for o in closed)
    # gleiche Einstiegsrichtungen wie der Backtest im selben Zeitraum
    bt = run(df.iloc[:2500], cfg, Costs(0, 0, 0))
    bt_sides = ["buy" if t.direction > 0 else "sell" for t in bt.trades if t.entry_time > df.index[299]]
    paper_sides = [o["side"] for o in p.journal.orders() if o["status"] in ("open", "closed")]
    assert paper_sides[:5] == bt_sides[:5]
    # erneuter Lauf ohne neue Kerzen erzeugt nichts
    assert r.step(far) == []


def test_paper_runner_respects_max_one_position(df, settings):
    cfg = StrategyConfig("momentum", clamp_params("momentum", {}))
    r, p, feed = _runner(settings, df, cfg)
    far = df.index[-1] + pd.Timedelta("1D")
    r.step(far)
    feed["df"] = df
    r.step(far)
    assert len(p.journal.orders(status="open")) <= 1
    assert np.isfinite(p.journal.balance)
