"""Risk Engine: Positionsgröße, Tages-/Gesamtverlustlimit, Exposure, Duplikat-Schutz."""
from __future__ import annotations

from dataclasses import dataclass

from .config import Settings


@dataclass
class RiskDecision:
    approved: bool
    size: float = 0.0
    risk_amount: float = 0.0
    reasons: list[str] | None = None


def position_size(balance: float, risk_pct: float, entry: float, stop: float, value_per_unit: float = 1.0) -> tuple[float, float]:
    """Größe = Risikobetrag / (Stop-Abstand x Wert pro Preis-Einheit). Gibt (Größe, Risikobetrag) zurück."""
    dist = abs(entry - stop)
    if dist <= 0 or value_per_unit <= 0:
        raise ValueError("Stop-Abstand und Wert pro Einheit müssen > 0 sein.")
    risk_amount = balance * risk_pct
    return risk_amount / (dist * value_per_unit), risk_amount


class RiskManager:
    def __init__(self, settings: Settings):
        self.s = settings

    def check(self, *, balance: float, day_start_balance: float, initial_balance: float, open_positions: int,
              entry: float, stop: float, target: float | None, value_per_unit: float = 1.0) -> RiskDecision:
        reasons: list[str] = []
        daily_floor = day_start_balance * (1 - self.s.daily_loss_limit)
        total_floor = initial_balance * (1 - self.s.total_loss_limit)
        risk_amount = balance * self.s.risk_per_trade
        if balance - risk_amount < daily_floor:
            reasons.append(f"Tagesverlustlimit: Konto {balance:.2f}, Untergrenze heute {daily_floor:.2f}")
        if balance - risk_amount < total_floor:
            reasons.append(f"Gesamtverlustlimit: Konto {balance:.2f}, Untergrenze {total_floor:.2f}")
        if open_positions >= self.s.max_open_positions:
            reasons.append(f"Maximal {self.s.max_open_positions} offene Positionen")
        if target is not None and abs(entry - stop) > 0:
            rr = abs(target - entry) / abs(entry - stop)
            if rr + 1e-9 < self.s.min_rr:
                reasons.append(f"CRV 1:{rr:.2f} unter Minimum 1:{self.s.min_rr:g}")
        if reasons:
            return RiskDecision(False, reasons=reasons)
        size, amount = position_size(balance, self.s.risk_per_trade, entry, stop, value_per_unit)
        return RiskDecision(True, size=size, risk_amount=amount, reasons=[])

    def limit_distance(self, balance: float, day_start_balance: float, initial_balance: float) -> dict:
        return {
            "to_daily_limit": balance - day_start_balance * (1 - self.s.daily_loss_limit),
            "to_total_limit": balance - initial_balance * (1 - self.s.total_loss_limit),
        }
