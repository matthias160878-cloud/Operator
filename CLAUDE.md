# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This is a Next.js (App Router) application, bootstrapped with `create-next-app`, using TypeScript and Tailwind CSS v4. It is the starting point for the Darwin AI Assistant web app.

## Commands

- `npm install` — install dependencies
- `npm run dev` — start the development server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint with ESLint (flat config, `eslint.config.mjs`)

There is no test runner configured yet. When tests are added, document how to run the full suite and a single test here.

## Architecture

- `src/app/` — App Router routes. `layout.tsx` defines the root HTML shell and fonts (Geist Sans/Mono via `next/font/google`); `page.tsx` is the landing page.
- `src/app/globals.css` — Tailwind v4 import and CSS custom properties (light/dark theme via `prefers-color-scheme`).
- `public/` — static assets served from `/`.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).

## Claude Code skills

If this project ever integrates skills from an external "Jarvis" skills collection, symlink them into `.claude/skills` rather than copying the files, so updates to the source collection are picked up automatically:

```
ln -s /path/to/jarvis/skills /path/to/this-repo/.claude/skills
```
