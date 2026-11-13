import numpy as np
import pytest

from algo_trading.backtest import run
from algo_trading.config import Costs, Settings
from algo_trading.risk import RiskManager, position_size
from algo_trading.strategies import StrategyConfig, clamp_params
from algo_trading.validation import BLOCKED, PASSED, REQUIRED, monte_carlo, multiple_testing, validate


def test_position_size_one_percent():
    size, amount = position_size(10_000, 0.01, entry=1.1000, stop=1.0950, value_per_unit=1.0)
    assert amount == 100 and size == pytest.approx(100 / 0.005)


def test_risk_limits():
    rm = RiskManager(Settings(daily_loss_limit=0.04, total_loss_limit=0.08, max_open_positions=2, min_rr=2.0))
    ok = rm.check(balance=10_000, day_start_balance=10_000, initial_balance=10_000, open_positions=0, entry=1.1, stop=1.09, target=1.12)
    assert ok.approved and ok.risk_amount == 100
    daily = rm.check(balance=9_650, day_start_balance=10_000, initial_balance=10_000, open_positions=0, entry=1.1, stop=1.09, target=1.12)
    assert not daily.approved and "Tagesverlustlimit" in daily.reasons[0]
    total = rm.check(balance=9_250, day_start_balance=9_250, initial_balance=10_000, open_positions=0, entry=1.1, stop=1.09, target=1.12)
    assert any("Gesamtverlustlimit" in r for r in total.reasons)
    rr = rm.check(balance=10_000, day_start_balance=10_000, initial_balance=10_000, open_positions=2, entry=1.1, stop=1.09, target=1.105)
    assert len(rr.reasons) == 2


def test_monte_carlo_flags_losers():
    assert monte_carlo(np.full(50, -0.5), 0.01)["status"] == "FAILED"
    good = monte_carlo(np.tile([2.0, -1.0], 50), 0.01)
    assert good["status"] == PASSED and good["prob_loss"] < 0.05


def test_multiple_testing_gets_stricter():
    assert multiple_testing(3.0, 1)["status"] == PASSED
    assert multiple_testing(3.0, 10_000)["status"] != PASSED


def test_live_blocked_without_paper(df):
    cfg = StrategyConfig("trend", clamp_params("trend", {}))
    res = run(df, cfg, Costs())
    v = validate(df, df.index[int(len(df) * 0.7)], res, Costs(), n_tested=100)
    assert v.gates["paper_trading"] == REQUIRED and v.gates["live"] == BLOCKED
    assert set(v.gates) >= {"backtest", "out_of_sample", "walk_forward", "monte_carlo", "regimes", "overfitting"}
