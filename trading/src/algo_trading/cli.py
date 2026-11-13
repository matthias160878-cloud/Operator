"""Kommandozeile: algo-trading research | backtest | paper | webhook | approve | status | signal"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys

from .config import Settings


def _load(args) -> tuple:
    from . import data

    if args.csv:
        df, src = data.load_csv(args.csv), f"CSV {args.csv}"
    elif args.ccxt:
        df, src = data.fetch_ccxt(args.pair, args.timeframe, args.bars, args.ccxt), f"CCXT {args.ccxt}"
    elif args.mt5:
        df, src = data.fetch_mt5(args.pair, args.timeframe, args.bars), "MetaTrader 5"
    else:
        df, src = data.synthetic_ohlcv(args.bars, args.timeframe), "synthetisch (Demo)"
    if args.market_hours:
        before = len(df)
        df = data.drop_closed_hours(df)
        src += f", ohne Wochenende ({before - len(df)} Kerzen entfernt)"
    if args.resample:
        df = data.resample(df, args.resample)
    return df, src


def _data_args(p: argparse.ArgumentParser) -> None:
    p.add_argument("--pair", default="EURUSD")
    p.add_argument("--timeframe", default="15m")
    src = p.add_mutually_exclusive_group()
    src.add_argument("--csv", help="CSV mit timestamp,open,high,low,close[,volume]")
    src.add_argument("--ccxt", metavar="BÖRSE", help="Kerzen über CCXT laden, z. B. phemex")
    src.add_argument("--mt5", action="store_true", help="Kerzen aus laufendem MT5-Terminal laden")
    p.add_argument("--bars", type=int, default=20_000)
    p.add_argument("--resample", help="z. B. 1h")
    p.add_argument("--market-hours", action="store_true",
                   help="Wochenendpause von Forex/Gold/Indizes entfernen (für 24/7-Perpetuals wie XAU/USDT:USDT)")


def cmd_research(args, s: Settings) -> int:
    from .journal import Journal
    from .report import save
    from .research import run_research

    df, src = _load(args)
    journal = Journal(s.journal_path, s.account_balance) if s.journal_path.exists() else None
    r = run_research(df, s, pair=args.pair, timeframe=args.timeframe, n_strategies=args.strategies, top_k=args.top,
                     workers=args.workers, data_source=src, journal=journal)
    path = save(r, s.reports_dir)
    f = r["funnel"]
    print(f"\nStrategien {f['generated']} -> Backtests {f['backtested']} -> Filter {f['passed_filter']} -> Validierung {f['passed_validation']}")
    print(r["orchestrator"]["executive_summary"])
    print(f"Bericht: {path}")
    return 0


def cmd_backtest(args, s: Settings) -> int:
    from .backtest import run
    from .strategies import StrategyConfig, clamp_params

    df, _ = _load(args)
    cfg = StrategyConfig(args.family, clamp_params(args.family, json.loads(args.params)), args.pair, args.timeframe, s.risk_per_trade)
    res = run(df, cfg, s.costs)
    print(json.dumps({"config": cfg.to_dict(), "metrics": res.metrics}, indent=2))
    return 0


def _pipeline(s: Settings):
    from .pipeline import SignalPipeline

    return SignalPipeline(s)


def cmd_paper(args, s: Settings) -> int:
    import pandas as pd

    from . import data
    from .paper import PaperRunner, load_strategy

    if s.broker != "paper" or s.live_trading:
        raise SystemExit("Paper-Runner nur mit BROKER=paper und LIVE_TRADING=false.")
    cfg = load_strategy(args.strategy, s.reports_dir)
    source = args.source or cfg.pair
    timeframe = args.timeframe or cfg.timeframe
    symbol = (args.symbol or source.split(":")[0].replace("/", "")).upper()
    if symbol not in s.allowed_symbols:
        raise SystemExit(f"{symbol} fehlt in ALLOWED_SYMBOLS")

    def fetch():
        if args.mt5:
            return data.fetch_mt5(source, timeframe, 500)
        return data.fetch_ccxt(source, timeframe, 500, args.exchange)

    runner = PaperRunner(_pipeline(s), cfg, symbol, fetch, pd.Timedelta(data.TIMEFRAMES[timeframe]), args.market_hours)
    if args.once:
        for e in runner.step():
            print(e)
        return 0
    runner.run(args.poll)
    return 0


def cmd_webhook(args, s: Settings) -> int:
    from .webhook import serve

    serve(_pipeline(s), s.webhook_secret, os.environ.get("WEBHOOK_HOST", "127.0.0.1"), s.webhook_port)
    return 0


def cmd_signal(args, s: Settings) -> int:
    payload = json.loads(args.json)
    print(json.dumps(_pipeline(s).process(payload).to_dict(), indent=2, default=str))
    return 0


def cmd_approve(args, s: Settings) -> int:
    p = _pipeline(s)

    def confirm(summary: str) -> bool:
        print(f"ECHTGELD-ORDER ({p.broker.name}, Modus {p.broker.mode}):\n  {summary}")
        return input('Zum Senden exakt "JA" eingeben: ').strip() == "JA"

    out = p.approve(args.order_id, confirm)
    print(json.dumps(out.to_dict(), indent=2, default=str))
    return 0 if out.status == "accepted" else 1


def cmd_status(args, s: Settings) -> int:
    from .risk import RiskManager

    p = _pipeline(s)
    j = p.journal
    dist = RiskManager(s).limit_distance(j.balance, j.day_start_balance(), j.initial_balance)
    print(f"Modus: {p.broker.mode} ({p.broker.name}) | Konto (Paper): {j.balance:.2f} | Start: {j.initial_balance:.2f}")
    print(f"Abstand Tageslimit: {dist['to_daily_limit']:.2f} | Abstand Gesamtlimit: {dist['to_total_limit']:.2f}")
    for status in ("pending_approval", "open"):
        for o in j.orders(status=status):
            print(f"  [{status}] #{o['id']} {o['symbol']} {o['side']} {o['size']:.4f} @ {o['entry']:g} SL {o['stop']:g} TP {o['target']}")
    st = j.paper_stats()
    print(f"Paper: {st['trades']} Trades, E[R] {st['expectancy_r']:.2f}, Trefferquote {st['win_rate']:.0%}, PnL {st['pnl']:.2f}")
    return 0


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    ap = argparse.ArgumentParser(prog="algo-trading", description="KI-Trading-Research und Paper-Trading")
    sub = ap.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("research", help="Kompletter Research-Lauf mit KI-Team und Bericht")
    _data_args(r)
    r.add_argument("--strategies", type=int, default=1000, help="Anzahl erzeugter Strategien (z. B. 10000)")
    r.add_argument("--top", type=int, default=10, help="Kandidaten für das Validation Gate")
    r.add_argument("--workers", type=int, default=None)
    r.set_defaults(func=cmd_research)

    b = sub.add_parser("backtest", help="Eine Konfiguration backtesten")
    _data_args(b)
    b.add_argument("--family", required=True, choices=["trend", "breakout", "mean_reversion", "momentum"])
    b.add_argument("--params", default="{}", help='JSON, z. B. {"fast": 9, "slow": 50}')
    b.set_defaults(func=cmd_backtest)

    pp = sub.add_parser("paper", help="Paper-Trading einer Strategie aus einem Bericht auf Live-Kerzen")
    pp.add_argument("--strategy", required=True, help="Strategie-ID aus einem Bericht, z. B. br-2031033fb9")
    pp.add_argument("--source", help="Datenquelle/Symbol, Standard: Paar aus dem Bericht (z. B. XAU/USDT:USDT)")
    pp.add_argument("--exchange", default="phemex")
    pp.add_argument("--mt5", action="store_true", help="Kerzen aus MT5 statt CCXT")
    pp.add_argument("--symbol", help="Symbol im Journal, Standard: aus der Quelle abgeleitet (z. B. XAUUSDT -> mit --symbol XAUUSD setzen)")
    pp.add_argument("--timeframe", help="Standard: Zeitrahmen aus dem Bericht")
    pp.add_argument("--market-hours", action="store_true", help="Wochenendpause entfernen (wie im Research-Lauf)")
    pp.add_argument("--poll", type=int, default=60, help="Abfrage-Intervall in Sekunden")
    pp.add_argument("--once", action="store_true", help="nur einen Durchlauf (z. B. für Cron)")
    pp.set_defaults(func=cmd_paper)

    sub.add_parser("webhook", help="TradingView-Webhook starten").set_defaults(func=cmd_webhook)
    sg = sub.add_parser("signal", help="Signal lokal einspielen (wie ein Webhook, ohne Secret)")
    sg.add_argument("json")
    sg.set_defaults(func=cmd_signal)
    ap_ = sub.add_parser("approve", help="Wartende Echtgeld-Order freigeben")
    ap_.add_argument("order_id", type=int)
    ap_.set_defaults(func=cmd_approve)
    sub.add_parser("status", help="Konto, Limits, offene Positionen, Paper-Statistik").set_defaults(func=cmd_status)

    args = ap.parse_args(argv)
    return args.func(args, Settings.from_env())


if __name__ == "__main__":
    sys.exit(main())
