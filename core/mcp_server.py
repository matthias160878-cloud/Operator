"""Jarvis-Core MCP-Server.

Start: python -m core.mcp_server

Stellt die acht Werkzeuge bereit, über die laut agentic-os-Skill jede
Auftragsführung laufen muss: auftrag_anlegen, auftrag_status,
ergebnis_ablegen, freigabe_anfordern, gedaechtnis_suchen,
gedaechtnis_merken, kosten_buchen, notaus. freigabe_entscheiden ist ein
zusätzliches Werkzeug für die Entscheidung durch Matthias, nicht für Agenten.
"""

from __future__ import annotations

from mcp.server.mcpserver import MCPServer

from . import db, logic

server = MCPServer("jarvis-core")


@server.tool()
def auftrag_anlegen(
    agent: str,
    stufe: int,
    titel: str,
    beschreibung: str = "",
    schluessel: str | None = None,
) -> dict:
    """Legt einen Auftrag an. Mit schluessel idempotent: ein zweiter Aufruf mit
    demselben schluessel gibt den bestehenden Auftrag zurück statt eines Zwillings."""
    return logic.auftrag_anlegen(agent, stufe, titel, beschreibung, schluessel)


@server.tool()
def auftrag_status(auftrag_id: int | None = None, status: str | None = None) -> list:
    """Fragt Aufträge ab, wahlweise nach id oder status gefiltert."""
    return logic.auftrag_status(auftrag_id, status)


@server.tool()
def ergebnis_ablegen(auftrag_id: int, inhalt: str, fertig: bool = False) -> dict:
    """Legt ein Zwischen- oder Endergebnis ab. fertig=True schließt den Auftrag
    ab; für Stufe 3 nur, wenn zuvor eine Freigabe erteilt wurde."""
    return logic.ergebnis_ablegen(auftrag_id, inhalt, fertig)


@server.tool()
def freigabe_anfordern(auftrag_id: int, frage: str) -> dict:
    """Fordert eine Freigabe an und setzt den Auftrag auf 'braucht_freigabe'.
    Die Frage muss ohne Rückfrage entscheidbar sein."""
    return logic.freigabe_anfordern(auftrag_id, frage)


@server.tool()
def freigabe_entscheiden(freigabe_id: int, erteilt: bool, antwort: str = "") -> dict:
    """Entscheidet über eine offene Freigabe (für Matthias, nicht für Agenten)."""
    return logic.freigabe_entscheiden(freigabe_id, erteilt, antwort)


@server.tool()
def gedaechtnis_merken(inhalt: str, verfaellt: str | None = None) -> dict:
    """Legt dauerhaftes Wissen ab, optional mit Verfallsdatum (ISO-Format)."""
    return logic.gedaechtnis_merken(inhalt, verfaellt)


@server.tool()
def gedaechtnis_suchen(suchbegriff: str) -> list:
    """Durchsucht das Gedächtnis, abgelaufene Einträge werden nicht zurückgegeben."""
    return logic.gedaechtnis_suchen(suchbegriff)


@server.tool()
def kosten_buchen(auftrag_id: int, cent: int, beschreibung: str = "") -> dict:
    """Bucht Kosten in ganzen Cent auf einen Auftrag."""
    return logic.kosten_buchen(auftrag_id, cent, beschreibung)


@server.tool()
def notaus(grund: str, aufheben: bool = False) -> dict:
    """Hält alle laufenden Aufträge sofort an. aufheben=True lässt pausierte
    Aufträge weiterlaufen; abgebrochene Aufträge bleiben abgebrochen."""
    return logic.notaus(grund, aufheben)


def main() -> None:
    db.init_db()
    server.run()


if __name__ == "__main__":
    main()
