from __future__ import annotations

import sys

from .brain import Brain
from .config import Settings


def main() -> None:
    settings = Settings.from_env()
    if not settings.api_key:
        print(
            "Kein ANTHROPIC_API_KEY gesetzt. Beispiel: "
            "export ANTHROPIC_API_KEY=sk-ant-...\n"
            "Siehe README.md für die Einrichtung.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    brain = Brain(settings)
    print("Textmodus-Assistent bereit. 'exit' zum Beenden.\n")
    while True:
        try:
            user_input = input("Du: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if user_input.lower() in {"exit", "quit", "ende"}:
            break
        if not user_input:
            continue
        antwort = brain.ask(user_input)
        print(f"Assistent: {antwort}\n")


if __name__ == "__main__":
    main()
