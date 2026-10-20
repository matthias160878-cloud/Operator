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
- `npm run mcp` — MCP-Server (stdio) mit Website-Social-, SEO- und Inbox-Tools starten (`src/mcp/server.mts`, Doku in `README-SOCIAL-MEDIA.md` → MCP-Server)

- `npm run typecheck` — TypeScript-Typprüfung (`next typegen` erzeugt die Routen-Typen wie `LayoutProps`, danach `tsc --noEmit`)
- `npm test` — alle Tests einmal ausführen (Vitest)
- `npm run test:watch` — Tests im Watch-Modus
- Einzelne Datei: `npx vitest run src/lib/messaging/send.test.ts`; einzelner Test: `npx vitest run -t "Thread-URN"`

### Tests

- Vitest (`vitest.config.mts`), Node-Umgebung. Testdateien liegen neben dem Code als `*.test.ts` (z. B. `src/lib/messaging/send.test.ts`); gemeinsame Helfer in `tests/` (`helpers.ts`: `mockFetch`, `resetInbox`; `fixtures.ts`).
- Kein echter Netzwerkverkehr: Plattform-APIs, Webhooks und Website-Abrufe werden mit `mockFetch` simuliert, DNS per `vi.mock("node:dns/promises")`. KI-Schlüssel sind leer, Agenten laufen im Vorlagen-Modus.
- Datenbank: `tests/globalSetup.ts` legt pro Lauf eine eigene SQLite-Datei im Temp-Ordner an (`prisma db push`) und löscht sie danach; `dev.db` bleibt unberührt. Dateien laufen nacheinander (`fileParallelism: false`).
- Umgebungsvariablen in Tests mit `vi.stubEnv` setzen — sie werden nach jedem Test zurückgesetzt (`tests/setup.ts`).
- CI: `.github/workflows/ci.yml` führt bei jedem Push auf `main` und jedem PR Lint, Typprüfung, Tests und Build aus, außerdem `pytest` für `assistant/`.

## Architektur

`src/` ist SECRET 58 — AI Social Command Center. Vollständige Architektur-,
Agenten- und API-Dokumentation: siehe [`README-SOCIAL-MEDIA.md`](README-SOCIAL-MEDIA.md).

- `src/app/` — App-Router-Seiten (Dashboard, Content Brain, Brand DNA, Ideen,
  Content Factory, Script/Voice/Video/Design Studio, Social Media,
  Content Kalender, Analytics, SEO-Analyse, Posts aus Website, Posteingang,
  Website-Widget,
  Agenten, Integrationen, Einstellungen) sowie
  `src/app/api/**` für alle mutierenden Aktionen. `layout.tsx` bindet den
  App-Shell (Sidebar/Topbar, `src/components/layout/`) und die Schriftarten
  (Geist Sans/Mono über `next/font/google`) ein; `page.tsx` ist das Dashboard.
- `src/app/globals.css` — Tailwind-v4-Import und CSS-Custom-Properties für das
  dunkle Command-Center-Theme.
- `public/widget.js` — einbettbares Website-Chat-Widget (Logik in
  `src/lib/widget/`, öffentliche Route `src/app/api/v1/widget/messages`).
- `src/lib/` — Domänenlogik: `agents/` (19 Agenten + Logging-Runner),
  `ai/` (KI-Provider-Adapter mit Template-Fallback), `integrations/`
  (env-basierte Statusprüfung), `video/` (Provider-Abstraktion + Format
  Manager), `web/` (sicherer Website-Abruf + HTML-Extraktion), `db.ts`
  (Prisma-Client), `workspace.ts`, `brand.ts`, `mediaStorage.ts`.
- `src/mcp/server.mts` — MCP-Server (stdio), der die Agenten als Tools
  bereitstellt (`npm run mcp`, Registrierung über `.mcp.json`).
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
