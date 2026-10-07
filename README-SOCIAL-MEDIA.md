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
| `STRIPE_SETUP_PRICE_ID` | Nein | Optionaler Einrichtungsservice (299 € einmalig), auf `/buy` per Häkchen zum Komplettpaket dazubuchbar. Ohne diese Variable ist das Häkchen deaktiviert. |
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
- Modelle: `Workspace`, `User` (inkl. `passwordHash`), `Session`
  (Server-Sessions, siehe Authentifizierung), `Brand` (Brand DNA),
  `Campaign`, `ContentIdea`, `ContentItem`, `Script`, `Voice`, `MediaAsset`,
  `PlatformAccount`, `Analytics`, `AgentRun`, `IntegrationStatus`, `Setting`,
  `AuditLog`, `License` (an `User`/`Workspace` gebunden) — jede
  Workspace-gebundene Tabelle trägt `workspaceId` für vollständige
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

## Authentifizierung & Mandantentrennung

Jede Kundin/jeder Kunde bekommt über **Registrieren** (`/signup`) einen
eigenen, privaten Workspace — vollständig isoliert von allen anderen
Workspaces (Datenmodell siehe [Datenbank](#datenbank)). Es gibt **keinen**
geteilten Default-Workspace mehr: `getCurrentWorkspaceId()`
(`src/lib/workspace.ts`) löst die Workspace-ID ausschließlich aus der
server-seitigen Session auf (`src/lib/auth.ts`, Cookie `s58_session`,
Session-Token-Hash in der DB) — niemals aus einer vom Client gelieferten ID.
Ohne gültige Session gibt es keinen Zugriff auf `/api/**` (außer
`/api/auth/*`, `/api/stripe/*`, `/api/locale`) oder auf die Dashboard-Seiten
(`src/proxy.ts` erzwingt das für jeden Request).

- `POST /api/auth/signup` — legt einen neuen Nutzer **und** einen neuen,
  leeren Workspace an (Rolle `OWNER`).
- `POST /api/auth/login` / `POST /api/auth/logout`
- Passwörter: `node:crypto.scrypt`, Sessions: zufälliges 32-Byte-Token, in
  der DB wird nur der SHA-256-Hash gespeichert (Modell `Session`).
- Login/Signup sind zusätzlich rate-limitiert (`src/lib/rateLimit.ts`) gegen
  Brute-Force-Versuche.

Lokal testen: `npm run db:seed` legt einen Demo-Login an
(`max.mustermann@secret58.media` / `secret58-demo`, siehe Konsolenausgabe
des Seed-Skripts) — ausschließlich für den lokal geseedeten Demo-Workspace.

## Kauf-Freischaltung (Stripe) & App-Installation (PWA)

SECRET 58 kann komplett offen betrieben werden (Standard, kein Setup nötig)
oder hinter einer Bezahlschranke: erst nach echtem Stripe-Kauf bekommt ein
Kunde Zugriff, der Betreiber selbst hat über einen eigenen Schlüssel immer
Zugriff. Ein Kauf setzt in jedem Fall ein Konto voraus (`/signup`) — ohne
Login weiß die App nicht, welchem Workspace sie die Freischaltung zuordnen
soll; der „Jetzt kaufen“-Button auf `/buy` leitet nicht angemeldete
Besucher automatisch zu `/signup?next=/buy` weiter.

**Zwei Pakete, ein Funktionsumfang.** SECRET 58 wird als zwei Pakete
verkauft — **Pro** (590 € einmalig) und **Maxi** (797 € einmalig),
zentral definiert in [`src/lib/packages.ts`](src/lib/packages.ts) (einzige
Quelle der Wahrheit für Preis und Kontingente; Verkaufsseite, Checkout und
Kontingent-Durchsetzung lesen ausschließlich von dort). Beide Pakete
schalten denselben vollen Funktionsumfang frei (alle 14 Agenten, Voice
Studio, Video Studio) — der Unterschied liegt ausschließlich in
monatlichen Kontingenten für Content-Ideen, KI-Videos und
Sprachausgaben (siehe [Kontingente](#monatliche-kontingente) unten).
`/buy` zeigt beide Preise bereits als Ankündigung an, auch bevor Stripe
konfiguriert ist — verbindlich (inkl. funktionierendem Kaufen-Button)
wird ein Preis erst mit einem passenden, im Stripe-Dashboard angelegten
Preis.

**Wo trage ich den API-Schlüssel ein?** Genau wie bei jeder anderen
Integration hier (ElevenLabs, Anthropic, …): in `.env` für die lokale
Entwicklung, und im Render-Dashboard unter **Environment** für die Live-Seite
(oder analog beim jeweils genutzten Hoster).

1. **Stripe-Account** auf [stripe.com](https://stripe.com/) anlegen, im
   Dashboard **zwei** Produkte mit je einmaligem Preis anlegen: "SECRET 58
   Pro" (590 €) und "SECRET 58 Maxi" (797 €) — oder die angepassten Werte
   aus `src/lib/packages.ts`. Jedes Paket ist unabhängig buchbar, es reicht
   auch, zunächst nur eines der beiden Produkte anzulegen.
2. In `.env` (bzw. Render-Environment) setzen:
   - `STRIPE_SECRET_KEY` — der geheime API-Key aus dem Stripe-Dashboard
     (Entwickler → API-Schlüssel).
   - `STRIPE_PRICE_ID_PRO` / `STRIPE_PRICE_ID_MAXI` — die Preis-IDs
     (`price_...`) der beiden angelegten Produkte.
   - `STRIPE_WEBHOOK_SECRET` — Signing Secret des Webhooks, den du im
     Stripe-Dashboard auf `https://<deine-domain>/api/stripe/webhook`
     für die Events `checkout.session.completed` **und** `charge.refunded`
     anlegst (Letzteres markiert die passende License automatisch als
     `REFUNDED`, sichtbar im Betreiber-Dashboard, siehe unten).
3. Sobald `STRIPE_SECRET_KEY` und die jeweilige Price-ID gesetzt sind,
   zeigt `/buy` für dieses Paket den echten Preis an und der „Jetzt
   kaufen“-Button leitet angemeldete Nutzer zu Stripe Checkout weiter
   (nicht angemeldete zuerst zu `/signup?next=/buy`). Welches Paket
   gekauft wurde, geht als `metadata.packageId` in die Checkout-Session
   (`src/lib/stripe.ts`) und wird beim Freischalten auf die `License`
   übernommen — nie aus Preis/Betrag erraten. Nach erfolgreicher Zahlung
   wird genau der Workspace des kaufenden Kontos freigeschaltet —
   `checkout.sessions` bekommt dafür `client_reference_id = <userId>` aus
   der Server-Session mit, nie aus einem Client-Parameter. Kauft ein
   Workspace später das andere Paket dazu (Wechsel/Upgrade), zählt die
   neueste `ACTIVE`-Lizenz für Zugriff und Kontingent — ältere Lizenzen
   bleiben als Historie erhalten.
4. **`OWNER_ACCESS_KEY` setzen, um zusätzlich zur Anmeldung eine
   Bezahlschranke zu aktivieren** — ein beliebiges, langes Geheimwort.
   Solange diese Variable **nicht** gesetzt ist, reicht ein Konto
   (Signup/Login) aus, um den eigenen Workspace zu nutzen (gut für lokale
   Entwicklung/Demo). Erst mit gesetztem `OWNER_ACCESS_KEY` braucht ein
   angemeldeter Nutzer zusätzlich eine `ACTIVE`-License für seinen
   Workspace — Anmeldung ist davon unabhängig **immer** erforderlich.
5. Der Betreiber (du) bleibt immer freigeschaltet über:
   `https://<deine-domain>/unlock?key=<OWNER_ACCESS_KEY>` — einmal im
   eigenen Browser öffnen, danach bleibt der Zugriff dauerhaft (Cookie,
   1 Jahr gültig). Das Betreiber-Cookie schaltet **nur** die eigene
   Bezahlschranke frei, nicht fremde Kundendaten — siehe
   [Betreiber-Dashboard](#betreiber-dashboard).

Der Zugriffsschutz sitzt in `src/proxy.ts` (Next.js 16 Proxy/Middleware) und
prüft bei jedem Request zunächst eine gültige Session (siehe
[Authentifizierung](#authentifizierung--mandantentrennung)), danach —
nur wenn `OWNER_ACCESS_KEY` gesetzt ist — zusätzlich das Owner-Cookie oder
eine `License` mit Status `ACTIVE` für genau den Workspace der aktuellen
Session (bei mehreren aktiven Lizenzen zählt die neueste).

## Monatliche Kontingente

Solange `OWNER_ACCESS_KEY` gesetzt ist (Bezahlschranke aktiv), gilt pro
Workspace ein monatliches Kontingent — abhängig vom gebuchten Paket
(`src/lib/packages.ts`):

| Paket | Content-Ideen/Monat | KI-Videos/Monat | Sprachausgaben/Monat |
| --- | --- | --- | --- |
| Pro (590 €) | 40 | 3 | 20 |
| Maxi (797 €) | 80 | 4 | 35 |

Durchgesetzt in [`src/lib/quota.ts`](src/lib/quota.ts): vor jedem
kostenpflichtigen Agenten-Aufruf (Ideen generieren, Video rendern,
Voiceover erzeugen) wird gezählt, wie viele `agent_runs` dieser Art der
Workspace seit Monatsbeginn schon hat (die bestehende `agent_runs`-
Tabelle protokolliert ohnehin jeden Aufruf, siehe
[Agenten](#agenten)) — ist das Kontingent erreicht, antwortet die
Route mit `429` und einer klaren Fehlermeldung, **bevor** ein
Provider-Request passiert. Kein automatisches Nachbuchen/Zusatzkosten.
Alle anderen Agenten (Script, Hook, Hashtag, Thumbnail, Subtitle,
Content-Brain, …) bleiben nur durch das bestehende Rate-Limiting
geschützt, nicht zusätzlich durch ein Monatskontingent.

**Herleitung der Zahlen** (nicht mehr frei geschätzt, siehe
`src/lib/packages.ts` für dieselbe Rechnung im Code): Pro/Maxi sind
**einmalige** Zahlungen, aber die Anbieterkosten (Claude/ElevenLabs/
Videogenerator, zentral über Betreiber-Keys, Abschnitt 6 des Auftrags)
laufen bei jeder Nutzung weiter — anders als beim geplanten
Autopilot-Abo, wo die monatliche Zahlung die monatlichen Kosten deckt.
Rechengrundlage: Einmalpreis über **12 Monate** verteilt (derselbe
Zeitraum, der im Preismodell ohnehin als "Updates/Hosting inklusive"
genannt wird), davon **~45 %** als Anbieter-Kostenbudget (Rest = Marge,
vergleichbar mit der Autopilot-Marge von 58–60 %), verteilt auf die in
[`docs/preisanalyse.html`](docs/preisanalyse.html) genannten
Einheitspreise (≈0,07 €/Idee, ≈4,50 €/30-s-Video, ≈0,17 €/Sprachminute,
≈1 Minute je Sprachausgabe angenommen). Video dominiert die Kosten
massiv gegenüber Text/Sprache — deshalb bleibt das Video-Kontingent bei
beiden Paketen bewusst klein; wer regelmäßig mehr Videos braucht, ist
beim geplanten (noch nicht buchbaren) Autopilot-Abo richtig, das
laufende Kosten laufend deckt statt aus einer Einmalzahlung.

**Wichtig:** Nur die beiden Preise (590 €/797 €) sind vom Auftraggeber
bestätigt — die Kontingent-Zahlen oben sind jetzt kostenbasiert
hergeleitet (12-Monats-Horizont, ~45 % Kostenanteil, Anbieterpreise Stand
der Preisanalyse), aber weiterhin kein vom Auftraggeber verbindlich
bestätigter Wert. Die Annahmen sind explizit benannt, damit gezielt eine
davon (z. B. der 12-Monats-Horizont) geändert werden kann, statt die
Zahlen erneut zu schätzen.

## Betreiber-Dashboard

`/operator` — ausschließlich über das Owner-Cookie erreichbar (`/unlock?key=`,
s.o.), komplett getrennt vom Kunden-Session-System. Zeigt aggregierte
Paketzahlungen (Anzahl/Summe aktiver Lizenzen nach Währung **und nach
Paket**, PENDING/REFUNDED-Zähler, die letzten 25 Lizenzen mit
E-Mail/Paket/Betrag/Status) — **keine** privaten Kundeninhalte (Brand DNA,
Kampagnen, Content etc.). Verfügbares Guthaben und tatsächlich ausgezahlte
Beträge werden bewusst **nicht** angezeigt (siehe Hinweistext auf der
Seite) — das liefert nur das Stripe-Dashboard selbst; eine Anbindung dafür
ist nicht Teil dieses Stands.

**Einrichtungsservice & Autopilot-Vorschau:** Zu Pro oder Maxi kann
optional ein Einrichtungsservice (299 € einmalig) dazugebucht werden — dafür in
Stripe ein zweites Produkt mit einmaligem Preis anlegen und
`STRIPE_SETUP_PRICE_ID` setzen. Darunter zeigt `/buy` den geplanten
Autopilot (Monatsabo S/M/L, Werte in `AUTOPILOT_TIERS` in
`src/lib/pricing.ts`) als nicht buchbare Vorschau. Herleitung der Preise:
[`docs/preisanalyse.html`](docs/preisanalyse.html).

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
- [x] Multi-Tenant-**UI/Auth** — Signup/Login/Logout, jede Session isoliert auf genau einen Workspace, kein geteilter Default-Workspace mehr (siehe [Authentifizierung](#authentifizierung--mandantentrennung))
- [x] Zwei Pakete Pro (590 €) / Maxi (797 €), zentral definiert (`src/lib/packages.ts`), inkl. monatlicher Kontingente (siehe [Monatliche Kontingente](#monatliche-kontingente))
- [x] Betreiber-Dashboard (`/operator`, aggregierte Paketzahlungen nach Pro/Maxi aufgeschlüsselt, keine Kundendaten)
- [x] Secrets sind geschützt (ausschließlich Env-Variablen, nie im Frontend/Log)
- [x] Basis-Rate-Limiting (Login/Signup gegen Brute-Force, teure KI-Routen gegen Kostenmissbrauch) — In-Memory, siehe Grenzen unten
- [ ] Automatisierte Tests — noch offen, siehe [Tests](#tests)
- [x] Mobile UI funktioniert (responsives Sidebar/Topbar-Layout mit mobilem Menü)
- [x] README vorhanden (dieses Dokument)
- [x] `.env.example` vorhanden

## Bekannte Grenzen & nächste Schritte

Um ehrlich zu bleiben (Abschnitt 42), sind folgende Punkte bewusst **nicht**
als fertige Funktion ausgegeben:

1. **Kontingent-Zahlen sind kostenbasiert hergeleitet, aber kein
   bestätigter Wert** — vom Auftraggeber bestätigt sind ausschließlich
   die beiden Preise (590 € Pro / 797 € Maxi). Die monatlichen
   Kontingente je Paket (Ideen/Videos/Sprachausgaben, `src/lib/
   packages.ts`) wurden aus den Anbieter-Einheitspreisen der
   Preisanalyse zurückgerechnet (12-Monats-Amortisation, ~45 %
   Kostenanteil) statt frei geschätzt — die zugrunde liegenden Annahmen
   sind aber selbst nicht vom Auftraggeber bestätigt. Insbesondere das
   Video-Kontingent ist wegen der hohen Anbieterkosten pro Video bewusst
   klein (3/4 pro Monat) — vor dem echten Verkaufsstart prüfen, ob das
   für Kunden akzeptabel ist oder ob stattdessen auf das (noch nicht
   buchbare) Autopilot-Abo verwiesen werden soll (siehe
   [Monatliche Kontingente](#monatliche-kontingente) und
   Projektbericht/Restliste).
2. **Genesis-Sprachsteuerung** — existiert nicht im Code (keine Treffer für
   "genesis" im gesamten Repository). Nicht umgesetzt in diesem Stand.
3. **Website-Einbindung ("Meine Webseite verbinden")** — es gibt einen
   internen Support-Chatbot (`src/components/chatbot/ChatWidget.tsx`), aber
   keinen Self-Service-Bereich, über den Kundinnen/Kunden einen Assistenten
   auf ihrer **eigenen** Webseite einbinden können. Nicht umgesetzt.
4. **Eigene Geschäftseinnahmen der Kunden** — `/revenue` erfasst ausschließlich
   **manuelle** Einträge (`RevenueEntry.origin = MANUAL`); es gibt weder eine
   Anbindung bestehender Shops/Zahlungsanbieter noch eine
   Stripe-Connect-Architektur für eigene Verkäufe der Kundinnen/Kunden
   innerhalb von SECRET 58. Nicht umgesetzt.
5. **Betreiber-Dashboard zeigt keine Auszahlungen/Guthaben** — nur
   aggregierte Lizenzzahlungen aus der eigenen DB; Stripe-Auszahlungsdaten
   sind nicht angebunden (siehe [Betreiber-Dashboard](#betreiber-dashboard)).
6. **OAuth für Social-Plattformen** — echte Verbindung (Start/Callback) ist
   implementiert (`src/lib/oauth/`, `src/app/api/oauth/`); `PublishingAgent`
   veröffentlicht live nur bei Status `CONNECTED`.
7. **Video-Rendering** — die Provider-Architektur steht, es ist aber kein
   Video-Provider tatsächlich angebunden (kein Account zum Testen vorhanden).
8. **Trend Engine** — es ist keine Trend-Datenquelle angebunden; der Agent
   zeigt konsequent den Konfigurationsstatus.
9. **Automatisierte Tests** fehlen noch komplett.
10. **Rate Limiting ist In-Memory** (`src/lib/rateLimit.ts`) — korrekt für
    einen einzelnen Prozess (passt zum geplanten Windows-VPS-Deployment),
    zählt aber pro Instanz getrennt, falls je horizontal skaliert wird. Für
    diesen Fall auf einen gemeinsamen Speicher (Redis o.ä.) umstellen.
    **CSRF** für zustandsändernde API-Routen ist nicht implementiert.
11. **Fehlerbehandlung bei fehlender Session** — `getCurrentWorkspaceId()`
    wirft `AuthError`, wenn eine Route trotz `proxy.ts`-Schutz ohne Session
    erreicht wird (sollte in der Praxis nicht vorkommen); das führt aktuell
    zu einem generischen 500 statt einer sauberen 401-JSON-Antwort in allen
    ~40 betroffenen Routen — kein Sicherheitsproblem (der Zugriff bleibt
    blockiert), aber eine unschöne Fehlerantwort. Für eine einheitliche
    401-Behandlung einen gemeinsamen Route-Wrapper ergänzen.

Diese Punkte eignen sich als nächste Ausbauphasen.
