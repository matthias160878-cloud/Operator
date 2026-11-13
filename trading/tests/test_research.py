import json
from types import SimpleNamespace

from algo_trading.agents import ResearchTeam, hypotheses_to_configs
from algo_trading.report import render, save
from algo_trading.research import run_research


class FakeStream:
    def __init__(self, text):
        self.text = text

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def get_final_message(self):
        return SimpleNamespace(stop_reason="end_turn", stop_details=None, content=[SimpleNamespace(type="text", text=self.text)])


class FakeClient:
    def __init__(self):
        self.calls = []
        self.beta = SimpleNamespace(messages=SimpleNamespace(stream=self._stream))

    def _stream(self, **kw):
        self.calls.append(kw)
        role = kw["system"].split("Deine Rolle - ")[1].split(":")[0]
        if role == "Strategy Researcher":
            data = {"hypotheses": [{"family": "breakout", "rationale": "Ausbruch nach Range", "params": {"lookback": 999, "sl_atr": 1.5, "tp_atr": 2}},
                                   {"family": "unbekannt", "rationale": "x", "params": {}}]}
        else:
            data = {}
        return FakeStream(json.dumps(data))


def test_template_mode_end_to_end(df, settings):
    r = run_research(df, settings, pair="EURUSD", timeframe="15m", n_strategies=80, top_k=3, workers=1, data_source="test")
    assert r["ai_mode"].startswith("Vorlagen") and r["funnel"]["generated"] == 80
    md = render(r)
    assert "Validation Gate" in md and "NUR RESEARCH" in md
    assert save(r, settings.reports_dir).exists()


def test_claude_agents_use_schema_and_fallbacks(settings):
    client = FakeClient()
    team = ResearchTeam(settings, client=client)
    reply = team.strategy_researcher({"regime": "range"}, "EURUSD", "15m")
    call = client.calls[0]
    assert call["model"] == "claude-fable-5-2" and call["fallbacks"] == "default"
    assert call["output_config"]["format"]["type"] == "json_schema"
    cfgs = hypotheses_to_configs(reply, "EURUSD", "15m", 0.01, 2.0)
    assert len(cfgs) == 1  # unbekannte Familie verworfen
    assert cfgs[0].params["lookback"] == 120 and cfgs[0].rr >= 2.0  # geklammert
