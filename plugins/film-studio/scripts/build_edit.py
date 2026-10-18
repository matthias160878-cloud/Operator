#!/usr/bin/env python3
"""Baut aus den Shotlists eines Filmprojekts die Schnittdateien.

Kurzfilm (film-projects/<slug>/03-shotlist.csv) — erzeugt in <projekt>/edit/:
  timeline.edl          CMX3600 (Premiere Pro, DaVinci Resolve, LumaFusion)
  timeline.fcpxml       FCPXML 1.9 (Final Cut Pro, DaVinci Resolve)
  subtitles.srt         Untertitel aus der Spalte "voiceover"
  clips-checklist.md    welche clips/<shot_id>.mp4 noch fehlen

Spielfilm (project.json mit "type": "feature", Sequenzen unter sequences/*/):
  baut zuerst jede Sequenz wie einen Kurzfilm und dann in <projekt>/edit/:
  film.fcpxml, film.srt, film.edl (bei mehr als 999 Shots film-partN.edl,
  weil CMX3600 nur 999 Events pro Liste erlaubt) und clips-checklist.md.

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
EDL_MAX_EVENTS = 999
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
        fail(f"{meta_path} ist kein gültiges JSON: {exc}")


def load_shots(project_dir, fps):
    csv_path = project_dir / "03-shotlist.csv"
    if not csv_path.exists():
        fail(f"{csv_path} nicht gefunden")
    clips_dir = project_dir / "clips"
    with csv_path.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        missing = [c for c in REQUIRED_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            fail(f"{csv_path}: Spalten fehlen: {', '.join(missing)}")
        shots = []
        seen = set()
        for line_no, row in enumerate(reader, start=2):
            shot_id = (row.get("shot_id") or "").strip()
            if not SHOT_ID_RE.match(shot_id):
                fail(f"{csv_path} Zeile {line_no}: ungültige shot_id {shot_id!r} (1-8 Zeichen, a-z 0-9 _ -)")
            if shot_id in seen:
                fail(f"{csv_path} Zeile {line_no}: shot_id {shot_id} doppelt")
            seen.add(shot_id)
            try:
                seconds = float((row.get("duration_s") or "").replace(",", "."))
            except ValueError:
                fail(f"{csv_path} Zeile {line_no}: duration_s {row.get('duration_s')!r} ist keine Zahl")
            frames = round(seconds * fps)
            if frames <= 0:
                fail(f"{csv_path} Zeile {line_no}: duration_s muss größer als 0 sein")
            shots.append({
                "id": shot_id,
                "frames": frames,
                "description": (row.get("description") or "").strip(),
                "voiceover": (row.get("voiceover") or "").strip(),
                "clip": clips_dir / f"{shot_id}.mp4",
            })
    if not shots:
        fail(f"{csv_path} enthält keine Shots")
    return shots


def timecode(frames, fps, hour_offset=0):
    total = frames + hour_offset * 3600 * fps
    ff = total % fps
    secs = total // fps
    return f"{secs // 3600:02d}:{secs // 60 % 60:02d}:{secs % 60:02d}:{ff:02d}"


def srt_time(frames, fps):
    ms = round(frames * 1000 / fps)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def build_edl(title, shots, fps, record_start=0):
    lines = [f"TITLE: {title}", "FCM: NON-DROP FRAME", ""]
    record = record_start
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


def build_fcpxml(title, shots, fps, width, height):
    def rt(frames):
        return f"{frames}/{fps}s"

    total = sum(s["frames"] for s in shots)
    assets = []
    clips = []
    offset = 0
    for i, shot in enumerate(shots, start=1):
        ref = f"r{i + 1}"
        src = shot["clip"].resolve().as_uri()
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


def checklist_rows(shots, fps):
    rows = []
    missing = 0
    for shot in shots:
        exists = shot["clip"].exists()
        missing += not exists
        desc = shot["description"].replace("|", "/")
        rows.append(f"| {'✅' if exists else '⬜'} | {shot['id']} | {shot['frames'] / fps:.1f} s | {desc} |")
    return rows, missing


def build_checklist(title, shots, fps):
    rows, missing = checklist_rows(shots, fps)
    lines = [f"# Clip-Checkliste — {escape(title)}", "",
             "Lege jeden Clip als `clips/<shot_id>.mp4` ab.", "",
             "| Status | Shot | Dauer | Beschreibung |", "| --- | --- | --- | --- |",
             *rows, "", f"Fehlend: {missing} von {len(shots)}", ""]
    return "\n".join(lines), missing


def resolve_format(meta, fps_override):
    fps = fps_override or int(meta.get("fps") or 24)
    if fps <= 0:
        fail("fps muss größer als 0 sein")
    width, height = RESOLUTIONS.get(str(meta.get("aspect_ratio") or "16:9"), RESOLUTIONS["16:9"])
    return fps, width, height


def build_short(project_dir, meta, fps, width, height, quiet=False):
    title = str(meta.get("title") or project_dir.name)
    shots = load_shots(project_dir, fps)
    edit_dir = project_dir / "edit"
    edit_dir.mkdir(exist_ok=True)

    (edit_dir / "timeline.edl").write_text(build_edl(title, shots, fps), encoding="utf-8")
    (edit_dir / "timeline.fcpxml").write_text(
        build_fcpxml(title, shots, fps, width, height), encoding="utf-8")
    (edit_dir / "subtitles.srt").write_text(build_srt(shots, fps), encoding="utf-8")
    checklist, missing = build_checklist(title, shots, fps)
    (edit_dir / "clips-checklist.md").write_text(checklist, encoding="utf-8")

    if not quiet:
        total_s = sum(s["frames"] for s in shots) / fps
        print(f"{len(shots)} Shots, {total_s:.1f} s @ {fps} fps, {width}x{height}")
        print(f"Geschrieben: {edit_dir}/timeline.edl, timeline.fcpxml, subtitles.srt, clips-checklist.md")
        print(f"Fehlende Clips: {missing} von {len(shots)}")
    return title, shots, missing


def build_feature(project_dir, meta, fps, width, height):
    title = str(meta.get("title") or project_dir.name)
    seq_root = project_dir / "sequences"
    seq_dirs = sorted(p for p in seq_root.iterdir() if p.is_dir()) if seq_root.is_dir() else []
    if not seq_dirs:
        fail(f"keine Sequenzen unter {seq_root} gefunden")

    all_shots = []
    sequences = []
    owner = {}
    skipped = []
    for seq_dir in seq_dirs:
        if not (seq_dir / "03-shotlist.csv").exists():
            skipped.append(seq_dir.name)
            continue
        seq_meta = load_project(seq_dir)
        seq_title, shots, missing = build_short(seq_dir, {**meta, **seq_meta}, fps, width, height, quiet=True)
        for shot in shots:
            if shot["id"] in owner:
                fail(f"shot_id {shot['id']} kommt in {owner[shot['id']]} und {seq_dir.name} vor — "
                     "IDs müssen im ganzen Film eindeutig sein (Präfix je Sequenz, z. B. Q01S001)")
            owner[shot["id"]] = seq_dir.name
        all_shots.extend(shots)
        sequences.append((seq_dir.name, seq_title, shots, missing))
    if not all_shots:
        fail("noch keine Sequenz hat eine 03-shotlist.csv")

    edit_dir = project_dir / "edit"
    edit_dir.mkdir(exist_ok=True)
    for old in edit_dir.glob("film*.edl"):
        old.unlink()

    edl_files = []
    if len(all_shots) <= EDL_MAX_EVENTS:
        (edit_dir / "film.edl").write_text(build_edl(title, all_shots, fps), encoding="utf-8")
        edl_files.append("film.edl")
    else:
        record = 0
        for part, start in enumerate(range(0, len(all_shots), EDL_MAX_EVENTS), start=1):
            chunk = all_shots[start:start + EDL_MAX_EVENTS]
            name = f"film-part{part}.edl"
            (edit_dir / name).write_text(
                build_edl(f"{title} Teil {part}", chunk, fps, record), encoding="utf-8")
            edl_files.append(name)
            record += sum(s["frames"] for s in chunk)
    (edit_dir / "film.fcpxml").write_text(
        build_fcpxml(title, all_shots, fps, width, height), encoding="utf-8")
    (edit_dir / "film.srt").write_text(build_srt(all_shots, fps), encoding="utf-8")

    total_missing = sum(s[3] for s in sequences)
    lines = [f"# Clip-Checkliste — {escape(title)}", "",
             "Clips liegen je Sequenz unter `sequences/<sequenz>/clips/<shot_id>.mp4`.", "",
             "| Sequenz | Titel | Shots | Dauer | Fehlend |", "| --- | --- | --- | --- | --- |"]
    for name, seq_title, shots, missing in sequences:
        dur = sum(s["frames"] for s in shots) / fps
        lines.append(f"| {name} | {escape(seq_title)} | {len(shots)} | {dur / 60:.1f} min | {missing} |")
    if skipped:
        lines += ["", f"Noch ohne Shotlist: {', '.join(skipped)}"]
    lines += ["", f"Fehlend gesamt: {total_missing} von {len(all_shots)}", ""]
    (edit_dir / "clips-checklist.md").write_text("\n".join(lines), encoding="utf-8")

    total_s = sum(s["frames"] for s in all_shots) / fps
    print(f"Spielfilm: {len(sequences)} Sequenzen, {len(all_shots)} Shots, "
          f"{total_s / 60:.1f} min @ {fps} fps, {width}x{height}")
    if skipped:
        print(f"Noch ohne Shotlist (übersprungen): {', '.join(skipped)}")
    print(f"Geschrieben: {edit_dir}/{', '.join(edl_files)}, film.fcpxml, film.srt, clips-checklist.md")
    print(f"Fehlende Clips: {total_missing} von {len(all_shots)}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("project_dir", type=Path)
    parser.add_argument("--fps", type=int, help="überschreibt fps aus project.json")
    args = parser.parse_args()

    project_dir = args.project_dir
    if not project_dir.is_dir():
        fail(f"Projektordner {project_dir} nicht gefunden")
    meta = load_project(project_dir)
    fps, width, height = resolve_format(meta, args.fps)
    if meta.get("type") == "feature":
        build_feature(project_dir, meta, fps, width, height)
    else:
        build_short(project_dir, meta, fps, width, height)


if __name__ == "__main__":
    main()
