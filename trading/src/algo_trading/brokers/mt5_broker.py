"""Forex/CFD-Ausführung über das MetaTrader5-Python-Paket (nur Windows, laufendes Terminal)."""
from __future__ import annotations

import os

from .base import OrderRequest


class Mt5Broker:  # pragma: no cover - braucht MT5-Terminal
    name = "mt5"

    def __init__(self, dry_run: bool = True):
        self.dry_run = dry_run
        self.mode = "dry_run" if dry_run else "live"

    def _mt5(self):
        try:
            import MetaTrader5 as mt5
        except ImportError as exc:
            raise SystemExit("MetaTrader5-Paket fehlt (nur Windows): pip install MetaTrader5") from exc
        login = os.environ.get("MT5_LOGIN")
        ok = mt5.initialize(login=int(login), password=os.environ.get("MT5_PASSWORD"), server=os.environ.get("MT5_SERVER")) if login else mt5.initialize()
        if not ok:
            raise RuntimeError(f"MT5-Initialisierung fehlgeschlagen: {mt5.last_error()}")
        return mt5

    def place(self, order: OrderRequest) -> dict:
        if self.dry_run:
            return {"status": "dry_run", "fill_price": order.price, "broker_ref": None, "note": "Dry-Run: nichts gesendet"}
        mt5 = self._mt5()
        tick = mt5.symbol_info_tick(order.symbol)
        req = {
            "action": mt5.TRADE_ACTION_DEAL, "symbol": order.symbol, "volume": round(order.size, 2),
            "type": mt5.ORDER_TYPE_BUY if order.side == "buy" else mt5.ORDER_TYPE_SELL,
            "price": tick.ask if order.side == "buy" else tick.bid, "sl": order.stop, "tp": order.target or 0.0,
            "deviation": 10, "magic": 58058, "comment": "algo-trading", "type_filling": mt5.ORDER_FILLING_IOC,
        }
        res = mt5.order_send(req)
        if res is None or res.retcode != mt5.TRADE_RETCODE_DONE:
            raise RuntimeError(f"MT5-Order abgelehnt: {getattr(res, 'comment', mt5.last_error())}")
        return {"status": "open", "fill_price": res.price, "broker_ref": str(res.order)}

    def close(self, symbol: str, side: str, size: float, price: float, broker_ref: str | None) -> dict:
        if self.dry_run:
            return {"status": "closed", "fill_price": price}
        mt5 = self._mt5()
        tick = mt5.symbol_info_tick(symbol)
        buy_close = side == "sell"
        req = {"action": mt5.TRADE_ACTION_DEAL, "symbol": symbol, "volume": round(size, 2),
               "type": mt5.ORDER_TYPE_BUY if buy_close else mt5.ORDER_TYPE_SELL,
               "position": int(broker_ref) if broker_ref else 0, "price": tick.ask if buy_close else tick.bid,
               "deviation": 10, "magic": 58058, "type_filling": mt5.ORDER_FILLING_IOC}
        res = mt5.order_send(req)
        return {"status": "closed", "fill_price": getattr(res, "price", price)}
