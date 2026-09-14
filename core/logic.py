"""Geschäftsregeln der Auftragsführung.

Getrennt vom MCP-Transport (core/mcp_server.py), damit die Regeln ohne
laufenden Server getestet werden können.
"""

from __future__ import annotations

import sqlite3
from datetime import date
from typing import Any

from . import db

AGENTEN = frozenset(
    {
        "research",
        "content",
        "social",
        "analytik",
        "qualitaet",
        "freelancer",
        "book",
        "affiliate",
        "shop",
        "video",
        "trading",
        "rpa",
    }
)

STUFEN = frozenset({0, 1, 2, 3})

STATUS_OFFEN = "offen"
STATUS_BRAUCHT_FREIGABE = "braucht_freigabe"
STATUS_ABGESCHLOSSEN = "abgeschlossen"
STATUS_ABGEBROCHEN = "abgebrochen"
STATUS_PAUSIERT = "pausiert"


class JarvisError(ValueError):
    """Regelverstoß in der Auftragsführung (z. B. Not-Aus aktiv, unbekannter Agent)."""


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return dict(row)


def _notaus_aktiv(conn: sqlite3.Connection) -> bool:
    row = conn.execute("SELECT aktiv FROM notaus_status WHERE id = 1").fetchone()
    return bool(row and row["aktiv"])


def _get_auftrag(conn: sqlite3.Connection, auftrag_id: int) -> sqlite3.Row:
    row = conn.execute(
        "SELECT * FROM auftraege WHERE id = ?", (auftrag_id,)
    ).fetchone()
    if row is None:
        raise JarvisError(f"Auftrag {auftrag_id} existiert nicht")
    return row


def auftrag_anlegen(
    agent: str,
    stufe: int,
    titel: str,
    beschreibung: str = "",
    schluessel: str | None = None,
) -> dict[str, Any]:
    if agent not in AGENTEN:
        raise JarvisError(
            f"Unbekannter Agent '{agent}'. Erlaubt: {', '.join(sorted(AGENTEN))}"
        )
    if stufe not in STUFEN:
        raise JarvisError(f"Ungültige Stufe {stufe}. Erlaubt: 0, 1, 2, 3")

    with db.get_connection() as conn:
        if schluessel:
            existing = conn.execute(
                "SELECT * FROM auftraege WHERE schluessel = ?", (schluessel,)
            ).fetchone()
            if existing is not None:
                return {**_row_to_dict(existing), "neu_angelegt": False}

        if _notaus_aktiv(conn) and stufe >= 2:
            raise JarvisError(
                "Not-Aus ist aktiv: Aufträge ab Stufe 2 können nicht angelegt werden"
            )

        status = STATUS_BRAUCHT_FREIGABE if stufe == 3 else STATUS_OFFEN
        cur = conn.execute(
            """
            INSERT INTO auftraege (agent, stufe, titel, beschreibung, schluessel, status)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (agent, stufe, titel, beschreibung, schluessel, status),
        )
        auftrag_id = cur.lastrowid
        row = _get_auftrag(conn, auftrag_id)
        return {**_row_to_dict(row), "neu_angelegt": True}


def auftrag_status(
    auftrag_id: int | None = None, status: str | None = None
) -> list[dict[str, Any]]:
    with db.get_connection() as conn:
        if auftrag_id is not None:
            rows = conn.execute(
                "SELECT * FROM auftraege WHERE id = ?", (auftrag_id,)
            ).fetchall()
        elif status is not None:
            rows = conn.execute(
                "SELECT * FROM auftraege WHERE status = ? ORDER BY id", (status,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM auftraege ORDER BY id").fetchall()
        return [_row_to_dict(r) for r in rows]


def ergebnis_ablegen(
    auftrag_id: int, inhalt: str, fertig: bool = False
) -> dict[str, Any]:
    with db.get_connection() as conn:
        auftrag = _get_auftrag(conn, auftrag_id)

        if fertig and auftrag["stufe"] == 3:
            erteilt = conn.execute(
                """
                SELECT 1 FROM freigaben
                WHERE auftrag_id = ? AND status = 'erteilt'
                LIMIT 1
                """,
                (auftrag_id,),
            ).fetchone()
            if erteilt is None:
                raise JarvisError(
                    "Stufe 3 erfordert eine erteilte Freigabe, bevor der Auftrag "
                    "abgeschlossen werden kann (freigabe_anfordern aufrufen)"
                )

        conn.execute(
            "INSERT INTO ergebnisse (auftrag_id, inhalt, fertig) VALUES (?, ?, ?)",
            (auftrag_id, inhalt, int(fertig)),
        )

        if fertig:
            conn.execute(
                "UPDATE auftraege SET status = ?, updated_at = datetime('now') WHERE id = ?",
                (STATUS_ABGESCHLOSSEN, auftrag_id),
            )

        row = _get_auftrag(conn, auftrag_id)
        return _row_to_dict(row)


def freigabe_anfordern(auftrag_id: int, frage: str) -> dict[str, Any]:
    with db.get_connection() as conn:
        _get_auftrag(conn, auftrag_id)
        cur = conn.execute(
            "INSERT INTO freigaben (auftrag_id, frage) VALUES (?, ?)",
            (auftrag_id, frage),
        )
        freigabe_id = cur.lastrowid
        conn.execute(
            "UPDATE auftraege SET status = ?, updated_at = datetime('now') WHERE id = ?",
            (STATUS_BRAUCHT_FREIGABE, auftrag_id),
        )
        row = conn.execute(
            "SELECT * FROM freigaben WHERE id = ?", (freigabe_id,)
        ).fetchone()
        return _row_to_dict(row)


def freigabe_entscheiden(
    freigabe_id: int, erteilt: bool, antwort: str = ""
) -> dict[str, Any]:
    """Nicht Teil der acht Agenten-Werkzeuge — für die Entscheidung durch Matthias."""
    with db.get_connection() as conn:
        freigabe = conn.execute(
            "SELECT * FROM freigaben WHERE id = ?", (freigabe_id,)
        ).fetchone()
        if freigabe is None:
            raise JarvisError(f"Freigabe {freigabe_id} existiert nicht")

        neuer_status = "erteilt" if erteilt else "abgelehnt"
        conn.execute(
            """
            UPDATE freigaben
            SET status = ?, antwort = ?, entschieden_at = datetime('now')
            WHERE id = ?
            """,
            (neuer_status, antwort, freigabe_id),
        )

        auftrag_status_neu = STATUS_OFFEN if erteilt else STATUS_ABGEBROCHEN
        conn.execute(
            "UPDATE auftraege SET status = ?, updated_at = datetime('now') WHERE id = ?",
            (auftrag_status_neu, freigabe["auftrag_id"]),
        )

        row = conn.execute(
            "SELECT * FROM freigaben WHERE id = ?", (freigabe_id,)
        ).fetchone()
        return _row_to_dict(row)


def gedaechtnis_merken(inhalt: str, verfaellt: str | None = None) -> dict[str, Any]:
    with db.get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO gedaechtnis (inhalt, verfaellt) VALUES (?, ?)",
            (inhalt, verfaellt),
        )
        row = conn.execute(
            "SELECT * FROM gedaechtnis WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return _row_to_dict(row)


def gedaechtnis_suchen(suchbegriff: str) -> list[dict[str, Any]]:
    heute = date.today().isoformat()
    with db.get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM gedaechtnis
            WHERE inhalt LIKE ?
              AND (verfaellt IS NULL OR verfaellt >= ?)
            ORDER BY created_at DESC
            """,
            (f"%{suchbegriff}%", heute),
        ).fetchall()
        return [_row_to_dict(r) for r in rows]


