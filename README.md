# Operator — SECRET 58 AI Social Command Center

Ein [Next.js](https://nextjs.org)-Projekt (App Router, TypeScript, Tailwind CSS): **SECRET 58**, ein KI-natives Social-Media-Command-Center, das aus einer Idee plattformgerechten Content für YouTube, TikTok, Instagram, LinkedIn, Facebook, Blog und Newsletter erzeugt.

Vollständige Dokumentation (Architektur, Agenten, API, Setup): siehe [`README-SOCIAL-MEDIA.md`](README-SOCIAL-MEDIA.md).

## Loslegen

```bash
npm install
cp .env.example .env
npx prisma db push
npm run db:seed   # optional: Demo-Daten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000). Die App startet vollständig ohne externe API-Keys — nicht konfigurierte Integrationen werden im UI klar als „Nicht konfiguriert“ angezeigt.

## Skripte

- `npm run dev` — Entwicklungsserver starten
- `npm run build` — Produktions-Build erstellen
- `npm run start` — Produktions-Build ausführen
- `npm run lint` — mit ESLint prüfen
- `npm run db:push` / `npm run db:seed` / `npm run db:studio` — Datenbank verwalten (siehe [`README-SOCIAL-MEDIA.md`](README-SOCIAL-MEDIA.md))
