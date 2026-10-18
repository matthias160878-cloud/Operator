#!/usr/bin/env python3
"""Baut aus film-projects/<slug>/03-shotlist.csv die Schnittdateien.

Erzeugt in <projekt>/edit/:
  timeline.edl          CMX3600 (Premiere Pro, DaVinci Resolve, LumaFusion)
  timeline.fcpxml       FCPXML 1.9 (Final Cut Pro, DaVinci Resolve)
  subtitles.srt         Untertitel aus der Spalte "voiceover"
  clips-checklist.md    welche clips/<shot_id>.mp4 noch fehlen

Nur Standardbibliothek, keine Abhängigkeiten.
"""

import argparse
import csv
import json
import re
import sys
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

REQUIRED_COLUMNS = ["shot_id", "duration_s", "description", "voiceover"]
SHOT_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,8}$")
RESOLUTIONS = {
    "16:9": (1920, 1080),
    "9:16": (1080, 1920),
    "1:1": (1080, 1080),
    "4:5": (1080, 1350),
}


def fail(message):
    print(f"Fehler: {message}", file=sys.stderr)
    sys.exit(1)


def load_project(project_dir):
    meta_path = project_dir / "project.json"
    if not meta_path.exists():
        return {}
    try:
        return json.loads(meta_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"project.json ist kein gültiges JSON: {exc}")


def load_shots(project_dir, fps):
    csv_path = project_dir / "03-shotlist.csv"
    if not csv_path.exists():
        fail(f"{csv_path} nicht gefunden")
    with csv_path.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            fail(f"Spalten fehlen in 03-shotlist.csv: {', '.join(missing)}")
        shots = []
        seen = set()
        for line_no, row in enumerate(reader, start=2):
            shot_id = (row.get("shot_id") or "").strip()
            if not SHOT_ID_RE.match(shot_id):
                fail(f"Zeile {line_no}: ungültige shot_id {shot_id!r} (1-8 Zeichen, a-z 0-9 _ -)")
            if shot_id in seen:
                fail(f"Zeile {line_no}: shot_id {shot_id} doppelt")
            seen.add(shot_id)
            try:
                seconds = float((row.get("duration_s") or "").replace(",", "."))
            except ValueError:
                fail(f"Zeile {line_no}: duration_s {row.get('duration_s')!r} ist keine Zahl")
            frames = round(seconds * fps)
            if frames <= 0:
                fail(f"Zeile {line_no}: duration_s muss größer als 0 sein")
            shots.append({
                "id": shot_id,
                "frames": frames,
                "description": (row.get("description") or "").strip(),
                "voiceover": (row.get("voiceover") or "").strip(),
            })
    if not shots:
        fail("03-shotlist.csv enthält keine Shots")
    return shots


def timecode(frames, fps, hour_offset=0):
    total = frames + hour_offset * 3600 * fps
    ff = total % fps
    secs = total // fps
    return f"{secs // 3600:02d}:{secs // 60 % 60:02d}:{secs % 60:02d}:{ff:02d}"


def srt_time(frames, fps):
    ms = round(frames * 1000 / fps)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def build_edl(title, shots, fps):
    lines = [f"TITLE: {title}", "FCM: NON-DROP FRAME", ""]
    record = 0
    for i, shot in enumerate(shots, start=1):
        dur = shot["frames"]
        lines.append(
            f"{i:03d}  {shot['id']:<8} V     C        "
            f"{timecode(0, fps)} {timecode(dur, fps)} "
            f"{timecode(record, fps, 1)} {timecode(record + dur, fps, 1)}"
        )
        lines.append(f"* FROM CLIP NAME: {shot['id']}.mp4")
        lines.append("")
        record += dur
    return "\n".join(lines)


