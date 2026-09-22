# SECRET 58 — AI Social Command Center

Dieses Dokument beschreibt die SECRET-58-Implementierung im Next.js-Teilprojekt
(`src/`) dieses Repositories. SECRET 58 ist ein KI-natives Social-Media-Studio:
aus einer Idee entstehen plattformgerechte Inhalte für YouTube, TikTok,
Instagram, LinkedIn, Facebook, Blog und Newsletter — inklusive Skripten,
Hooks, Hashtags, Untertiteln, Voiceover-Anbindung und Publishing-Workflow.

> **Ehrlichkeitsprinzip (Master-Prompt Abschnitt 42):** Jede externe
> Integration (KI-Provider, ElevenLabs, Social-Plattformen, Canva, CapCut,
> Trend-APIs) ist als sauberer Adapter implementiert und zeigt ohne gültige
> Zugangsdaten explizit **„Nicht konfiguriert“** an — es gibt keine
> vorgetäuschten Verbindungen oder erfundenen Daten. Die Text-Pipeline
> (Content Brain, Ideen, Scripts, Hooks, Hashtags) funktioniert auch **ohne**
> KI-Provider über einen deterministischen Template-Fallback, damit die App
> immer startfähig und demonstrierbar bleibt.

## Inhalt

- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Datenbank](#datenbank)
- [Startbefehle](#startbefehle)
- [ElevenLabs Setup (Voice Engine)](#elevenlabs-setup-voice-engine)
- [Social API Setup](#social-api-setup)
- [Architektur](#architektur)
- [Agenten](#agenten)
- [API-Dokumentation](#api-dokumentation)
- [Tests](#tests)
- [Troubleshooting](#troubleshooting)
- [Status-Checkliste](#status-checkliste)
- [Bekannte Grenzen & nächste Schritte](#bekannte-grenzen--nächste-schritte)

## Installation

```bash
npm install
cp .env.example .env      # DATABASE_URL ist der einzige Pflichtwert, Rest optional
npx prisma db push        # legt prisma/dev.db (SQLite) gemäß Schema an
npm run db:seed           # optional: realistische Demo-Daten für das Dashboard
npm run dev                # http://localhost:3000
```

Die Anwendung startet vollständig **ohne** externe API-Keys. Jede nicht
konfigurierte Integration wird im UI (Integrationen, Dashboard, Social Media)
klar als „Nicht konfiguriert“ markiert statt eine Funktion vorzutäuschen.

## Environment Variables

Siehe [`.env.example`](.env.example) für die vollständige Liste. Wichtig:

| Variable | Pflicht | Zweck |
| --- | --- | --- |
| `DATABASE_URL` | Ja | SQLite-Datei (Standard) oder Postgres/MySQL-Connection-String |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Nein | Aktiviert echte KI-Generierung für Content Brain, Idea-, Script-, Hook-, Hashtag-, Thumbnail- und Research-Agent. Ohne Key läuft ein deterministischer Template-Fallback. |
| `ANTHROPIC_MODEL` / `OPENAI_MODEL` | Nein | Überschreibt das Standardmodell (`claude-haiku-4-5-20251001` bzw. `gpt-4o-mini`). |
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID` | Nein | Voice Engine (Text-to-Speech, Voice Library Import) |
| `YOUTUBE_CLIENT_ID/SECRET`, `INSTAGRAM_CLIENT_ID/SECRET`, `TIKTOK_CLIENT_KEY/SECRET`, `LINKEDIN_CLIENT_ID/SECRET`, `FACEBOOK_APP_ID/SECRET` | Nein | App-Zugangsdaten je Social-Plattform (Statusanzeige unter Integrationen/Social Media). Ein echter OAuth-Login-Flow ist vorbereitet, aber noch nicht implementiert (siehe unten). |
| `CANVA_API_KEY`, `CAPCUT_API_KEY` | Nein | Design-/Video-Provider-Status |
| `TREND_API_KEY`, `TREND_API_PROVIDER` | Nein | TrendAgent — ohne diese Variablen zeigt der Agent konsequent „Trend API nicht konfiguriert.“ statt erfundener Trends. |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | Nein | Kauf-Freischaltung über Stripe Checkout (siehe „Kauf-Freischaltung“ unten). Ohne diese Variablen zeigt `/buy` „Zahlung noch nicht konfiguriert.“ |
| `OWNER_ACCESS_KEY` | Nein | Sperrt bei Gesetztsein die **komplette Anwendung** hinter `/buy`, bis bezahlt wurde oder `/unlock?key=...` aufgerufen wird. Ohne diese Variable bleibt die App frei zugänglich. |

Secrets werden ausschließlich serverseitig über `process.env` gelesen — nie im
Frontend-Bundle, nie in Log-Ausgaben, nie in Fehlermeldungen.

## Datenbank

- ORM: **Prisma 6** (siehe [`prisma/schema.prisma`](prisma/schema.prisma))
- Standard-Engine: **SQLite** (`prisma/dev.db`), damit das Projekt ohne
  externen DB-Server läuft. Für Produktion `provider` in
  `prisma/schema.prisma` auf `postgresql`/`mysql` umstellen und
  `DATABASE_URL` entsprechend setzen — das Schema ist provider-agnostisch
  geschrieben (bis auf den Provider selbst).
- Modelle: `Workspace`, `User`, `Brand` (Brand DNA), `Campaign`,
  `ContentIdea`, `ContentItem`, `Script`, `Voice`, `MediaAsset`,
  `PlatformAccount`, `Analytics`, `AgentRun`, `IntegrationStatus`, `Setting`,
  `AuditLog` — jede Tabelle trägt `workspaceId` für vollständige
  Multi-Tenant-Isolation (Abschnitt 29).
- Befehle:
  ```bash
  npm run db:push     # Schema -> DB synchronisieren (Entwicklung)
  npm run db:seed      # Demo-Daten laden (prisma/seed.ts)
  npm run db:studio    # Prisma Studio (DB-GUI) öffnen
  ```

## Startbefehle

```bash
npm run dev     # Entwicklungsserver (Turbopack), http://localhost:3000
npm run build   # Produktions-Build
npm run start   # Produktions-Server
npm run lint    # ESLint (Flat Config)
```

## ElevenLabs Setup (Voice Engine)

1. Account auf [elevenlabs.io](https://elevenlabs.io/) erstellen, API-Key
   kopieren.
2. In `.env`: `ELEVENLABS_API_KEY=...` setzen (optional `ELEVENLABS_VOICE_ID`
   als Standard-Voice, `ELEVENLABS_MODEL_ID` z.B. `eleven_multilingual_v2`).
3. Unter **Voice Studio**: „Von ElevenLabs importieren“ lädt alle Voices des
   Accounts in die lokale Voice Library, oder Voices manuell mit ihrer
   ElevenLabs-Voice-ID anlegen.
4. „Voice Preview“ erzeugt eine Beispiel-Sprachausgabe (max. 500 Zeichen).
5. In der **Content Factory** kann pro Content-Item ein Voiceover aus dem
   hinterlegten Script erzeugt werden — die Audiodatei landet unter
   `public/media/audio/` und wird als `MediaAsset` in der DB referenziert.

Ohne `ELEVENLABS_API_KEY` zeigt die App überall konsequent: „ElevenLabs ist
noch nicht konfiguriert.“ — die Voice Library selbst (Metadaten verwalten)
funktioniert trotzdem, nur die eigentliche Sprachsynthese nicht.

## Social API Setup

Für jede Plattform werden nur **App-Zugangsdaten** (Client-ID/Secret)
benötigt, um den Integrationsstatus auf „Verbunden“ zu heben:

- YouTube: Google Cloud Console → YouTube Data API v3 aktivieren, OAuth
  Client anlegen → `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`.
- Instagram/Facebook: Meta for Developers → App anlegen → `INSTAGRAM_CLIENT_ID/SECRET`, `FACEBOOK_APP_ID/SECRET`.
- TikTok: TikTok for Developers → App anlegen → `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`.
- LinkedIn: LinkedIn Developer Portal → App anlegen → `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`.

**Wichtig:** Das Setzen dieser Variablen aktiviert nur die
„App-Zugangsdaten“-Statusanzeige unter **Integrationen**/**Social Media**.
Ein vollständiger OAuth-Login-Flow pro Nutzer-Account (Redirect, Token-Speicherung,
Refresh) ist als nächster Ausbauschritt vorgesehen und aktuell **nicht**
implementiert — der „Verbinden“-Button ist bewusst deaktiviert, statt eine
Verbindung vorzutäuschen. `PublishingAgent.publishContentItem()` prüft live,
ob ein `PlatformAccount` den Status `CONNECTED` trägt, und veröffentlicht
niemals automatisch ohne diese Prüfung.

## Kauf-Freischaltung (Stripe) & App-Installation (PWA)

SECRET 58 kann komplett offen betrieben werden (Standard, kein Setup nötig)
oder hinter einer Bezahlschranke: erst nach echtem Stripe-Kauf bekommt ein
Kunde Zugriff, der Betreiber selbst hat über einen eigenen Schlüssel immer
Zugriff.

**Ein Paket, ein Preis.** SECRET 58 ("Social Media KI") wird als einzelnes
Komplettpaket mit Vollzugriff verkauft — kein Kleines/Großes Paket, keine
Staffelung, kein Abo. Empfohlener Preis: **797 € einmalig**
(hinterlegt in [`src/lib/pricing.ts`](src/lib/pricing.ts), dort auch
anpassbar). `/buy` zeigt diesen Preis bereits als Ankündigung an, auch
bevor Stripe konfiguriert ist — verbindlich (inkl. funktionierendem
Kaufen-Button) wird er erst mit einem passenden Stripe-Preis.

**Wo trage ich den API-Schlüssel ein?** Genau wie bei jeder anderen
Integration hier (ElevenLabs, Anthropic, …): in `.env` für die lokale
Entwicklung, und im Render-Dashboard unter **Environment** für die Live-Seite
(oder analog beim jeweils genutzten Hoster).

1. **Stripe-Account** auf [stripe.com](https://stripe.com/) anlegen, im
   Dashboard ein Produkt "Social Media KI" mit einem einmaligen Preis von
   797 € (oder dem angepassten Wert aus `src/lib/pricing.ts`) anlegen.
2. In `.env` (bzw. Render-Environment) setzen:
   - `STRIPE_SECRET_KEY` — der geheime API-Key aus dem Stripe-Dashboard
     (Entwickler → API-Schlüssel).
   - `STRIPE_PRICE_ID` — die Preis-ID (`price_...`) des angelegten Produkts.
   - `STRIPE_WEBHOOK_SECRET` — Signing Secret des Webhooks, den du im
     Stripe-Dashboard auf `https://<deine-domain>/api/stripe/webhook`
     für das Event `checkout.session.completed` anlegst.
3. Sobald `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID` gesetzt sind, zeigt `/buy`
   den echten Preis an und der „Jetzt kaufen“-Button leitet zu Stripe
   Checkout weiter. Nach erfolgreicher Zahlung wird der Kunde automatisch
   freigeschaltet (Cookie-basiert, kein separater Account nötig).
4. **`OWNER_ACCESS_KEY` setzen, um die komplette Anwendung zu sperren** —
   ein beliebiges, langes Geheimwort. Solange diese Variable **nicht**
   gesetzt ist, bleibt die App für jeden frei zugänglich (auch ohne
   Stripe-Konfiguration). Erst mit gesetztem `OWNER_ACCESS_KEY` wird jede
   Seite außer `/buy` gesperrt, bis bezahlt wurde.
5. Der Betreiber (du) bleibt immer freigeschaltet über:
   `https://<deine-domain>/unlock?key=<OWNER_ACCESS_KEY>` — einmal im
   eigenen Browser öffnen, danach bleibt der Zugriff dauerhaft (Cookie,
   1 Jahr gültig).

Der Zugriffsschutz sitzt in `src/proxy.ts` (Next.js 16 Proxy/Middleware) und
prüft bei jedem Request entweder das Owner-Cookie oder eine `License` mit
Status `ACTIVE` in der Datenbank. Ohne `OWNER_ACCESS_KEY` ist die Prüfung
komplett inaktiv (No-Op) — die App bleibt wie bisher startfähig ohne jede
Zahlungs-Konfiguration.

**PWA (installierbare App):** Die Anwendung ist als Progressive Web App
ausgelegt (`public/manifest.webmanifest`, `public/sw.js`) — auf iOS/Android
über „Zum Home-Bildschirm hinzufügen“ bzw. „App installieren“ im
Browser-Menü, auf Desktop über das Installations-Icon in der Adressleiste
von Chrome/Edge. Es ist keine separate App-Store-Veröffentlichung nötig;
das Icon nutzt die echte Brain-Grafik aus `public/brand/brain-core.png`.

## Architektur

```
CONTENT BRAIN → IDEA ENGINE → TREND ENGINE → SCRIPT ENGINE → HOOK ENGINE
   → VOICE ENGINE → VIDEO ENGINE → DESIGN ENGINE → PUBLISHING ENGINE
   → ANALYTICS ENGINE → LEARNING ENGINE
```

- `src/app/` — App-Router-Seiten (Dashboard, Content Brain, Brand DNA,
  Ideen & Inspiration, Content Factory (+ Detailseite je Content-Item),
  Script Studio, Voice Studio, Video Studio, Design Studio, Social Media,
  Content Kalender, Analytics, Agenten, Integrationen, Einstellungen) sowie
  `src/app/api/**` (REST-Endpunkte für alle mutierenden Aktionen).
- `src/lib/agents/` — die 14 Agenten aus Abschnitt 20 als reine
  TypeScript-Module, jeder Aufruf läuft über `runAgent()`
  (`src/lib/agents/runner.ts`) und wird in `agent_runs` protokolliert
  (sichtbar im Agent Monitor).
- `src/lib/ai/textGenerator.ts` / `generateJson.ts` — gemeinsamer
  KI-Adapter (Anthropic → OpenAI → Template-Fallback) für alle textbasierten
  Agenten.
- `src/lib/integrations/registry.ts` — zentrale, env-basierte
  Integrations-Statusprüfung (`CONNECTED` / `NOT_CONFIGURED` / `ERROR`),
  genutzt von Dashboard, Integrationen- und Social-Media-Seite.
- `src/lib/video/` — austauschbare `VideoProvider`-Schnittstelle plus
  Format Manager (9:16, 16:9, 1:1, 4:5).
- `src/lib/mediaStorage.ts` — strukturierte lokale Medienablage unter
  `public/media/{audio,video,images,thumbnails,subtitles}` (Abschnitt 25);
  für Produktion durch einen Cloud-Storage-Adapter ersetzbar, ohne die
  aufrufenden Agenten zu ändern.
- `src/lib/workspace.ts` — Multi-Tenant-Grundlage: alle Datenbankzugriffe
  laufen über eine Workspace-ID; aktuell wird ein einzelner Default-Workspace
  verwendet (siehe [Bekannte Grenzen](#bekannte-grenzen--nächste-schritte)).

## Agenten

| Agent | Datei | Aufgabe |
| --- | --- | --- |
| ContentBrainAgent | `lib/agents/contentBrainAgent.ts` | Erstellt aus einer Idee einen vollständigen Kampagnenentwurf über mehrere Plattformen |
| IdeaAgent | `lib/agents/ideaAgent.ts` | Generiert Content-Ideen (Titel, Hook, Zielgruppe, Format, Priorität) |
| TrendAgent | `lib/agents/trendAgent.ts` | Recherchiert Trends **nur** bei konfigurierter Datenquelle, sonst „Trend API nicht konfiguriert.“ |
| ResearchAgent | `lib/agents/researchAgent.ts` | Kurzes Research-Briefing zu einem Thema |
| ScriptAgent | `lib/agents/scriptAgent.ts` | Hook → Problem → Value → Example → Payoff → CTA je Plattform |
| HookAgent | `lib/agents/hookAgent.ts` | 7 Hook-Typen (direkt, neugierig, story, problem, zahlen, kontrovers-sachlich, educational) |
| VoiceAgent | `lib/agents/voiceAgent.ts` | ElevenLabs Text-to-Speech + Medienablage |
| VideoAgent | `lib/agents/videoAgent.ts` | Video-Rendering über austauschbare `VideoProvider` |
| SubtitleAgent | `lib/agents/subtitleAgent.ts` | SRT/VTT-Untertitel lokal aus Skripttext (keine externe API nötig) |
| ThumbnailAgent | `lib/agents/thumbnailAgent.ts` | Text-Konzept für Thumbnails (Titel, Layout, CTA, Bildbeschreibung) |
| HashtagAgent | `lib/agents/hashtagAgent.ts` | Hashtags & Keywords je Plattform |
| PublishingAgent | `lib/agents/publishingAgent.ts` | Workflow DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHED, echte Veröffentlichung nur bei verbundenem Account |
| AnalyticsAgent | `lib/agents/analyticsAgent.ts` | Aggregiert Views/Likes/Kommentare/Shares/Engagement aus der DB |
| LearningAgent | `lib/agents/learningAgent.ts` | Regelbasierte Empfehlungen aus vorhandenen Analytics-Daten (verändert nie automatisch Einstellungen) |

Alle Läufe erscheinen mit Status (`IDLE`/`RUNNING`/`WAITING`/`SUCCESS`/`ERROR`),
Start-/Endzeit, Task und Ergebnis/Fehler im **Agent Monitor**
(`/agents`).

## API-Dokumentation

Alle Endpunkte liegen unter `src/app/api/**` und geben JSON zurück.

| Endpunkt | Methode | Zweck |
| --- | --- | --- |
| `/api/brand` | GET/PUT | Brand DNA lesen/speichern |
| `/api/content-brain` | POST | Kampagne aus Idee generieren (ContentBrainAgent) |
| `/api/ideas` | GET/POST | Ideen auflisten / manuell anlegen |
| `/api/ideas/generate` | POST | Ideen per IdeaAgent generieren |
| `/api/ideas/[id]` | PATCH/DELETE | Idee-Status ändern / löschen |
| `/api/content-items` | GET/POST | Content-Items auflisten (Filter `status`, `platform`) / manuell anlegen |
| `/api/content-items/[id]` | GET/PATCH/DELETE | Content-Item lesen/bearbeiten/löschen |
| `/api/content-items/[id]/status` | POST | Workflow-Übergänge (`review`, `approve`, `reject`, `schedule`, `publish`, `archive`) |
| `/api/content-items/[id]/duplicate` | POST | Content-Item duplizieren |
| `/api/content-items/[id]/repurpose` | POST | Ableger für weitere Plattformen erzeugen (Content Repurposing) |
| `/api/content-items/[id]/script` | POST | Neue Script-Variante generieren |
| `/api/content-items/[id]/hashtags` | POST | Hashtags/Keywords neu generieren |
| `/api/content-items/[id]/voiceover` | POST | Voiceover erzeugen (ElevenLabs) |
| `/api/content-items/[id]/subtitles` | POST | SRT-Untertitel generieren |
| `/api/content-items/[id]/video` | POST | Video-Rendering anfragen (Provider-Status) |
| `/api/voices`, `/api/voices/[id]` | GET/POST/PATCH/DELETE | Voice Library CRUD |
| `/api/voices/import` | POST | Voices aus ElevenLabs-Account importieren |
| `/api/voices/preview` | POST | Voice-Preview erzeugen |
| `/api/script-studio/generate` | POST | Freies Script + Hook-Set generieren |
| `/api/thumbnails/generate` | POST | Thumbnail-Konzept generieren |

## Tests

Es ist noch kein automatisierter Test-Runner eingerichtet (wie im
Haupt-`CLAUDE.md` dokumentiert). Verifiziert wurde stattdessen manuell:

- `npm run lint` — fehlerfrei
- `npm run build` — fehlerfrei (alle Seiten und API-Routen kompilieren)
- End-to-End-Rauchtest aller 15 Seiten (HTTP 200)
- End-to-End-Test der Kernflows über `curl`: Kampagne generieren
  (Content Brain, Template-Modus), Content-Item lesen, Untertitel
  generieren, Workflow-Übergänge (`review`/`publish`), Voiceover ohne
  ElevenLabs-Key (erwarteter, sauberer Fehlertext), Brand-DNA lesen.

Empfehlung für den nächsten Schritt: Vitest/Playwright ergänzen und in
diesem Abschnitt sowie in `CLAUDE.md` dokumentieren (Abschnitt 36 des
Master-Prompts: Auth, Content-Erstellung, Script-Generierung,
API-Validierung, ElevenLabs-Integration, DB, Publishing-Workflow,
Berechtigungen, Multi-Tenancy, Fehlerbehandlung).

## Troubleshooting

| Problem | Lösung |
| --- | --- |
| „ElevenLabs konnte nicht erreicht werden. Prüfe API-Key und Verbindung.“ | `ELEVENLABS_API_KEY` prüfen, Netzwerkzugriff auf `api.elevenlabs.io` sicherstellen. |
| Integrationen zeigen „Nicht konfiguriert“ | Erwartetes Verhalten ohne gesetzte Env-Variablen — kein Fehler. Entsprechende Variable in `.env` setzen und Server neu starten. |
| `npx prisma db push` schlägt fehl | `DATABASE_URL` prüfen; bei SQLite sicherstellen, dass das Verzeichnis beschreibbar ist. |
| Veröffentlichen schlägt fehl mit „ist nicht verbunden“ | Erwartetes Verhalten — es gibt aktuell keinen echten OAuth-Flow; siehe [Social API Setup](#social-api-setup). |
| Build schlägt mit Prisma-Fehlern fehl | `npx prisma generate` erneut ausführen (wird von `npm install` i.d.R. automatisch getriggert). |

## Status-Checkliste

- [x] Anwendung startet (`npm run dev`, `npm run build` fehlerfrei)
- [x] Dashboard funktioniert (KPIs, Produktions-Chart, Kalender-Woche, Agenten, Integrationen, Top Performer)
- [x] Content Brain funktioniert (Kampagnenentwurf aus einer Idee)
- [x] Ideen können erzeugt werden (IdeaAgent + manuell)
- [x] Scripts können erzeugt werden (ScriptAgent + Script Studio)
- [x] Brand DNA funktioniert (vollständiges CRUD)
- [x] ElevenLabs Integration vorbereitet (funktioniert bei gesetztem Key, sonst sauber „nicht konfiguriert“)
- [x] Voice Library funktioniert
- [x] Video Pipeline vorbereitet (Format Manager + austauschbarer Provider, kein Provider fest verdrahtet)
- [x] Untertitel funktionieren (lokal, SRT/VTT)
- [x] Content Calendar funktioniert (Monatsansicht, Plattformfilter)
- [x] Social Accounts können verwaltet werden (Statusanzeige; OAuth-Login-Flow noch offen)
- [x] Publishing Workflow funktioniert (DRAFT…PUBLISHED, echte Veröffentlichung korrekt blockiert ohne verbundenen Account)
- [x] Analytics funktioniert (KPIs, Performance-Chart, Best Performing Content)
- [x] Agent Monitor funktioniert
- [x] Learning Engine funktioniert (regelbasierte Empfehlungen aus echten Analytics-Daten)
- [x] Multi-Tenant-**Datenmodell** vollständig vorbereitet (Workspace-Isolation in jeder Tabelle)
- [ ] Multi-Tenant-**UI** (mehrere Workspaces/Login) — noch offen, siehe unten
- [ ] Authentication/Login-UI — noch offen, siehe unten
- [x] Secrets sind geschützt (ausschließlich Env-Variablen, nie im Frontend/Log)
- [ ] Automatisierte Tests — noch offen, siehe [Tests](#tests)
- [x] Mobile UI funktioniert (responsives Sidebar/Topbar-Layout mit mobilem Menü)
- [x] README vorhanden (dieses Dokument)
- [x] `.env.example` vorhanden

## Bekannte Grenzen & nächste Schritte

Dieses Projekt wurde in einer einzigen Implementierungssession aus einem
leeren Next.js-Grundgerüst aufgebaut. Um ehrlich zu bleiben (Abschnitt 42),
sind folgende Punkte bewusst **nicht** als fertige Funktion ausgegeben:

1. **Authentication/Login** — es gibt noch keine Login-Oberfläche; die App
   nutzt einen einzelnen Default-Workspace (`src/lib/workspace.ts`). Das
   Datenmodell ist vollständig multi-tenant-fähig; es fehlt die
   Session-/Auth-Schicht (z.B. NextAuth) und die UI dafür.
2. **OAuth für Social-Plattformen** — Zugangsdaten-Status wird geprüft, ein
   echter Login-/Token-Flow pro Nutzer-Account fehlt noch.
3. **Video-Rendering** — die Provider-Architektur steht, es ist aber kein
   Video-Provider tatsächlich angebunden (kein Account zum Testen vorhanden).
4. **Trend Engine** — es ist keine Trend-Datenquelle angebunden; der Agent
   zeigt konsequent den Konfigurationsstatus.
5. **Automatisierte Tests** fehlen noch komplett.
6. **Rate Limiting / CSRF** für API-Routen sind noch nicht implementiert
   (Abschnitt 28) — für den produktiven Einsatz ergänzen.

Diese Punkte eignen sich als nächste Ausbauphasen (7–14 des Master-Prompts).
