"""Paper-Trading-Runner: wendet eine validierte Strategie auf abgeschlossene Live-Kerzen an.

Pro neu abgeschlossener Kerze (gleiche Logik wie der Backtest, ohne Lookahead):
  1. offene Position: Stop/Ziel innerhalb der Kerze, Zeit-Exit nach max_bars, Gegensignal
  2. Einstieg auf ein neues Signal - über die normale Pipeline (Risk Check, Paper-Broker, Journal)
Einstiege erfolgen zum Schlusskurs der Signalkerze (≈ Eröffnung der nächsten Kerze im Backtest).
Beim ersten Start wird nur die letzte Kerze gemerkt; gehandelt wird ab der nächsten.
"""
from __future__ import annotations

import glob
import json
import logging
import time
from pathlib import Path
from typing import Callable

import pandas as pd

from .data import drop_closed_hours
from .indicators import atr
from .pipeline import SignalPipeline
from .strategies import StrategyConfig, clamp_params, signals

log = logging.getLogger("algo_trading.paper")

Fetcher = Callable[[], pd.DataFrame]


def load_strategy(strategy_id: str, reports_dir: Path) -> StrategyConfig:
    """Sucht die Konfiguration im neuesten Bericht, der die ID enthält."""
    for path in sorted(glob.glob(str(reports_dir / "*.json")), reverse=True):
        r = json.loads(Path(path).read_text(encoding="utf-8"))
        for c in r.get("candidates", []):
            if c["id"] == strategy_id:
                return StrategyConfig(c["family"], clamp_params(c["family"], c["params"]), r["pair"], r["timeframe"],
                                      c.get("risk", 0.01), c.get("hypothesis", ""), id=strategy_id)
    raise SystemExit(f"Strategie {strategy_id} in keinem Bericht unter {reports_dir} gefunden.")


def closed_bars(df: pd.DataFrame, timeframe_delta: pd.Timedelta, now: pd.Timestamp) -> pd.DataFrame:
    """Nur abgeschlossene Kerzen (die laufende Kerze wird verworfen)."""
    return df[df.index + timeframe_delta <= now]


class PaperRunner:
    def __init__(self, pipeline: SignalPipeline, cfg: StrategyConfig, symbol: str, fetch: Fetcher,
                 timeframe_delta: pd.Timedelta, market_hours: bool = False):
        self.p, self.cfg, self.symbol, self.fetch = pipeline, cfg, symbol.upper(), fetch
        self.tf, self.market_hours = timeframe_delta, market_hours
        self.state_key = f"paper_last_bar:{cfg.id}"

    def _open_order(self):
        rows = [o for o in self.p.journal.orders(status="open", symbol=self.symbol, mode="paper") if o["strategy_id"] == self.cfg.id]
        return rows[0] if rows else None

    def step(self, now: pd.Timestamp | None = None) -> list[str]:
        """Verarbeitet alle seit dem letzten Aufruf abgeschlossenen Kerzen. Gibt Ereignisse zurück."""
        now = now or pd.Timestamp.now(tz="UTC")
        df = closed_bars(self.fetch(), self.tf, now)
        if self.market_hours:
            df = drop_closed_hours(df)
        if len(df) < 50:
            return ["zu wenige Kerzen"]
        last_done = self.p.journal.get_state(self.state_key)
        if last_done is None:
            self.p.journal.set_state(self.state_key, df.index[-1].timestamp())
            return [f"Start: letzte Kerze {df.index[-1]} gemerkt, gehandelt wird ab der nächsten"]
        sig = signals(df, self.cfg)
        a = atr(df).to_numpy()
        events: list[str] = []
        for i in range(len(df)):
            ts = df.index[i]
            if ts.timestamp() <= last_done:
                continue
            bar = df.iloc[i]
            events += self._manage_position(df, i, bar, int(sig[i]))
            events += self._maybe_enter(ts, bar, int(sig[i]), a[i])
            self.p.journal.set_state(self.state_key, ts.timestamp())
        return events

    def _manage_position(self, df: pd.DataFrame, i: int, bar: pd.Series, s: int) -> list[str]:
        o = self._open_order()
        if o is None:
            return []
        out = self.p.on_bar(self.symbol, float(bar["high"]), float(bar["low"]))
        if out.status == "closed":
            return [f"{df.index[i]} Exit {c['reason']}: {c['r']:+.2f} R ({c['pnl']:+.2f})" for c in out.detail["closed"]]
        entry_ts = self.p.journal.get_state(f"entry_bar:{o['id']}") or pd.Timestamp(o["ts"]).timestamp()
        held = int((df.index[: i + 1] > pd.Timestamp(entry_ts, unit="s", tz="UTC")).sum())
        direction = 1 if o["side"] == "buy" else -1
        reason = "time" if held >= self.cfg.params["max_bars"] else ("reverse" if s == -direction else None)
        if reason:
            closed = self.p.close_symbol(self.symbol, float(bar["close"]), reason, self.cfg.id).detail["closed"]
            return [f"{df.index[i]} Exit {c['reason']}: {c['r']:+.2f} R ({c['pnl']:+.2f})" for c in closed]
        return []

    def _maybe_enter(self, ts: pd.Timestamp, bar: pd.Series, s: int, atr_value: float) -> list[str]:
        if s == 0 or self._open_order() is not None or not atr_value > 0:
            return []
        price = float(bar["close"])
        direction = 1 if s > 0 else -1
        payload = {"id": f"{self.cfg.id}:{ts.isoformat()}", "action": "buy" if s > 0 else "sell", "symbol": self.symbol,
                   "price": price, "stop": price - direction * self.cfg.params["sl_atr"] * atr_value,
                   "take_profit": price + direction * self.cfg.params["tp_atr"] * atr_value,
                   "strategy_id": self.cfg.id, "time": ts.isoformat()}
        out = self.p.process(payload)
        if out.order_id is not None:
            self.p.journal.set_state(f"entry_bar:{out.order_id}", ts.timestamp())
        summary = (out.detail or {}).get("summary", "")
        return [f"{ts} Signal {payload['action']}: {out.status} {summary} {'; '.join(out.reasons)}".rstrip()]

    def run(self, poll_seconds: int = 60) -> None:  # pragma: no cover - Endlosschleife
        log.info("Paper-Trading %s (%s %s) auf %s gestartet", self.cfg.id, self.cfg.family, self.cfg.params, self.symbol)
        while True:
            try:
                for e in self.step():
                    log.info(e)
            except Exception:
                log.exception("Fehler im Paper-Lauf - nächster Versuch beim nächsten Intervall")
            time.sleep(poll_seconds)
