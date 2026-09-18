from pathlib import Path

import pytest

from heim_assistant.tools import (
    WorkspaceAccessError,
    get_current_time,
    list_workspace_files,
    read_workspace_file,
)


@pytest.fixture
def workspace(tmp_path: Path) -> Path:
    (tmp_path / "notiz.txt").write_text("hallo welt", encoding="utf-8")
    (tmp_path / "unterordner").mkdir()
    return tmp_path


def test_get_current_time_returns_string():
    assert isinstance(get_current_time(), str)


def test_get_current_time_unknown_timezone():
    assert "Unbekannte Zeitzone" in get_current_time("Nirgendwo/Erfunden")


def test_list_workspace_files(workspace: Path):
    listing = list_workspace_files(workspace)
    assert "notiz.txt" in listing
    assert "unterordner/" in listing


def test_read_workspace_file(workspace: Path):
    assert read_workspace_file(workspace, "notiz.txt") == "hallo welt"


def test_read_workspace_file_missing(workspace: Path):
    assert "ist keine Datei" in read_workspace_file(workspace, "fehlt.txt")


def test_path_traversal_is_blocked(workspace: Path):
    with pytest.raises(WorkspaceAccessError):
        read_workspace_file(workspace, "../../etc/passwd")
