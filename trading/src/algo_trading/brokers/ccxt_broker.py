"""Krypto-Ausführung über CCXT (z. B. Phemex). API-Key nur Read+Trade, ohne Withdraw, IP-beschränkt."""
from __future__ import annotations

import os

from .base import OrderRequest


class CcxtBroker:  # pragma: no cover - braucht Börsenzugang
    name = "ccxt"

    def __init__(self, dry_run: bool = True):
        self.dry_run = dry_run
        self.mode = "dry_run" if dry_run else "live"
        self._ex = None

    @property
    def exchange(self):
        if self._ex is None:
            try:
                import ccxt
            except ImportError as exc:
                raise SystemExit('CCXT fehlt: pip install -e ".[crypto]"') from exc
            self._ex = getattr(ccxt, os.environ.get("CCXT_EXCHANGE", "phemex"))({
                "apiKey": os.environ.get("CCXT_API_KEY"), "secret": os.environ.get("CCXT_SECRET"), "enableRateLimit": True,
            })
        return self._ex

    def place(self, order: OrderRequest) -> dict:
        if self.dry_run:
            return {"status": "dry_run", "fill_price": order.price, "broker_ref": None, "note": "Dry-Run: nichts gesendet"}
        ex = self.exchange
        entry = ex.create_order(order.symbol, "market", order.side, order.size)
        exit_side = "sell" if order.side == "buy" else "buy"
        # Stop und Ziel als reduceOnly-Orders; Parameternamen variieren je Börse - vor Live-Einsatz im Testnet prüfen.
        ex.create_order(order.symbol, "stop", exit_side, order.size, None, {"stopPrice": order.stop, "reduceOnly": True})
        if order.target is not None:
            ex.create_order(order.symbol, "limit", exit_side, order.size, order.target, {"reduceOnly": True})
        return {"status": "open", "fill_price": float(entry.get("average") or order.price), "broker_ref": str(entry.get("id"))}

    def close(self, symbol: str, side: str, size: float, price: float, broker_ref: str | None) -> dict:
        if self.dry_run:
            return {"status": "closed", "fill_price": price}
        exit_side = "sell" if side == "buy" else "buy"
        self.exchange.cancel_all_orders(symbol)
        res = self.exchange.create_order(symbol, "market", exit_side, size, None, {"reduceOnly": True})
        return {"status": "closed", "fill_price": float(res.get("average") or price)}
