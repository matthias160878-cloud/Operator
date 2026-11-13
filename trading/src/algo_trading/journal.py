"""Trade Journal (SQLite): Signale, Orders, Kontostand - Grundlage für Monitoring und das Paper-Gate."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS signals (
    key TEXT PRIMARY KEY, ts TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL, reasons TEXT
);
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, signal_key TEXT, strategy_id TEXT, symbol TEXT NOT NULL,
    side TEXT NOT NULL, size REAL NOT NULL, entry REAL NOT NULL, stop REAL NOT NULL, target REAL, risk_amount REAL NOT NULL,
    broker TEXT NOT NULL, mode TEXT NOT NULL, status TEXT NOT NULL, broker_ref TEXT,
    exit REAL, exit_ts TEXT, exit_reason TEXT, pnl REAL, r REAL
);
CREATE TABLE IF NOT EXISTS account (key TEXT PRIMARY KEY, value REAL NOT NULL);
"""


def now() -> datetime:
    return datetime.now(timezone.utc)


class Journal:
    def __init__(self, path: str | Path, initial_balance: float = 10_000.0):
        if str(path) != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(str(path), check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        self.db.execute("INSERT OR IGNORE INTO account VALUES ('initial_balance', ?)", (initial_balance,))
        self.db.execute("INSERT OR IGNORE INTO account VALUES ('balance', ?)", (initial_balance,))
        self.db.commit()

    # --- Konto ---
    def _get(self, key: str) -> float | None:
        row = self.db.execute("SELECT value FROM account WHERE key=?", (key,)).fetchone()
        return None if row is None else float(row["value"])

    @property
    def balance(self) -> float:
        return self._get("balance") or 0.0

    @property
    def initial_balance(self) -> float:
        return self._get("initial_balance") or 0.0

    def day_start_balance(self, day: str | None = None) -> float:
        key = f"day_start:{day or now().date().isoformat()}"
        value = self._get(key)
        if value is None:
            value = self.balance
            self.db.execute("INSERT OR IGNORE INTO account VALUES (?, ?)", (key, value))
            self.db.commit()
        return value

    def add_pnl(self, pnl: float) -> None:
        self.day_start_balance()
        self.db.execute("UPDATE account SET value = value + ? WHERE key='balance'", (pnl,))
        self.db.commit()

    # --- Signale ---
    def record_signal(self, key: str, payload: dict, status: str, reasons: list[str] | None = None) -> bool:
        """False, wenn das Signal schon verarbeitet wurde (Duplikat)."""
        safe = {k: v for k, v in payload.items() if k != "secret"}
        try:
            self.db.execute("INSERT INTO signals VALUES (?, ?, ?, ?, ?)",
                            (key, now().isoformat(), json.dumps(safe), status, json.dumps(reasons or [])))
            self.db.commit()
            return True
        except sqlite3.IntegrityError:
            return False

    def update_signal(self, key: str, status: str, reasons: list[str] | None = None) -> None:
        self.db.execute("UPDATE signals SET status=?, reasons=? WHERE key=?", (status, json.dumps(reasons or []), key))
        self.db.commit()

    # --- Orders ---
    def add_order(self, **o) -> int:
        cols = ["ts", "signal_key", "strategy_id", "symbol", "side", "size", "entry", "stop", "target", "risk_amount",
                "broker", "mode", "status", "broker_ref"]
        o.setdefault("ts", now().isoformat())
        o.setdefault("broker_ref", None)
        cur = self.db.execute(f"INSERT INTO orders ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})", [o.get(c) for c in cols])
        self.db.commit()
        return int(cur.lastrowid)

    def order(self, order_id: int) -> sqlite3.Row | None:
        return self.db.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()

    def set_status(self, order_id: int, status: str, broker_ref: str | None = None, entry: float | None = None) -> None:
        self.db.execute("UPDATE orders SET status=?, broker_ref=COALESCE(?, broker_ref), entry=COALESCE(?, entry) WHERE id=?",
                        (status, broker_ref, entry, order_id))
        self.db.commit()

    def close_order(self, order_id: int, exit_price: float, reason: str) -> dict:
        o = self.order(order_id)
        direction = 1 if o["side"] == "buy" else -1
        risk_dist = abs(o["entry"] - o["stop"])
        r = (exit_price - o["entry"]) * direction / risk_dist if risk_dist else 0.0
        pnl = r * o["risk_amount"]
        self.db.execute("UPDATE orders SET status='closed', exit=?, exit_ts=?, exit_reason=?, pnl=?, r=? WHERE id=?",
                        (exit_price, now().isoformat(), reason, pnl, r, order_id))
        self.db.commit()
        if o["mode"] == "paper":
            self.add_pnl(pnl)
        return {"id": order_id, "exit": exit_price, "r": r, "pnl": pnl, "reason": reason}

    def orders(self, status: str | None = None, symbol: str | None = None, mode: str | None = None) -> list[sqlite3.Row]:
        q, args = "SELECT * FROM orders WHERE 1=1", []
        for col, val in (("status", status), ("symbol", symbol), ("mode", mode)):
            if val is not None:
                q += f" AND {col}=?"
                args.append(val)
        return self.db.execute(q + " ORDER BY id", args).fetchall()

    def paper_stats(self, strategy_id: str | None = None) -> dict:
        q, args = "SELECT r, pnl FROM orders WHERE mode='paper' AND status='closed'", []
        if strategy_id:
            q += " AND strategy_id=?"
            args.append(strategy_id)
        rows = self.db.execute(q, args).fetchall()
        rs = [row["r"] for row in rows]
        return {"trades": len(rs), "expectancy_r": sum(rs) / len(rs) if rs else 0.0,
                "win_rate": sum(1 for r in rs if r > 0) / len(rs) if rs else 0.0,
                "pnl": sum(row["pnl"] for row in rows)}