def kosten_buchen(auftrag_id: int, cent: int, beschreibung: str = "") -> dict[str, Any]:
    if not isinstance(cent, int):
        raise JarvisError("Kosten müssen in ganzen Cent gebucht werden")

    with db.get_connection() as conn:
        _get_auftrag(conn, auftrag_id)
        conn.execute(
            "INSERT INTO kosten (auftrag_id, cent, beschreibung) VALUES (?, ?, ?)",
            (auftrag_id, cent, beschreibung),
        )
        summe = conn.execute(
            "SELECT COALESCE(SUM(cent), 0) AS summe FROM kosten WHERE auftrag_id = ?",
            (auftrag_id,),
        ).fetchone()["summe"]
        return {"auftrag_id": auftrag_id, "gebucht_cent": cent, "summe_cent": summe}


def notaus(grund: str, aufheben: bool = False) -> dict[str, Any]:
    with db.get_connection() as conn:
        if aufheben:
            conn.execute(
                "UPDATE notaus_status SET aktiv = 0, grund = ?, updated_at = datetime('now') WHERE id = 1",
                (grund,),
            )
            wieder_angelaufen = conn.execute(
                "SELECT id FROM auftraege WHERE status = ?", (STATUS_PAUSIERT,)
            ).fetchall()
            ids = [r["id"] for r in wieder_angelaufen]
            conn.execute(
                "UPDATE auftraege SET status = ?, updated_at = datetime('now') WHERE status = ?",
                (STATUS_OFFEN, STATUS_PAUSIERT),
            )
            return {
                "aktiv": False,
                "grund": grund,
                "wieder_angelaufen": ids,
                "hinweis": "Abgebrochene Aufträge bleiben abgebrochen und müssen neu angelegt werden.",
            }

        conn.execute(
            "UPDATE notaus_status SET aktiv = 1, grund = ?, updated_at = datetime('now') WHERE id = 1",
            (grund,),
        )
        betroffen = conn.execute(
            "SELECT id FROM auftraege WHERE status IN (?, ?)",
            (STATUS_OFFEN, "laeuft"),
        ).fetchall()
        ids = [r["id"] for r in betroffen]
        conn.execute(
            "UPDATE auftraege SET status = ?, updated_at = datetime('now') WHERE status IN (?, ?)",
            (STATUS_PAUSIERT, STATUS_OFFEN, "laeuft"),
        )
        return {"aktiv": True, "grund": grund, "pausiert": ids}
