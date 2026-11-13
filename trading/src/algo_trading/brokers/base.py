from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class OrderRequest:
    symbol: str
    side: str  # "buy" | "sell"
    size: float
    price: float
    stop: float
    target: float | None

    def summary(self, risk_amount: float) -> str:
        tgt = f"{self.target:g}" if self.target is not None else "-"
        return (f"{self.symbol} {self.side.upper()} Größe {self.size:.4f} @ ~{self.price:g} | Stop {self.stop:g} | "
                f"Ziel {tgt} | max. Risiko {risk_amount:.2f}")


class Broker(Protocol):
    name: str
    mode: str  # "paper" | "dry_run" | "live"

    def place(self, order: OrderRequest) -> dict: ...

    def close(self, symbol: str, side: str, size: float, price: float, broker_ref: str | None) -> dict: ...
