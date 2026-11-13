"""Execution Layer. Standard ist Paper-Trading; echte Broker laufen im Dry-Run, solange LIVE_TRADING nicht aktiv ist."""
from __future__ import annotations

from ..config import Settings
from .base import Broker, OrderRequest
from .paper import PaperBroker


def make_broker(settings: Settings) -> Broker:
    if settings.broker == "paper":
        return PaperBroker(settings.costs.slippage)
    if settings.broker == "ccxt":
        from .ccxt_broker import CcxtBroker

        return CcxtBroker(dry_run=not settings.live_trading)
    if settings.broker == "mt5":
        from .mt5_broker import Mt5Broker

        return Mt5Broker(dry_run=not settings.live_trading)
    raise ValueError(f"Unbekannter Broker: {settings.broker} (paper | ccxt | mt5)")


__all__ = ["Broker", "OrderRequest", "PaperBroker", "make_broker"]
