# CLAUDE.md

Diese Datei gibt Claude Code (claude.ai/code) Hinweise für die Arbeit mit dem Code in diesem Repository.

## Repository-Status

Dieses Repository enthält zwei unabhängige Teilprojekte:

- **`src/`** — Next.js-Anwendung (App Router), erstellt mit `create-next-app`, TypeScript und Tailwind CSS v4. Ausgangspunkt für die Darwin-AI-Assistant-Webanwendung.
- **`assistant/`** — eigenständiges Python-Projekt für einen lokalen KI-Assistenten (Textmodus + optionale Sprach-Erweiterung mit faster-whisper/sherpa-onnx). Siehe `assistant/README.md` für Befehle, Architektur und Einrichtung — eigene, unabhängige Implementierung, keine Kopie eines bezahlten Produkts.

Die folgenden Abschnitte beziehen sich auf das Next.js-Teilprojekt (`src/`).

## Befehle

- `npm install` — Abhängigkeiten installieren
- `npm run dev` — Entwicklungsserver starten (http://localhost:3000)
- `npm run build` — Produktions-Build erstellen
- `npm run start` — Produktions-Build ausführen
- `npm run lint` — mit ESLint prüfen (Flat Config, `eslint.config.mjs`)
- `npm run db:push` — Prisma-Schema mit der (lokalen SQLite-)Datenbank synchronisieren
- `npm run db:seed` — Demo-Daten laden (`prisma/seed.ts`)
- `npm run db:studio` — Prisma Studio (DB-GUI) öffnen

Es ist noch kein Test-Runner eingerichtet. Sobald Tests hinzugefügt werden, hier dokumentieren, wie man die gesamte Suite und einen einzelnen Test ausführt.

## Architektur

`src/` ist SECRET 58 — AI Social Command Center. Vollständige Architektur-,
Agenten- und API-Dokumentation: siehe [`README-SOCIAL-MEDIA.md`](README-SOCIAL-MEDIA.md).

- `src/app/` — App-Router-Seiten (Dashboard, Content Brain, Brand DNA, Ideen,
  Content Factory, Script/Voice/Video/Design Studio, Social Media,
  Content Kalender, Analytics, Agenten, Integrationen, Einstellungen) sowie
  `src/app/api/**` für alle mutierenden Aktionen. `layout.tsx` bindet den
  App-Shell (Sidebar/Topbar, `src/components/layout/`) und die Schriftarten
  (Geist Sans/Mono über `next/font/google`) ein; `page.tsx` ist das Dashboard.
- `src/app/globals.css` — Tailwind-v4-Import und CSS-Custom-Properties für das
  dunkle Command-Center-Theme.
- `src/lib/` — Domänenlogik: `agents/` (14 Agenten + Logging-Runner),
  `ai/` (KI-Provider-Adapter mit Template-Fallback), `integrations/`
  (env-basierte Statusprüfung), `video/` (Provider-Abstraktion + Format
  Manager), `db.ts` (Prisma-Client), `workspace.ts`, `brand.ts`,
  `mediaStorage.ts`.
- `prisma/schema.prisma` — Datenmodell (SQLite standardmäßig,
  `DATABASE_URL` in `.env`); `prisma/seed.ts` für Demo-Daten
  (`npm run db:seed`).
- `public/` — statische Assets sowie `public/media/**` (lokale
  Medienablage für generierte Audio-/Untertitel-/Bild-Dateien).
- Pfad-Alias `@/*` verweist auf `src/*` (siehe `tsconfig.json`).

## Claude Code Skills

Falls dieses Projekt jemals Skills aus einer externen "Jarvis"-Skill-Sammlung einbindet, diese per Symlink nach `.claude/skills` verlinken statt die Dateien zu kopieren, damit Updates der Quellsammlung automatisch übernommen werden:

```
ln -s /pfad/zu/jarvis/skills /pfad/zu/diesem-repo/.claude/skills
```
