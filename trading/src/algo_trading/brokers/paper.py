from __future__ import annotations

from .base import OrderRequest


class PaperBroker:
    """Simulierte Ausführung zum aktuellen Preis plus Slippage - kein echtes Geld."""

    name = "paper"
    mode = "paper"

    def __init__(self, slippage: float = 0.0):
        self.slippage = slippage

    def place(self, order: OrderRequest) -> dict:
        direction = 1 if order.side == "buy" else -1
        return {"status": "open", "fill_price": order.price + direction * self.slippage, "broker_ref": None}

    def close(self, symbol: str, side: str, size: float, price: float, broker_ref: str | None) -> dict:
        direction = 1 if side == "buy" else -1
        return {"status": "closed", "fill_price": price - direction * self.slippage}
