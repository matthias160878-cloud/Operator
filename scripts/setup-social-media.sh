#!/usr/bin/env bash
# SECRET 58 — Setup-Skript für das AI Social Command Center.
# Installiert Abhängigkeiten und ruft dann die eigentliche Einrichtung auf
# (scripts/setup.mjs: .env, Geheimnisse, Datenbank, Redirect-URLs).
# Sicher wiederholt ausführbar. Alle Optionen werden durchgereicht,
# z. B. ./scripts/setup-social-media.sh --yes --no-seed
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installiere Abhängigkeiten"
npm install

node scripts/setup.mjs "$@"
