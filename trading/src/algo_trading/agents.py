"""KI-Research-Team (Multi-Agent): Lead Orchestrator + Spezialisten.

Die Agenten bekommen ausschließlich berechnete Fakten (Regime-Kennzahlen, Backtest- und
Validierungsergebnisse) und antworten mit strukturiertem JSON. Sie schreiben keinen ausführbaren
Code: Der 'Coding Agent' übersetzt Hypothesen deterministisch in geprüfte StrategyConfigs
(strategies.clamp_params). Ohne ANTHROPIC_API_KEY laufen alle Rollen im Vorlagen-Modus.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from .config import Settings
from .strategies import COMMON_SPACE, FAMILY_LABELS, FAMILY_SPACE, StrategyConfig, clamp_params

log = logging.getLogger("algo_trading.agents")

BASE_SYSTEM = (
    "Du bist Teil eines quantitativen Research-Teams für systematisches Trading. Antworte auf Deutsch, "
    "präzise und nüchtern. Stütze jede Aussage auf die gelieferten Zahlen; erfinde keine Kurse, News oder "
    "Ergebnisse. Ein Backtest ist kein Beweis für einen dauerhaften Vorteil - benenne Overfitting-, Kosten- "
    "und Regime-Risiken offen. Keine Gewinnversprechen. Antworte ausschließlich mit JSON nach dem Schema."
)

ROLES = {
    "market_analyst": "Market Analyst: Analysiert Marktregime, Volatilität und Struktur.",
    "strategy_researcher": "Strategy Researcher: Formuliert testbare Trading-Hypothesen und Regeldesigns.",
    "quant_analyst": "Quant Analyst: Bewertet Ideen mit statistischen und quantitativen Methoden.",
    "risk_reviewer": "Risk Reviewer: Definiert Positionsgröße, Limits und Risikokontrollen.",
    "code_reviewer": "Code Reviewer: Prüft Backtest-Annahmen, Konfigurationen und mögliche Fehlerquellen.",
    "orchestrator": "Lead Orchestrator: Plant, delegiert, koordiniert und fasst den Research-Bericht zusammen.",
}


def _obj(props: dict, required: list[str] | None = None) -> dict:
    return {"type": "object", "properties": props, "required": required or list(props), "additionalProperties": False}


_STR = {"type": "string"}
_STRS = {"type": "array", "items": _STR}
_NUM = {"type": "number"}

SCHEMAS = {
    "market_analyst": _obj({"regime": _STR, "volatility": _STR, "structure": _STR,
                            "family_weights": _obj({f: _NUM for f in FAMILY_SPACE}), "notes": _STRS}),
    "strategy_researcher": _obj({"hypotheses": {"type": "array", "items": _obj({
        "family": {"type": "string", "enum": list(FAMILY_SPACE)}, "rationale": _STR,
        "params": _obj({k: _NUM for k in sorted({k for s in FAMILY_SPACE.values() for k in s} | set(COMMON_SPACE))}, required=[]),
    })}}),
    "quant_analyst": _obj({"assessments": {"type": "array", "items": _obj({"strategy_id": _STR, "verdict": _STR, "concerns": _STRS})},
                           "summary": _STR}),
    "risk_reviewer": _obj({"risk_per_trade": _NUM, "max_open_positions": _NUM, "rules": _STRS, "veto_ids": _STRS}),
    "code_reviewer": _obj({"issues": _STRS, "assumptions_ok": {"type": "boolean"}}),
    "orchestrator": _obj({"executive_summary": _STR, "insights": _STRS, "next_experiments": _STRS}),
}


@dataclass
class AgentReply:
    role: str
    data: dict
    source: str  # "claude" | "template"


class ResearchTeam:
    def __init__(self, settings: Settings, client=None):
        self.s = settings
        self.client = client
        if self.client is None and settings.anthropic_api_key:
            import anthropic

            self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    @property
    def live(self) -> bool:
        return self.client is not None

    def ask(self, role: str, task: str, facts: dict, fallback: dict) -> AgentReply:
        if not self.live:
            return AgentReply(role, fallback, "template")
        model = self.s.model if role == "orchestrator" else self.s.agent_model
        try:
            with self.client.beta.messages.stream(
                model=model,
                max_tokens=16000,
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
                system=f"{BASE_SYSTEM}\n\nDeine Rolle - {ROLES[role]}",
                output_config={"effort": self.s.effort, "format": {"type": "json_schema", "schema": SCHEMAS[role]}},
                messages=[{"role": "user", "content": f"{task}\n\nFakten (JSON):\n{json.dumps(facts, default=str, ensure_ascii=False)}"}],
            ) as stream:
                msg = stream.get_final_message()
            if msg.stop_reason == "refusal":
                log.warning("%s: Anfrage abgelehnt (%s) - Vorlage wird genutzt", role, getattr(msg.stop_details, "category", None))
                return AgentReply(role, fallback, "template")
            text = "".join(b.text for b in msg.content if b.type == "text")
            return AgentReply(role, json.loads(text), "claude")
        except Exception as exc:  # Research darf am KI-Aufruf nicht scheitern
            log.warning("%s: KI-Aufruf fehlgeschlagen (%s) - Vorlage wird genutzt", role, exc)
            return AgentReply(role, fallback, "template")

    # ----- Rollen -----
    def market_analyst(self, regime: dict) -> AgentReply:
        share = regime["regime_share"]
        weights = {"trend": 0.5 + share["trend"] * 2, "momentum": 0.5 + share["trend"] * 1.5,
                   "breakout": 0.5 + share["volatile"] * 2 + share["trend"], "mean_reversion": 0.5 + share["range"] * 2}
        fb = {"regime": regime["current_regime"], "volatility": f"{regime['annualized_vol_pct']:.1f} % p. a.",
              "structure": f"Anteile Trend/Range/Volatil: {share['trend']:.0%}/{share['range']:.0%}/{share['volatile']:.0%}",
              "family_weights": {k: round(v, 2) for k, v in weights.items()},
              "notes": ["Gewichte aus Regime-Anteilen abgeleitet (Vorlagen-Modus)."]}
        return self.ask("market_analyst", "Bewerte Marktregime, Volatilität und Struktur. Gib Gewichte (0-3) an, wie stark jede "
                        "Strategie-Familie in der Suche vertreten sein soll.", {"regime": regime, "families": FAMILY_LABELS}, fb)

    def strategy_researcher(self, market: dict, pair: str, timeframe: str, n: int = 8) -> AgentReply:
        fb = {"hypotheses": [{"family": f, "rationale": FAMILY_LABELS[f], "params": {}} for f in FAMILY_SPACE]}
        space = {f: {**FAMILY_SPACE[f], **COMMON_SPACE} for f in FAMILY_SPACE}
        return self.ask("strategy_researcher", f"Formuliere bis zu {n} testbare Hypothesen für {pair} auf {timeframe}. Nutze nur "
                        "die Familien und Parameterbereiche (min, max, Schritt) aus 'space'. tp_atr/sl_atr soll mindestens 2 sein.",
                        {"market_analysis": market, "space": space}, fb)

    def quant_analyst(self, candidates: list[dict]) -> AgentReply:
        fb = {"assessments": [{"strategy_id": c["id"], "verdict": "valide" if c["passed"] else "nicht valide",
                               "concerns": [f"{g}: {s}" for g, s in c["gates"].items() if s in {"FAILED", "REVIEW"}]} for c in candidates],
              "summary": f"{sum(c['passed'] for c in candidates)} von {len(candidates)} Kandidaten bestehen das Validierungs-Gate."}
        return self.ask("quant_analyst", "Bewerte jeden Kandidaten statistisch (In-/Out-of-Sample, Walk-Forward, Monte Carlo, "
                        "Regime, Multiple-Testing). Sei skeptisch.", {"candidates": candidates}, fb)

    def risk_reviewer(self, candidates: list[dict]) -> AgentReply:
        veto = [c["id"] for c in candidates if c["gates"].get("monte_carlo") == "FAILED"]
        fb = {"risk_per_trade": self.s.risk_per_trade, "max_open_positions": self.s.max_open_positions,
              "rules": [f"{self.s.risk_per_trade:.1%} Risiko pro Trade, Stop immer gesetzt",
                        f"Tagesverlustlimit {self.s.daily_loss_limit:.0%}, Gesamtverlustlimit {self.s.total_loss_limit:.0%}",
                        f"Mindest-CRV 1:{self.s.min_rr:g}", "Live erst nach >= 30 Paper-Trades mit positivem Erwartungswert"],
              "veto_ids": veto}
        return self.ask("risk_reviewer", "Lege Positionsgröße, Limits und Risikoregeln fest. Setze Kandidaten mit inakzeptablem "
                        "Drawdown-Risiko auf die Veto-Liste.", {"candidates": candidates,
                        "current_limits": {"risk_per_trade": self.s.risk_per_trade, "daily_loss_limit": self.s.daily_loss_limit,
                                           "total_loss_limit": self.s.total_loss_limit, "min_rr": self.s.min_rr}}, fb)

    def code_reviewer(self, sample_config: dict, assumptions: dict) -> AgentReply:
        issues = []
        if assumptions["costs"]["spread"] == 0:
            issues.append("Spread ist 0 - Ergebnisse zu optimistisch.")
        fb = {"issues": issues or ["Keine Auffälligkeiten in den Standardannahmen (Vorlagen-Modus)."], "assumptions_ok": not issues}
        return self.ask("code_reviewer", "Prüfe Konfiguration und Backtest-Annahmen auf Fehlerquellen (Lookahead, Kosten, "
                        "Fill-Logik, Datenqualität).", {"sample_config": sample_config, "assumptions": assumptions}, fb)

    def orchestrator(self, facts: dict) -> AgentReply:
        f = facts["funnel"]
        fb = {"executive_summary": (f"{f['generated']} Strategien erzeugt, {f['backtested']} mit Trades, {f['passed_filter']} "
                                    f"bestanden den ersten Filter, {f['passed_validation']} die Validierung. Status: nur Research."),
              "insights": [f"{k}: {v['passed_filter']}/{v['tested']} bestanden den Filter" for k, v in facts["family_stats"].items()],
              "next_experiments": ["Beste Kandidaten im Paper-Trading über TradingView-Webhook beobachten",
                                   ("Mit echten Broker-Daten (CCXT/MT5) statt synthetischer Daten wiederholen"
                                    if "synthetisch" in str(facts.get("data_source", "")) else
                                    "Auf einem zweiten Markt oder Zeitrahmen gegenprüfen"),
                                   "Kosten-Stresstest mit doppeltem Spread"]}
        return self.ask("orchestrator", "Fasse die Arbeit des Teams zu einem konsolidierten Research-Bericht zusammen: "
                        "Kernaussage, Erkenntnisse, nächste Experimente.", facts, fb)


def hypotheses_to_configs(reply: AgentReply, pair: str, timeframe: str, risk: float, min_rr: float) -> list[StrategyConfig]:
    """'Coding Agent' (deterministisch): Hypothesen -> geprüfte, geklammerte StrategyConfigs."""
    out = []
    for h in reply.data.get("hypotheses", []):
        fam = h.get("family")
        if fam not in FAMILY_SPACE:
            continue
        params = clamp_params(fam, h.get("params") or {})
        if params["tp_atr"] < params["sl_atr"] * min_rr:
            params = clamp_params(fam, {**params, "tp_atr": params["sl_atr"] * min_rr})
        out.append(StrategyConfig(fam, params, pair, timeframe, risk, hypothesis=str(h.get("rationale", ""))[:300]))
    return out
