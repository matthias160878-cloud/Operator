# CLAUDE.md

Diese Datei gibt Claude Code (claude.ai/code) Hinweise für die Arbeit mit dem Code in diesem Repository.

## Repository-Status

Dies ist eine Next.js-Anwendung (App Router), erstellt mit `create-next-app`, unter Verwendung von TypeScript und Tailwind CSS v4. Sie ist der Ausgangspunkt für die Darwin-AI-Assistant-Webanwendung.

## Befehle

- `npm install` — Abhängigkeiten installieren
- `npm run dev` — Entwicklungsserver starten (http://localhost:3000)
- `npm run build` — Produktions-Build erstellen
- `npm run start` — Produktions-Build ausführen
- `npm run lint` — mit ESLint prüfen (Flat Config, `eslint.config.mjs`)

Es ist noch kein Test-Runner eingerichtet. Sobald Tests hinzugefügt werden, hier dokumentieren, wie man die gesamte Suite und einen einzelnen Test ausführt.

## Architektur

- `src/app/` — App-Router-Routen. `layout.tsx` definiert das Root-HTML-Gerüst und die Schriftarten (Geist Sans/Mono über `next/font/google`); `page.tsx` ist die Startseite.
- `src/app/globals.css` — Tailwind-v4-Import und CSS-Custom-Properties (Hell-/Dunkelmodus über `prefers-color-scheme`).
- `public/` — statische Assets, die unter `/` ausgeliefert werden.
- Pfad-Alias `@/*` verweist auf `src/*` (siehe `tsconfig.json`).

## Claude Code Skills

Falls dieses Projekt jemals Skills aus einer externen "Jarvis"-Skill-Sammlung einbindet, diese per Symlink nach `.claude/skills` verlinken statt die Dateien zu kopieren, damit Updates der Quellsammlung automatisch übernommen werden:

```
ln -s /pfad/zu/jarvis/skills /pfad/zu/diesem-repo/.claude/skills
```
