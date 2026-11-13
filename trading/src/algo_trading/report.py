"""Konsolidierter Research-Bericht (Markdown + JSON)."""
from __future__ import annotations

import json
from pathlib import Path


def _pct(x: float) -> str:
    return f"{x * 100:.1f} %"


def render(r: dict) -> str:
    f = r["funnel"]
    lines = [
        f"# Research-Bericht: {r['pair']} {r['timeframe']}",
        "",
        f"Erstellt: {r['created']} · Daten: {r['data']['source']} ({r['data']['bars']} Kerzen, {r['data']['start']} bis {r['data']['end']})",
        f"KI-Modus: {r['ai_mode']} · **STATUS: NUR RESEARCH** - Live-Handel gesperrt",
        "",
        "## Kernaussage",
        r["orchestrator"]["executive_summary"],
        "",
        "## Research-Funnel",
        "| Strategien erzeugt | Backtests mit Trades | Erster Filter bestanden | Validierung bestanden |",
        "|---:|---:|---:|---:|",
        f"| {f['generated']} | {f['backtested']} | {f['passed_filter']} | {f['passed_validation']} |",
        "",
        "## Marktanalyse",
        f"- Regime: {r['market']['regime']} · Volatilität: {r['market']['volatility']}",
        f"- Struktur: {r['market']['structure']}",
        *[f"- {n}" for n in r["market"].get("notes", [])],
        "",
        "## Kandidaten und Validation Gate",
        "| ID | Familie | IS Trades | IS E[R] | OOS E[R] | OOS PF | Sharpe IS | Max DD IS | Backtest | OOS | Walk-Fwd | Monte Carlo | Regime | Overfitting | Paper | Live |",
        "|---|---|---:|---:|---:|---:|---:|---:|---|---|---|---|---|---|---|---|",
    ]
    for c in r["candidates"]:
        i, o, g = c["in_sample"], c["out_of_sample"], c["gates"]
        lines.append(f"| `{c['id']}` | {c['family']} | {i['trades']} | {i['expectancy_r']:.2f} | {o['expectancy_r']:.2f} | "
                     f"{o['profit_factor']:.2f} | {i['sharpe']:.2f} | {_pct(i['max_drawdown'])} | {g['backtest']} | {g['out_of_sample']} | "
                     f"{g['walk_forward']} | {g['monte_carlo']} | {g['regimes']} | {g['overfitting']} | {g['paper_trading']} | {g['live']} |")
    if r["candidates"]:
        best = r["candidates"][0]
        lines += ["", "## Beispiel-Konfiguration (automatisch erzeugt)", "```json",
                  json.dumps({"id": best["id"], "pair": r["pair"], "timeframe": r["timeframe"], "family": best["family"],
                              "params": best["params"], "risk": best["risk"]}, indent=2), "```"]
    q = r["quant"]
    lines += ["", "## Quant Analyst", q.get("summary", "")]
    lines += [f"- `{a['strategy_id']}`: {a['verdict']}" + (f" - {'; '.join(a['concerns'])}" if a.get("concerns") else "") for a in q.get("assessments", [])]
    rk = r["risk"]
    lines += ["", "## Risk Reviewer", *[f"- {x}" for x in rk.get("rules", [])]]
    if rk.get("veto_ids"):
        lines.append(f"- Veto: {', '.join(rk['veto_ids'])}")
    cr = r["code_review"]
    lines += ["", "## Code Reviewer", *[f"- {x}" for x in cr.get("issues", [])]]
    lines += ["", "## Erkenntnisse", *[f"- {x}" for x in r["orchestrator"].get("insights", [])],
              "", "## Nächste Experimente", *[f"- {x}" for x in r["orchestrator"].get("next_experiments", [])],
              "", "## Annahmen",
              f"- Kosten: Spread {r['assumptions']['costs']['spread']}, Slippage {r['assumptions']['costs']['slippage']}, "
              f"Kommission {r['assumptions']['costs']['commission_rate']} je Seite",
              f"- In-Sample bis {r['assumptions']['split']}, danach Out-of-Sample; Einstieg zur Eröffnung der Folgekerze, Stop vor Ziel bei Doppeltreffer",
              "", "> Ein bestandener Backtest ist kein Beweis für einen dauerhaften Vorteil. Jede Strategie muss sich im "
              "Paper-Trading bewähren, bevor echtes Kapital riskiert wird. Keine Anlageberatung.", ""]
    return "\n".join(lines)


def save(r: dict, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{r['created'][:19].replace(':', '').replace('-', '')}-{r['pair'].replace('/', '')}-{r['timeframe']}"
    (out_dir / f"{stem}.json").write_text(json.dumps(r, indent=2, default=str), encoding="utf-8")
    md = out_dir / f"{stem}.md"
    md.write_text(render(r), encoding="utf-8")
    return md
