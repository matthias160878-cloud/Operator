"""Lokale Werkzeuge, die der Assistent per Tool-Use aufrufen kann.

Datei-Werkzeuge sind bewusst auf ein einziges Arbeitsverzeichnis
(``workspace_dir``) beschränkt, damit das Sprachmodell nicht auf beliebige
Pfade auf dem Rechner zugreifen kann.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo, available_timezones

TOOL_DEFINITIONS = [
    {
        "name": "get_current_time",
        "description": (
            "Gibt das aktuelle Datum und die Uhrzeit zurück, optional für eine "
            "IANA-Zeitzone (z. B. 'Europe/Berlin')."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "timezone": {
                    "type": "string",
                    "description": "IANA-Zeitzonenname, z. B. 'Europe/Berlin'. Optional.",
                }
            },
            "additionalProperties": False,
        },
    },
    {
        "name": "list_workspace_files",
        "description": "Listet Dateien und Ordner im Arbeitsverzeichnis des Assistenten auf.",
        "input_schema": {
            "type": "object",
            "properties": {
                "subpath": {
                    "type": "string",
                    "description": "Optionaler Unterordner innerhalb des Arbeitsverzeichnisses.",
                }
            },
            "additionalProperties": False,
        },
    },
    {
        "name": "read_workspace_file",
        "description": "Liest den Textinhalt einer Datei im Arbeitsverzeichnis des Assistenten.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Relativer Pfad zur Datei innerhalb des Arbeitsverzeichnisses.",
                }
            },
            "required": ["path"],
            "additionalProperties": False,
        },
    },
]


class WorkspaceAccessError(ValueError):
    """Wird ausgelöst, wenn ein Pfad das Arbeitsverzeichnis verlassen würde."""


def _resolve_within_workspace(workspace_dir: Path, relative: str) -> Path:
    candidate = (workspace_dir / relative).resolve()
    if workspace_dir not in candidate.parents and candidate != workspace_dir:
        raise WorkspaceAccessError(f"Pfad '{relative}' liegt außerhalb des Arbeitsverzeichnisses.")
    return candidate


def get_current_time(timezone: str | None = None) -> str:
    if timezone:
        if timezone not in available_timezones():
            return f"Unbekannte Zeitzone: {timezone}"
        now = datetime.now(ZoneInfo(timezone))
    else:
        now = datetime.now().astimezone()
    return now.strftime("%A, %d.%m.%Y %H:%M:%S %Z")


def list_workspace_files(workspace_dir: Path, subpath: str = "") -> str:
    target = _resolve_within_workspace(workspace_dir, subpath)
    if not target.exists():
        return f"'{subpath}' existiert nicht im Arbeitsverzeichnis."
    if target.is_file():
        return target.name
    entries = sorted(p.name + ("/" if p.is_dir() else "") for p in target.iterdir())
    return "\n".join(entries) if entries else "(leer)"


def read_workspace_file(workspace_dir: Path, path: str) -> str:
    target = _resolve_within_workspace(workspace_dir, path)
    if not target.is_file():
        return f"'{path}' ist keine Datei im Arbeitsverzeichnis."
    try:
        return target.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return f"'{path}' ist keine Textdatei."


def run_tool(name: str, tool_input: dict, workspace_dir: Path) -> str:
    if name == "get_current_time":
        return get_current_time(tool_input.get("timezone"))
    if name == "list_workspace_files":
        return list_workspace_files(workspace_dir, tool_input.get("subpath", ""))
    if name == "read_workspace_file":
        return read_workspace_file(workspace_dir, tool_input["path"])
    raise ValueError(f"Unbekanntes Werkzeug: {name}")
