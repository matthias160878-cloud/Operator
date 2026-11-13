from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[2]


def _f(name: str, default: float) -> float:
    raw = os.environ.get(name, "").strip()
    return float(raw) if raw else default


def _i(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    return int(raw) if raw else default


def _s(name: str, default: str) -> str:
    raw = os.environ.get(name, "").strip()
    return raw or default


@dataclass(frozen=True)
class Costs:
    """Handelskosten in Preis-Einheiten (Spread, Slippage) bzw. als Anteil vom Nominalwert pro Seite."""

    spread: float = 0.00008
    slippage: float = 0.00002
    commission_rate: float = 0.00003


@dataclass(frozen=True)
class Settings:
    anthropic_api_key: str | None = None
    model: str = "claude-fable-5-2"
    agent_model: str = "claude-fable-5-2"
    effort: str = "high"

    risk_per_trade: float = 0.01
    daily_loss_limit: float = 0.04
    total_loss_limit: float = 0.08
    max_open_positions: int = 3
    min_rr: float = 2.0
    account_balance: float = 10_000.0

    costs: Costs = field(default_factory=Costs)

    broker: str = "paper"
    live_trading: bool = False
    allowed_symbols: tuple[str, ...] = ("EURUSD", "GBPUSD", "XAUUSD", "GER40", "BTC/USDT")
    webhook_secret: str = ""
    webhook_port: int = 8765
    journal_path: Path = PROJECT_DIR / "data" / "journal.db"
    reports_dir: Path = PROJECT_DIR / "reports"

    @classmethod
    def from_env(cls) -> "Settings":
        journal = Path(_s("JOURNAL_PATH", "data/journal.db"))
        if not journal.is_absolute():
            journal = PROJECT_DIR / journal
        model = _s("TRADING_MODEL", "claude-fable-5-2")
        return cls(
            anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY") or None,
            model=model,
            agent_model=_s("TRADING_AGENT_MODEL", model),
            effort=_s("TRADING_EFFORT", "high"),
            risk_per_trade=_f("RISK_PER_TRADE", 0.01),
            daily_loss_limit=_f("DAILY_LOSS_LIMIT", 0.04),
            total_loss_limit=_f("TOTAL_LOSS_LIMIT", 0.08),
            max_open_positions=_i("MAX_OPEN_POSITIONS", 3),
            min_rr=_f("MIN_RR", 2.0),
            account_balance=_f("ACCOUNT_BALANCE", 10_000.0),
            costs=Costs(
                spread=_f("SPREAD", 0.00008),
                slippage=_f("SLIPPAGE", 0.00002),
                commission_rate=_f("COMMISSION_RATE", 0.00003),
            ),
            broker=_s("BROKER", "paper").lower(),
            live_trading=_s("LIVE_TRADING", "false").lower() in {"1", "true", "yes", "ja"},
            allowed_symbols=tuple(
                s.strip().upper() for s in _s("ALLOWED_SYMBOLS", "EURUSD,GBPUSD,XAUUSD,GER40,BTC/USDT").split(",") if s.strip()
            ),
            webhook_secret=os.environ.get("WEBHOOK_SECRET", ""),
            webhook_port=_i("WEBHOOK_PORT", 8765),
            journal_path=journal,
        )
