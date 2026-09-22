#!/usr/bin/env bash
# SECRET 58 — Setup-Skript für das AI Social Command Center.
# Installiert Abhängigkeiten, legt die lokale SQLite-Datenbank an und
# lädt optional Demo-Daten. Sicher wiederholt ausführbar.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installiere Abhängigkeiten"
npm install

if [ ! -f .env ]; then
  echo "==> Erstelle .env aus .env.example"
  cp .env.example .env
else
  echo "==> .env existiert bereits, wird nicht überschrieben"
fi

echo "==> Synchronisiere Datenbankschema (Prisma)"
npx prisma db push

read -r -p "Demo-Daten laden? [y/N] " answer
if [[ "${answer:-}" =~ ^[Yy]$ ]]; then
  echo "==> Lade Demo-Daten"
  npm run db:seed
fi

echo "==> Fertig. Starte mit: npm run dev"
