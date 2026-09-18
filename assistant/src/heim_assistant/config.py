from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_MODEL = "claude-opus-5"
DEFAULT_SYSTEM_PROMPT = (
    "Du bist ein hilfsbereiter, lokal laufender KI-Assistent. "
    "Antworte auf Deutsch, knapp und konkret. Nutze die verfügbaren "
    "Werkzeuge, wenn eine Anfrage Dateizugriff im Arbeitsverzeichnis "
    "oder die aktuelle Uhrzeit erfordert."
)


@dataclass(frozen=True)
class Settings:
    api_key: str | None
    model: str
    system_prompt: str
    workspace_dir: Path

    @classmethod
    def from_env(cls) -> "Settings":
        workspace = Path(
            os.environ.get("ASSISTANT_WORKSPACE", Path(__file__).resolve().parents[2] / "workspace")
        ).resolve()
        workspace.mkdir(parents=True, exist_ok=True)
        return cls(
            api_key=os.environ.get("ANTHROPIC_API_KEY"),
            model=os.environ.get("ASSISTANT_MODEL", DEFAULT_MODEL),
            system_prompt=os.environ.get("ASSISTANT_SYSTEM_PROMPT", DEFAULT_SYSTEM_PROMPT),
            workspace_dir=workspace,
        )
