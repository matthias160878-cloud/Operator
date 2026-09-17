# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repository is **Jarvis-Core**: the MCP server behind the `agentic-os`
skill's Auftragsführung (order/task tracking, approvals, memory, costs,
emergency stop).

## Build / run / test

```
python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"
.venv/bin/python -m core.mcp_server        # start the MCP server (stdio)
.venv/bin/pytest                           # run all tests
.venv/bin/pytest tests/test_logic.py::test_notaus_pausiert_offene_auftraege_und_blockiert_neue  # single test
```

The SQLite database defaults to `jarvis.db` in the working directory;
override with the `JARVIS_DB_PATH` environment variable. Tests use an
autouse fixture (`tests/conftest.py`) that points `db.DB_PATH` at a temp
file, so they never touch the real database.

## Architecture

- `core/db.py` — SQLite schema and connection helper (`auftraege`,
  `ergebnisse`, `freigaben`, `gedaechtnis`, `kosten`, `notaus_status`).
- `core/logic.py` — business rules, transport-independent so they can be
  unit-tested without an MCP client. Raises `JarvisError` on rule
  violations (unknown agent, invalid Stufe, notaus active, missing
  approval, unknown id).
- `core/mcp_server.py` — thin MCP tool wrappers around `core/logic.py`,
  built on `mcp.server.mcpserver.MCPServer` (the `mcp` package is on
  major version 2; `FastMCP` was renamed `MCPServer`). Entry point:
  `python -m core.mcp_server`.

### Rules encoded from the `agentic-os` skill

- **Stufe** (order level) is 0–3. Stufe 3 orders start in
  `braucht_freigabe` and can only be closed (`ergebnis_ablegen(...,
  fertig=True)`) after a granted `freigabe` exists for that order — this
  is enforced in `logic.ergebnis_ablegen`, not just documented.
- `schluessel` (idempotency key) on `auftrag_anlegen` makes a repeated
  call with the same key return the existing order instead of creating a
  duplicate.
- `notaus(grund)` pauses every order in `offen`/`laeuft` to `pausiert` and
  blocks creating new Stufe ≥ 2 orders while active; `notaus(grund,
  aufheben=True)` resumes paused orders but never revives orders that were
  separately cancelled (`abgebrochen`, e.g. via a rejected approval) — those
  must be recreated, matching "abgebrochene bleiben abgebrochen" in the
  skill.
- `freigabe_entscheiden` (grant/reject an approval) is **not** one of the
  eight agent-facing tools named in the skill — it exists for the human
  operator (Matthias) to decide pending approvals, since agents only ever
  request them via `freigabe_anfordern`.
- `AGENTEN` in `core/logic.py` is the fixed set of one-word agent names
  from the skill (`research`, `content`, `social`, `analytik`,
  `qualitaet`, `freelancer`, `book`, `affiliate`, `shop`, `video`,
  `trading`, `rpa`); `auftrag_anlegen` rejects anything else.

## Claude Code skills

If this project ever integrates skills from an external "Jarvis" skills collection, symlink them into `.claude/skills` rather than copying the files, so updates to the source collection are picked up automatically:

```
ln -s /path/to/jarvis/skills /path/to/this-repo/.claude/skills
```
