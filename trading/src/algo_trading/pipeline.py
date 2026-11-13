"""Signal-Workflow: TradingView-Alert -> Webhook -> Signal-Validierung -> Risk Check -> Broker -> Trade Journal.

Echtgeld: Ist LIVE_TRADING aktiv, wird eine Order NIE automatisch gesendet, sondern als
'pending_approval' abgelegt und erst mit `algo-trading approve <id>` (Bestätigung "JA") ausgeführt.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Callable

from .brokers import Broker, OrderRequest, make_broker
from .config import Settings
from .journal import Journal
from .risk import RiskManager

ACTIONS = {"buy", "sell", "close", "bar"}


@dataclass
class Outcome:
    status: str  # accepted | rejected | duplicate | pending_approval | dry_run | closed | updated
    reasons: list[str]
    order_id: int | None = None
    detail: dict | None = None

    def to_dict(self) -> dict:
        return {"status": self.status, "reasons": self.reasons, "order_id": self.order_id, "detail": self.detail or {}}


def signal_key(p: dict) -> str:
    if p.get("id"):
        return str(p["id"])
    raw = json.dumps([p.get(k) for k in ("strategy_id", "symbol", "action", "time", "price")], default=str)
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


def _num(p: dict, key: str) -> float | None:
    v = p.get(key)
    if v is None or v == "":
        return None
    return float(v)


class SignalPipeline:
    def __init__(self, settings: Settings, journal: Journal | None = None, broker: Broker | None = None):
        self.s = settings
        self.journal = journal or Journal(settings.journal_path, settings.account_balance)
        self.broker = broker or make_broker(settings)
        self.risk = RiskManager(settings)

    # 03 Signal-Validierung
    def validate(self, p: dict) -> tuple[dict | None, list[str]]:
        errs: list[str] = []
        action = str(p.get("action", p.get("side", ""))).lower()
        symbol = str(p.get("symbol", "")).upper()
        if action not in ACTIONS:
            errs.append(f"Unbekannte Aktion '{action}' (buy | sell | close | bar)")
        if self.s.allowed_symbols and symbol not in self.s.allowed_symbols:
            errs.append(f"Symbol '{symbol}' nicht in ALLOWED_SYMBOLS")
        try:
            price, stop, target, atr_v = (_num(p, k) for k in ("price", "stop", "take_profit", "atr"))
            high, low = _num(p, "high"), _num(p, "low")
            vpu = _num(p, "value_per_unit") or 1.0
        except (TypeError, ValueError):
            return None, errs + ["Zahlenfelder (price/stop/take_profit/atr/high/low) ungültig"]
        if price is None or price <= 0:
            errs.append("price fehlt")
        if action in {"buy", "sell"} and price:
            direction = 1 if action == "buy" else -1
            if stop is None and atr_v:  # ATR-basierter Stop, Ziel per Mindest-CRV
                stop = price - direction * 1.5 * atr_v
            if stop is None:
                errs.append("stop (oder atr) fehlt - keine Order ohne Stop-Loss")
            elif (stop - price) * direction >= 0:
                errs.append("Stop liegt auf der falschen Seite des Einstiegs")
            if stop is not None and target is None:
                target = price + direction * self.s.min_rr * abs(price - stop)
            if target is not None and stop is not None and (target - price) * direction <= 0:
                errs.append("Ziel liegt auf der falschen Seite des Einstiegs")
        if action == "bar" and (high is None or low is None):
            errs.append("bar braucht high und low")
        sig = {"action": action, "symbol": symbol, "price": price, "stop": stop, "target": target,
               "high": high, "low": low, "value_per_unit": vpu, "strategy_id": str(p.get("strategy_id", "manual"))}
        return (None if errs else sig), errs

    def process(self, payload: dict) -> Outcome:
        key = signal_key(payload)
        if not self.journal.record_signal(key, payload, "received"):
            return Outcome("duplicate", ["Signal wurde bereits verarbeitet"])
        sig, errs = self.validate(payload)
        if errs:
            self.journal.update_signal(key, "rejected", errs)
            return Outcome("rejected", errs)
        if sig["action"] == "close":
            out = self.close_symbol(sig["symbol"], sig["price"], "signal", sig["strategy_id"])
        elif sig["action"] == "bar":
            out = self.on_bar(sig["symbol"], sig["high"], sig["low"])
        else:
            out = self.open(sig, key)
        self.journal.update_signal(key, out.status, out.reasons)
        return out

    # 04 Risk Check + 05 Ausführung + 06 Journal
    def open(self, sig: dict, key: str) -> Outcome:
        j = self.journal
        open_count = len(j.orders(status="open")) + len(j.orders(status="pending_approval"))
        decision = self.risk.check(balance=j.balance, day_start_balance=j.day_start_balance(), initial_balance=j.initial_balance,
                                   open_positions=open_count, entry=sig["price"], stop=sig["stop"], target=sig["target"],
                                   value_per_unit=sig["value_per_unit"])
        if not decision.approved:
            return Outcome("rejected", decision.reasons or [])
        side = sig["action"]
        req = OrderRequest(sig["symbol"], side, decision.size, sig["price"], sig["stop"], sig["target"])
        base = dict(signal_key=key, strategy_id=sig["strategy_id"], symbol=sig["symbol"], side=side, size=decision.size,
                    entry=sig["price"], stop=sig["stop"], target=sig["target"], risk_amount=decision.risk_amount,
                    broker=self.broker.name, mode=self.broker.mode)
        if self.broker.mode == "live":
            oid = j.add_order(**base, status="pending_approval")
            return Outcome("pending_approval", [f"Freigabe nötig: algo-trading approve {oid}"], oid, {"summary": req.summary(decision.risk_amount)})
        res = self.broker.place(req)
        oid = j.add_order(**{**base, "entry": res["fill_price"]}, status=res["status"], broker_ref=res.get("broker_ref"))
        status = "dry_run" if res["status"] == "dry_run" else "accepted"
        return Outcome(status, [], oid, {"summary": req.summary(decision.risk_amount), **res})

    def approve(self, order_id: int, confirm: Callable[[str], bool]) -> Outcome:
        """Echtgeld-Freigabe pro Order. confirm() bekommt die Zusammenfassung und muss True liefern."""
        o = self.journal.order(order_id)
        if o is None or o["status"] != "pending_approval":
            return Outcome("rejected", ["Keine wartende Order mit dieser ID"])
        req = OrderRequest(o["symbol"], o["side"], o["size"], o["entry"], o["stop"], o["target"])
        if not confirm(req.summary(o["risk_amount"])):
            self.journal.set_status(order_id, "rejected")
            return Outcome("rejected", ["Nicht freigegeben"], order_id)
        try:
            res = self.broker.place(req)
        except Exception as exc:  # Broker-Fehler protokollieren, nicht verschlucken
            self.journal.set_status(order_id, "error")
            return Outcome("rejected", [f"Broker-Fehler: {exc}"], order_id)
        self.journal.set_status(order_id, res["status"], res.get("broker_ref"), res.get("fill_price"))
        return Outcome("accepted", [], order_id, res)

    def close_symbol(self, symbol: str, price: float, reason: str, strategy_id: str | None = None) -> Outcome:
        closed = []
        for o in self.journal.orders(status="open", symbol=symbol):
            if strategy_id not in (None, "manual") and o["strategy_id"] != strategy_id:
                continue
            res = self.broker.close(symbol, o["side"], o["size"], price, o["broker_ref"])
            closed.append(self.journal.close_order(o["id"], res["fill_price"], reason))
        return Outcome("closed" if closed else "updated", [] if closed else ["Keine offene Position"], detail={"closed": closed})

    def on_bar(self, symbol: str, high: float, low: float) -> Outcome:
        """Paper-Positionen: Stop/Ziel anhand einer Kerze prüfen (Stop zuerst - konservativ)."""
        closed = []
        for o in self.journal.orders(status="open", symbol=symbol, mode="paper"):
            long = o["side"] == "buy"
            if (low <= o["stop"]) if long else (high >= o["stop"]):
                closed.append(self.journal.close_order(o["id"], o["stop"], "stop"))
            elif o["target"] is not None and ((high >= o["target"]) if long else (low <= o["target"])):
                closed.append(self.journal.close_order(o["id"], o["target"], "target"))
        return Outcome("closed" if closed else "updated", [], detail={"closed": closed})
