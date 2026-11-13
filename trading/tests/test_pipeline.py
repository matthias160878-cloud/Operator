import json

from algo_trading.journal import Journal
from algo_trading.pipeline import SignalPipeline
from algo_trading.webhook import handle


class FakeLiveBroker:
    name, mode = "fake", "live"

    def __init__(self):
        self.sent = []

    def place(self, order):
        self.sent.append(order)
        return {"status": "open", "fill_price": order.price, "broker_ref": "X1"}

    def close(self, *a):
        return {"status": "closed", "fill_price": a[3]}


def _pipe(settings, broker=None):
    return SignalPipeline(settings, Journal(":memory:", 10_000), broker)


BUY = {"secret": "geheim", "action": "buy", "symbol": "EURUSD", "price": 1.1000, "stop": 1.0950, "strategy_id": "s1", "time": "t1"}


def test_webhook_auth_and_json(settings):
    p = _pipe(settings)
    assert handle(p, "geheim", b"{kaputt")[0] == 400
    assert handle(p, "geheim", json.dumps({**BUY, "secret": "falsch"}).encode())[0] == 401
    assert handle(p, "", json.dumps(BUY).encode())[0] == 503


def test_paper_trade_lifecycle(settings):
    p = _pipe(settings)
    code, out = handle(p, "geheim", json.dumps(BUY).encode())
    assert code == 200 and out["status"] == "accepted"
    order = p.journal.order(out["order_id"])
    assert order["target"] > order["entry"]  # Ziel aus Mindest-CRV ergänzt
    assert order["risk_amount"] == 100
    # Duplikat wird ignoriert
    assert handle(p, "geheim", json.dumps(BUY).encode())[1]["status"] == "duplicate"
    # Kerze erreicht das Ziel -> +2R
    p.process({"action": "bar", "symbol": "EURUSD", "price": 1.11, "high": 1.12, "low": 1.099, "time": "t2"})
    stats = p.journal.paper_stats("s1")
    assert stats["trades"] == 1 and abs(stats["expectancy_r"] - 2) < 0.05
    assert p.journal.balance > 10_000


def test_signal_validation(settings):
    p = _pipe(settings)
    bad = p.process({**BUY, "stop": 1.2, "time": "x"})
    assert bad.status == "rejected" and any("falschen Seite" in r for r in bad.reasons)
    no_stop = p.process({**BUY, "stop": None, "time": "y"})
    assert no_stop.status == "rejected"
    other = p.process({**BUY, "symbol": "DOGEUSD", "time": "z"})
    assert other.status == "rejected"
    low_rr = p.process({**BUY, "take_profit": 1.1050, "time": "w"})
    assert low_rr.status == "rejected" and "CRV" in low_rr.reasons[0]


def test_live_orders_need_approval(settings):
    broker = FakeLiveBroker()
    p = _pipe(settings, broker)
    out = p.process(BUY)
    assert out.status == "pending_approval" and broker.sent == []
    assert p.approve(out.order_id, lambda s: False).status == "rejected" and broker.sent == []
    out2 = p.process({**BUY, "time": "t9"})
    assert p.approve(out2.order_id, lambda s: "EURUSD BUY" in s).status == "accepted"
    assert len(broker.sent) == 1
    assert p.approve(out2.order_id, lambda s: True).status == "rejected"  # nicht doppelt senden
