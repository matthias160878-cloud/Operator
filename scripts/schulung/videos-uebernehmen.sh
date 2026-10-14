#!/usr/bin/env bash
# Kopiert aufgenommene Videos (mp4 + Zeitmarken) nach public/schulung/videos und erzeugt Vorschaubilder.
set -euo pipefail
SRC="${1:?Quellordner mit <schlüssel>.mp4 und .json angeben}"
DST="$(cd "$(dirname "$0")/../.." && pwd)/public/schulung/videos"
mkdir -p "$DST"
for f in "$SRC"/*.mp4; do
  k="$(basename "$f" .mp4)"
  cp "$f" "$DST/$k.mp4"; cp "$SRC/$k.json" "$DST/$k.json"
  ffmpeg -y -loglevel error -ss 4 -i "$f" -frames:v 1 -vf scale=640:-1 -q:v 5 "$DST/$k.jpg"
done
echo "Übernommen: $(ls "$DST"/*.mp4 | wc -l) Videos"
