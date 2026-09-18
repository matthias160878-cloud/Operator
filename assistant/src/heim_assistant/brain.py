from __future__ import annotations

import anthropic

from .config import Settings
from .tools import TOOL_DEFINITIONS, run_tool

MAX_TOOL_ITERATIONS = 8


class Brain:
    """Führt die Unterhaltung mit Claude inklusive Tool-Use-Schleife."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = anthropic.Anthropic(api_key=settings.api_key)
        self.messages: list[dict] = []

    def ask(self, user_message: str) -> str:
        self.messages.append({"role": "user", "content": user_message})

        for _ in range(MAX_TOOL_ITERATIONS):
            response = self._create_message()

            if response.stop_reason == "refusal":
                self.messages.append({"role": "assistant", "content": response.content})
                category = getattr(response.stop_details, "category", None)
                return f"Ich kann dabei nicht helfen (Kategorie: {category})."

            self.messages.append({"role": "assistant", "content": response.content})

            if response.stop_reason != "tool_use":
                return "".join(
                    block.text for block in response.content if block.type == "text"
                )

            tool_results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue
                try:
                    output = run_tool(block.name, block.input, self.settings.workspace_dir)
                    tool_results.append(
                        {"type": "tool_result", "tool_use_id": block.id, "content": output}
                    )
                except Exception as exc:  # Fehler an das Modell zurückgeben, nicht crashen
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": str(exc),
                            "is_error": True,
                        }
                    )
            self.messages.append({"role": "user", "content": tool_results})

        return "Zu viele Werkzeugaufrufe in Folge - bitte die Anfrage präzisieren."

    def _create_message(self) -> anthropic.types.Message:
        try:
            return self.client.messages.create(
                model=self.settings.model,
                max_tokens=4096,
                system=self.settings.system_prompt,
                tools=TOOL_DEFINITIONS,
                messages=self.messages,
            )
        except anthropic.AuthenticationError:
            raise SystemExit(
                "Ungültiger oder fehlender ANTHROPIC_API_KEY. Siehe README.md."
            )
        except anthropic.RateLimitError as exc:
            retry_after = exc.response.headers.get("retry-after", "60")
            raise SystemExit(f"Rate-Limit erreicht. Erneut versuchen in {retry_after}s.")
        except anthropic.APIConnectionError:
            raise SystemExit("Keine Verbindung zur Anthropic-API. Internetverbindung prüfen.")
        except anthropic.APIStatusError as exc:
            raise SystemExit(f"API-Fehler ({exc.status_code}): {exc.message}")