def build_fcpxml(title, shots, fps, width, height, clips_dir):
    def rt(frames):
        return f"{frames}/{fps}s"

    total = sum(s["frames"] for s in shots)
    assets = []
    clips = []
    offset = 0
    for i, shot in enumerate(shots, start=1):
        ref = f"r{i + 1}"
        src = (clips_dir / f"{shot['id']}.mp4").resolve().as_uri()
        assets.append(
            f'    <asset id="{ref}" name={quoteattr(shot["id"])} start="0s" '
            f'duration="{rt(shot["frames"])}" hasVideo="1" format="r1">\n'
            f'      <media-rep kind="original-media" src={quoteattr(src)}/>\n'
            f"    </asset>"
        )
        clips.append(
            f'            <asset-clip ref="{ref}" name={quoteattr(shot["id"])} '
            f'offset="{rt(offset)}" duration="{rt(shot["frames"])}" start="0s"/>'
        )
        offset += shot["frames"]
    return "\n".join([
        '<?xml version="1.0" encoding="UTF-8"?>',
        "<!DOCTYPE fcpxml>",
        '<fcpxml version="1.9">',
        "  <resources>",
        f'    <format id="r1" frameDuration="1/{fps}s" width="{width}" height="{height}"/>',
        *assets,
        "  </resources>",
        "  <library>",
        f"    <event name={quoteattr(title)}>",
        f"      <project name={quoteattr(title)}>",
        f'        <sequence format="r1" duration="{rt(total)}" tcStart="0s" tcFormat="NDF">',
        "          <spine>",
        *clips,
        "          </spine>",
        "        </sequence>",
        "      </project>",
        "    </event>",
        "  </library>",
        "</fcpxml>",
        "",
    ])


def build_srt(shots, fps):
    blocks = []
    start = 0
    for shot in shots:
        end = start + shot["frames"]
        if shot["voiceover"]:
            blocks.append(
                f"{len(blocks) + 1}\n{srt_time(start, fps)} --> {srt_time(end, fps)}\n{shot['voiceover']}\n"
            )
        start = end
    return "\n".join(blocks)


def build_checklist(title, shots, fps, clips_dir):
    lines = [f"# Clip-Checkliste — {escape(title)}", "",
             "Lege jeden Clip als `clips/<shot_id>.mp4` ab.", "",
             "| Status | Shot | Dauer | Beschreibung |", "| --- | --- | --- | --- |"]
    missing = 0
    for shot in shots:
        exists = (clips_dir / f"{shot['id']}.mp4").exists()
        missing += not exists
        desc = shot["description"].replace("|", "/")
        lines.append(f"| {'✅' if exists else '⬜'} | {shot['id']} | {shot['frames'] / fps:.1f} s | {desc} |")
    lines += ["", f"Fehlend: {missing} von {len(shots)}", ""]
    return "\n".join(lines), missing


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("project_dir", type=Path)
    parser.add_argument("--fps", type=int, help="überschreibt fps aus project.json")
    args = parser.parse_args()

    project_dir = args.project_dir
    if not project_dir.is_dir():
        fail(f"Projektordner {project_dir} nicht gefunden")
    meta = load_project(project_dir)
    fps = args.fps or int(meta.get("fps") or 24)
    if fps <= 0:
        fail("fps muss größer als 0 sein")
    title = str(meta.get("title") or project_dir.name)
    width, height = RESOLUTIONS.get(str(meta.get("aspect_ratio") or "16:9"), RESOLUTIONS["16:9"])

    shots = load_shots(project_dir, fps)
    clips_dir = project_dir / "clips"
    edit_dir = project_dir / "edit"
    edit_dir.mkdir(exist_ok=True)

    (edit_dir / "timeline.edl").write_text(build_edl(title, shots, fps), encoding="utf-8")
    (edit_dir / "timeline.fcpxml").write_text(
        build_fcpxml(title, shots, fps, width, height, clips_dir), encoding="utf-8")
    (edit_dir / "subtitles.srt").write_text(build_srt(shots, fps), encoding="utf-8")
    checklist, missing = build_checklist(title, shots, fps, clips_dir)
    (edit_dir / "clips-checklist.md").write_text(checklist, encoding="utf-8")

    total_s = sum(s["frames"] for s in shots) / fps
    print(f"{len(shots)} Shots, {total_s:.1f} s @ {fps} fps, {width}x{height}")
    print(f"Geschrieben: {edit_dir}/timeline.edl, timeline.fcpxml, subtitles.srt, clips-checklist.md")
    print(f"Fehlende Clips: {missing} von {len(shots)}")


if __name__ == "__main__":
    main()
