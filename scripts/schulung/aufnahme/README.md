# Erklärvideos aufnehmen

Die stummen Videos zeigen die echte App (Testkunde, lokale SQLite-Datenbank). Texte und
Untertitel kommen aus `messages/<sprache>/schulungVideos.json` (Quelle: `scripts/schulung/texte.py`).

1. Lokale App starten: Test-DB anlegen (`DATABASE_URL=file:... npx prisma db push`), `npm run preview:seed`,
   `npm run build`, `npx next start -p 3126`.
2. Passwort von `kunde-a@example.test` in `$S58_VIDEO_DIR/pw-a.txt` ablegen.
3. `S58_VIDEO_DIR=/tmp/s58-videos PLAYWRIGHT_CORE=<pfad zu playwright-core> node scripts/schulung/aufnahme/flows.mjs [schlüssel ...]`
4. `bash scripts/schulung/videos-uebernehmen.sh /tmp/s58-videos/out` kopiert mp4, Zeitmarken und Vorschaubilder nach `public/schulung/videos/`.

Ändert sich die Oberfläche, die betroffenen Videos neu aufnehmen. Die Zeitmarken (`<schlüssel>.json`) entstehen dabei automatisch.
