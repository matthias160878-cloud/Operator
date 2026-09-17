"""SQLite storage for Jarvis-Core: Aufträge, Freigaben, Gedächtnis, Kosten."""

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(os.environ.get("JARVIS_DB_PATH", "jarvis.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS auftraege (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    stufe INTEGER NOT NULL,
    titel TEXT NOT NULL,
    beschreibung TEXT NOT NULL DEFAULT '',
    schluessel TEXT UNIQUE,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ergebnisse (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auftrag_id INTEGER NOT NULL REFERENCES auftraege(id),
    inhalt TEXT NOT NULL,
    fertig INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS freigaben (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auftrag_id INTEGER NOT NULL REFERENCES auftraege(id),
    frage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'offen',
    antwort TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    entschieden_at TEXT
);

CREATE TABLE IF NOT EXISTS gedaechtnis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inhalt TEXT NOT NULL,
    verfaellt TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kosten (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auftrag_id INTEGER NOT NULL REFERENCES auftraege(id),
    cent INTEGER NOT NULL,
    beschreibung TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notaus_status (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    aktiv INTEGER NOT NULL DEFAULT 0,
    grund TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(SCHEMA)
        conn.execute(
            "INSERT OR IGNORE INTO notaus_status (id, aktiv, grund) VALUES (1, 0, '')"
        )
