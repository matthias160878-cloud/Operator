# algo-trading – KI-gestützte Trading-Research-Pipeline

Eigene Umsetzung der Architektur „Fable 5.2 als Lead Orchestrator + Spezialisten-Agenten“:
Research, Strategie-Suche, Batch-Backtests, Validierung, Paper-Trading und ein gesperrter Live-Pfad.

> **Wichtig:** Ein stärkeres KI-Modell erzeugt nicht automatisch eine profitable Strategie.
> Dieses Projekt macht Research schneller und systematischer. Live-Handel ist standardmäßig
> gesperrt, und jede Echtgeld-Order braucht deine ausdrückliche Freigabe. Keine Anlageberatung.

## Architektur

```
Fable 5.2 (Lead Orchestrator)  ── plant, delegiert, fasst zusammen       agents.py
 ├─ Market Analyst             ── Regime, Volatilität, Struktur           regime.py
 ├─ Strategy Researcher        ── testbare Hypothesen                     agents.py
 ├─ Coding Agent               ── Hypothese → geprüfte StrategyConfig     strategies.clamp_params (deterministisch)
 ├─ Quant Analyst              ── Statistik über die Ergebnisse
 ├─ Risk Reviewer              ── Positionsgröße, Limits, Veto
 └─ Code Reviewer              ── Backtest-Annahmen, Fehlerquellen
        │
Data Engine (CSV · CCXT · MT5)                                            data.py
Strategy Discovery Engine: Hypothesen → Regeln → Parametersuche →         discovery.py
   Batch-Backtest (tausende Varianten, parallel) → Ranking                backtest.py
Validation Gate: Backtest → Out-of-Sample → Walk-Forward → Monte Carlo    validation.py
   → Regime-Test → Overfitting (Multiple-Testing) → Paper REQUIRED → Live BLOCKED
Risk Engine: 1 % pro Trade, Tages-/Gesamtverlustlimit, CRV ≥ 1:2           risk.py
Signal-Workflow: TradingView-Alert → Webhook → Validierung → Risk Check   webhook.py, pipeline.py
   → Broker (Paper · CCXT · MT5) → Trade Journal (SQLite)                 brokers/, journal.py
Monitoring: `algo-trading status`
```

Die Agenten bekommen nur berechnete Zahlen und antworten mit JSON nach festem Schema
(Structured Outputs). Sie schreiben **keinen** ausführbaren Code – die Engine ist der Code.
Ohne `ANTHROPIC_API_KEY` laufen alle Rollen im Vorlagen-Modus (regelbasiert); mit Schlüssel
nutzt der Orchestrator `claude-fable-5-2` (änderbar über `TRADING_MODEL`) mit
serverseitigem Refusal-Fallback (`fallbacks: "default"`).

## Einrichten

```bash
cd trading
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"            # + ".[crypto]" für CCXT, ".[mt5]" unter Windows
cp .env.example .env               # Werte eintragen
export $(grep -v '^#' .env | xargs)
```

## Benutzung

```bash
# 1. Research-Lauf (Demo mit synthetischen Daten, ohne Netz)
algo-trading research --strategies 10000 --top 20

# mit echten Daten
algo-trading research --csv eurusd_15m.csv --pair EURUSD --timeframe 15m --strategies 10000
# Phemex liefert für Spot nur die letzten 1000 Kerzen - für Historie den Perpetual nutzen,
# Kosten an den Markt anpassen (Spread/Slippage in USD, Taker-Gebühr 0,06 %):
SPREAD=1 SLIPPAGE=2 COMMISSION_RATE=0.0006 \
  algo-trading research --ccxt phemex --pair BTC/USDT:USDT --timeframe 15m --bars 20000
algo-trading research --mt5 --pair XAUUSD --timeframe 15m          # Windows + MT5-Terminal

# 2. Einzelne Konfiguration prüfen
algo-trading backtest --csv eurusd_15m.csv --family breakout --params '{"lookback": 40, "sl_atr": 1.5, "tp_atr": 3}'

# 3. Paper-Trading über TradingView
algo-trading webhook               # lauscht auf 127.0.0.1:8765/webhook
algo-trading status                # Konto, Abstand zu den Limits, offene Positionen, Paper-Statistik
```

Berichte landen in `reports/` (Markdown + JSON): Funnel (erzeugt → Backtests → Filter →
Validierung), Kandidaten mit allen Gate-Status, Beispiel-Konfiguration, Bewertungen der
Agenten, nächste Experimente.

### TradingView-Alert

Webhook-URL: dein HTTPS-Tunnel/Reverse-Proxy auf `http://127.0.0.1:8765/webhook`.
Nachricht (JSON):

```json
{"secret": "DEIN_WEBHOOK_SECRET", "action": "{{strategy.order.action}}", "symbol": "EURUSD",
 "price": {{close}}, "atr": 0.0012, "strategy_id": "br-e517d103e4", "time": "{{timenow}}"}
```

- `action`: `buy` | `sell` | `close` | `bar` (`bar` mit `high`/`low` prüft Stop/Ziel offener Paper-Positionen)
- `stop` direkt angeben oder `atr` (Stop = 1,5 × ATR); `take_profit` optional, sonst Mindest-CRV
- Ohne Stop keine Order. Doppelte Signale werden ignoriert.

## Sicherheitsregeln (fest eingebaut)

| Regel | Umsetzung |
|---|---|
| Standard ist Paper-Trading | `BROKER=paper` |
| Echte Broker ohne Freigabe nur Dry-Run | `BROKER=ccxt/mt5` mit `LIVE_TRADING=false` sendet nichts |
| Echtgeld nur mit Freigabe pro Order | `LIVE_TRADING=true` legt Orders als `pending_approval` ab; senden erst mit `algo-trading approve <id>` und Eingabe `JA` |
| Risiko | 1 % pro Trade, Tages- (4 %) und Gesamtverlustlimit (8 %), max. offene Positionen, CRV ≥ 1:2 |
| Schlüssel | nur über Umgebungsvariablen; API-Keys ohne Withdraw-Recht und IP-beschränkt anlegen |
| Live-Gate | `live` bleibt `BLOCKED`, bis ≥ 30 Paper-Trades der Strategie mit positivem Erwartungswert vorliegen |

## Nicht enthalten

- **Zerodha Kite** (indischer Markt) und **Robinhood** (keine offizielle Aktien-API) – lassen sich als
  weiterer Broker unter `brokers/` mit derselben `place`/`close`-Schnittstelle ergänzen.
- Synthetische Demo-Daten zeigen nur, dass die Pipeline läuft – sie enthalten absichtlich keinen
  echten Vorteil. Für Research immer echte Daten verwenden.

## Tests

```bash
pytest -q
```
