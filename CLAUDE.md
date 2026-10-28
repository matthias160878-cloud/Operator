# CLAUDE.md

Diese Datei gibt Claude Code (claude.ai/code) Hinweise für die Arbeit mit dem Code in diesem Repository.

## Hauptseite www.secret58.com (unantastbar)

Die Hauptseite von SECRET 58 ist die **„Secret 58 Zentrale“** (claude.ai-Artifact, Eigentümer: Matthias Lippek):
<https://claude.ai/artifact/Kha1HUHqEmbZLRgNErWC6Q> — Unterseiten per `#/<seite>`, z. B. `#/social-media-ki`, `#/ki-agenten`, `#/preise`.

- Sie ist die Seite, von der alles ausgeht. Sagt Matthias „secret58.com“, „www.secret58.com“ oder „meine Hauptseite“, wird **immer diese Seite** gezeigt (Link angeben).
- **Oberfläche und Inhalt dieser Seite werden nie verändert** (kein Republish, keine Änderung an Gestaltung, Texten oder Technik), außer Matthias ordnet es ausdrücklich an. Änderungen nur an Kopien.
- Die Seite ist eine Demo mit Beispieldaten (rein im Browser, ohne Server). Was nicht angebunden ist, ist als Demo / vorbereitet / noch nicht eingerichtet zu kennzeichnen.
- Umstellung der echten Domain secret58.com (liegt bei IONOS) erst nach ausdrücklicher Freigabe eines geprüften Ergebnisses.
- Stand 14.10.2026: Der Bereich `#/social-media-ki` ist auf Anordnung von Matthias an die Staging-App angebunden (Buttons → `secret58-staging.onrender.com/buy` und `/login`, Preise Pro 590 €/Maxi 797 € netto, Aktionszeiträume mit Codes, Autopilot S/M/L als „Demnächst“, Block „Stand der Anbindungen“). Kopie der Seite: `public/hauptseite/` (Staging: `/hauptseite/index.html`). Die Codes müssen vor Aktionsbeginn in der App angelegt werden.
- Stand 19.10.2026: Auf Anordnung von Matthias Abschnitt `#reichweitenaufbau` in `#/social-media-ki` ergänzt (Version 74, auch in `public/hauptseite/`): Links zu `/reichweitenaufbau`, `/weiterempfehlungen` und `/settings/zugaenge` der Staging-App sowie Wegweiser zum eigenen Resend-Schlüssel (inkl. DMARC, Version 76) und zu eigenen KI-Schlüsseln. Auf Staging sind `REICHWEITE_NEWSLETTER=1` und `REICHWEITE_WERBUNG=1` gesetzt.
- Stand 20.10.2026: Auf Anordnung von Matthias (Version 77, auch in `public/hauptseite/`): Impressum ohne Platzhalter (kein Handelsregister, Kontaktformular als zweiter Kontaktweg), Datenschutz mit korrekter Angabe zu Google Fonts und Verweis auf die App-Datenschutzerklärung, Social-Media-Agent „Antworten“ standardmäßig „fragen“, Login-Karte führt zur echten App-Anmeldung, „Stand der Anbindungen“ auf 20.10.2026 aktualisiert. Kundenbereich der KI-Agenten, Finanzen und Checkout der Zentrale bleiben gekennzeichnete Demos.
- Stand 20.10.2026 (später): Auf Anordnung von Matthias Kleinunternehmer nach § 19 UStG — alle Preise (Pro 590 €/Maxi 797 €/Monat, Jahr 6.018 €/8.129,40 €) sind Endpreise ohne USt (Hauptseite Version 78 und `public/hauptseite/`, AGB, App). Fuß der Hauptseite verlinkt „Verträge hier kündigen“ → `/kuendigen` (Kündigungsbutton § 312k BGB). Checkout bleibt gesperrt, bis Matthias die neuen Stripe-Preise mit „Inklusive Steuer“ angelegt und eingetragen hat (Anleitung: `docs/BETRIEB-UND-ZAHLUNGEN.md` Abschnitt 9).
- Stand 25.10.2026: Auf Anordnung von Matthias („Ja, alles umstellen“) ist die Hauptseite (Version 79) die neue Zentrale (Kopie: `public/zentrale-neu/`, Staging: `/zentrale-neu`). Die alte Fassung (Version 78) bleibt im Versionsverlauf des Artifacts. Für secret58.com ist die App vorbereitet: Besucher ohne Sitzung kommen unter „/“ auf `/zentrale-neu/index.html` (`src/proxy.ts`), angemeldete Kunden in die App. Auf secret58.com wird `X-Robots-Tag: all` gesendet, auf Staging/onrender.com bleibt `noindex` (`next.config.ts`). Den DNS-Eintrag bei IONOS (A @ → 216.24.57.1, CNAME www → secret58-staging.onrender.com) und die Custom Domain in Render setzt Matthias selbst.
- Stand 26.10.2026: Auf Anordnung von Matthias Standard-Stil der Hauptseite **Neon** (Version 84, auch `public/zentrale-neu/`), unabhängig von Hell/Dunkel des Geräts; eigene Wahl im Design-Fenster bleibt. Sprachwahl mit 34 Sprachen (Wörterbücher `public/zentrale-neu/i18n/`, Skript `uebersetzen.js`, auch auf `/buy`); Rechtstexte bleiben deutsch.
- Stand 28.10.2026: Auf Anordnung von Matthias Webseitenkonzepte um Konzept 8–16 ergänzt (OPAL, NOIR, PULSE, Magic Moments, Wings of Experience, Sechs Bildwelten, 36 Designwelten, Drei Kolibri-Entwürfe, Kolibri Premium; Dateien unter `public/zentrale-neu/referenzen/`). Menü ausgedünnt: Webseitenkonzepte, 36 Designwelten und Bildvorschläge im Menü „Webdesign“. Konzept 16 enthält auf Anordnung die Kolibri-Pakete Premium ab 14.900 €, Ultimate ab 32.900 €, Signature ab 50.000 € (Endpreise, § 19 UStG) mit unverbindlichem Preisrechner; die bisherigen Webdesign-Preise der Hauptseite (ab 1.490 €) sind unverändert. Staging-Freigabe am 28.10.2026.
- Stand 28.10.2026 (später): Auf Anordnung von Matthias Unterseite `#/webseiten-preise` („Webseiten & Preise“, Datei `public/zentrale-neu/webseiten-preise/`) im Menü „Webdesign“ verlinkt und auf Staging freigegeben: 8 Stufen mit Preisspannen 500–1.200 € bis ab 50.000 €, Zusatzleistungen, Care-Pakete, Preisrechner (Endpreise, § 19 UStG). Ausführliche Katalogtexte, Zielgruppen, Care-Beschreibungen, Zahlungs-/Nutzungshinweise und Originalbilder wurden nicht geliefert und nicht ergänzt. Angebotsrechner aus der oberen Leiste genommen (bleibt unter „Mehr“).
- Stand 28.10.2026 (Abend): Auf Anordnung von Matthias („Durch 8 Stufen ersetzen“) die alten Webdesign-Preise der Hauptseite (Starter 1.490 €, Business 2.900 €, KI-Agenten-Website 5.900 €, Pflege & Hosting 39 €) überall durch die 8 Stufen (500–1.200 € … ab 50.000 €) und Care-Pakete (ab 39 €/Monat) ersetzt: Preise, Webdesign, Paketübersicht, Marktvergleich, FAQ, Startseiten-Karten, Chat-Agent. Daten zentral in `WEB_STUFEN/WEB_SPANNEN/WEB_EXTRAS/WEB_CARE` (1:1 aus `webseiten-preise/index.html`). Webdesign-Festpreise aus dem Demo-Checkout entfernt; Buttons führen zur Anfrage. Kolibri-Pakete in Konzept 16 unverändert.

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

- `npm run typecheck` — TypeScript-Prüfung
- `npm test` — Unit-Tests (`tests/unit.test.ts`, node:test über tsx); einzelner Test: `npx tsx --test --test-name-pattern="Genesis" tests/unit.test.ts`
- `npm run build && npm run test:integration` — Integrationstests gegen den Produktions-Build mit isolierter SQLite-Testdatenbank und lokalen Stripe-/KI-Attrappen (`tests/fake-services.mjs`); einzelner Test: `node --test --test-name-pattern="Widget" tests/integration.test.mjs`
- `npm run preview:seed` — Testkonten für eine private, lokale Vorschau (nur gegen SQLite, nie Produktion)

Mehrkundenbetrieb, Pakete, Zahlungen und Bereitstellung: [`docs/BETRIEB-UND-ZAHLUNGEN.md`](docs/BETRIEB-UND-ZAHLUNGEN.md).
Workspace-ID immer über `getCurrentWorkspaceId()` (Sitzung) — nie aus Anfrageparametern; Datensätze per ID über `src/lib/ownership.ts` prüfen.

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
