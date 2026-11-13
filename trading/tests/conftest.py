import pytest

from algo_trading.config import Costs, Settings
from algo_trading.data import synthetic_ohlcv


@pytest.fixture(scope="session")
def df():
    return synthetic_ohlcv(6000, "15m", seed=3)


@pytest.fixture
def settings(tmp_path):
    return Settings(journal_path=tmp_path / "j.db", reports_dir=tmp_path / "reports", webhook_secret="geheim",
                    allowed_symbols=("EURUSD", "XAUUSD"), costs=Costs())
