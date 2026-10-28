# Übergabe-Prompt SECRET 58 (Stand 14.10.2026)

Diesen Text als erste Nachricht in eine neue Claude-Code-Sitzung (Repository
`matthias160878-cloud/Operator`) einfügen. Er enthält den geprüften Stand,
alle Regeln und die offenen Schritte. Geheimnisse stehen hier **nicht** —
sie gehören nur in das Render-Dashboard.

---

Du übernimmst das Projekt **SECRET 58** (Zentrale-Webseite + AI Social Media
Command Center, Ziel: alles unter www.secret58.com). Arbeite auf dem Branch
`claude/modest-fermat-ysdjp6` im Repository `matthias160878-cloud/Operator`
weiter (letzter Commit `9cca7f4`). Lies zuerst `CLAUDE.md`,
`docs/STAND-2026-10-10.md`, `docs/BETRIEB-UND-ZAHLUNGEN.md` und
`README-SOCIAL-MEDIA.md`. Erfinde nichts, was dort nicht steht; prüfe am Code.

## 1. Regeln (gelten ohne Ausnahme)

- Gestaltung und Inhalte der Zentrale und der Social-Media-Oberfläche
  erhalten; Funktionen passend ergänzen. Größere Designänderungen nur mit
  meiner Zustimmung.
- Private Vorschauen, lokale Prüfungen und Testbetrieb sind erlaubt. **Keine**
  öffentliche Veröffentlichung, echten Zahlungen, Social-Media-Posts oder
  Nachrichten ohne meine ausdrückliche Freigabe. Fehlende Anbindungen klar als
  „Demo“, „vorbereitet“ oder „noch nicht eingerichtet“ kennzeichnen.
- Jeder Kunde hat einen isolierten Arbeitsbereich. Workspace-ID nur aus der
  Sitzung (`getCurrentWorkspaceId()` / `requireSessionUser()`), nie aus
  Anfrageparametern; Datensätze per ID über `src/lib/ownership.ts` prüfen.
- API-Schlüssel ausschließlich serverseitig (Render-Umgebungsvariablen).
  Niemals im Chat, Frontend, Repository oder Log ausgeben. Den Composio-Key nie
  ausgeben.
- Pakete: **Pro 590 €/Monat, Maxi 797 €/Monat**; jährlich mit 15 % Rabatt:
  **Pro 6.018 €, Maxi 8.129,40 €** (netto, Steuer exklusiv). Keine unbegrenzte
  Maxi-Flatrate, keine automatischen Zusatzkäufe versprechen.
- Genesis darf navigieren und Pakete vorauswählen; Käufe brauchen einen
  ausdrücklichen Klick.
- Keine unbelegten Umsatz-, Reichweiten-, Kostenfreiheits- oder
  Sicherheitsgarantien. Öffentlicher Verkauf erst nach erfolgreicher Abnahme
  und meiner ausdrücklichen Freigabe.
- Antworte auf Deutsch, in einfacher Sprache. Melde ehrlich: getestet /
  vorbereitet / fehlt. Commits mit klarer Beschreibung, dann pushen.

## 2. Stack und Architektur (kurz)

Next.js 16 App Router (16.3.8), TypeScript, Tailwind v4, next-intl
(de/en/es/fr in `messages/`), Prisma 6. Lokal und in Tests SQLite; auf dem
Server Postgres — `scripts/use-postgres.mjs` stellt den Provider beim Build um.
`src/proxy.ts`: Auth-Gate, CSRF-Same-Origin, öffentliche Pfade
(`PUBLIC_PREFIXES`, `PUBLIC_EXACT` — `/api/chat` exakt, damit `/api/chatbot`
geschützt bleibt), Besucher auf `/` → Zentrale-Startseite
(`public/zentrale/seiten/start.html`), angemeldet → Arbeitsbereich.
Zeitzone: `APP_TIME_ZONE` (Standard Europe/Berlin), `instrumentation.ts`
setzt `TZ`.

Befehle: `npm run build`, `npm run typecheck`, `npx eslint src tests scripts`,
`npm test` (Unit), `npm run test:worker`, `npm run build && npm run
test:integration` (Produktions-Build, isolierte SQLite-DB, Attrappen für
Stripe/KI/Mail in `tests/fake-services.mjs`). Alles muss vor jedem Push grün
sein (Stand: Unit 16/16, Worker 6/6, Integration 35/35, ESLint 0 Fehler,
3 vorbestehende Warnungen).

## 3. Erledigt und geprüft (nicht erneut bauen)

1. **Basis**: Linie PR #22 übernommen (eigene Konten/Sitzungen, Workspace-
   Trennung, Betreiberbereich `/operator`, Stripe-Monatsabo, Genesis, Widget,
   Impressum). PR #23 (Stytch/Entitlement-Token) **nicht** vermischt, bleibt offen.
2. **Composio** direkt in der App: `src/lib/composio/{toolkits,client,service,origin}.ts`,
   API `src/app/api/composio/{connect,callback,[id]/test,[id]/disconnect}`,
   UI `src/components/social-media/ComposioPanel.tsx`, Modell `ComposioConnection`.
   Nutzer-ID `<COMPOSIO_USER_PREFIX>-ws-<workspaceId>`, Einmal-State nur als
   HMAC-Hash, Erneuern mit `allow_multiple`, Lesetest, Trennen, Fehleranzeige,
   Callback ohne Sitzung → `/login?next=…`. Echter Composio-Aufruf **nicht**
   geprüft (Key auf Staging nicht gesetzt).
3. **Staging-Härtung**: `/api/health`, `SIGNUP_ALLOWED_EMAILS`, `SITE_NOINDEX`,
   `TEST_DATABASE_URL`, `.npmrc include=dev`, `build:server`/`start:server`.
   Postgres 16 lokal: Integrationssuite grün, Backup/Restore-Rundlauf,
   additive Migration auf Kopie mit Kundendaten ohne Verlust.
4. **Verkaufsseite** in der App: `src/app/buy/page.tsx` (+ `buy/zentrale.css`
   unter `.zentrale`), `/social-media-ki` → `/buy`.
5. **Jahresabo** im Checkout: `src/lib/plans.ts` (`BillingInterval`,
   `netAmountFor`, `lookupStripePrice`, `STRIPE_PRICE_ID_*_YEAR`), Checkout-
   Route, Billing-Seite. Preise werden nach Betrag, EUR, `tax_behavior=
   exclusive` und Intervall validiert.
6. **Freigabe-Workflow** serverseitig: `src/lib/contentWorkflow.ts`,
   Regeln in `contentWorkflowRules.ts` (`ALLOWED_FROM`),
   `revokeApprovalOnChange`, `claimPublishLock` (10 Min.), Termine in der
   Vergangenheit abgelehnt.
7. **Versand-Worker** zum Termin: `src/lib/publishWorker.ts`
   (`tick/processJob/recoverStaleJobs/startPublishWorker`), Modell `PublishJob`
   (QUEUED/RUNNING/SUCCEEDED/FAILED/CANCELED/UNKNOWN), `npm run worker` oder
   `PUBLISH_WORKER=inline`. Unterbrochen → UNKNOWN, keine Wiederholung.
   Detailseite zeigt Status. Zeitzonenfehler (Hydration #418, Termin-Versatz)
   behoben.
8. **Zentrale-Seiten** in der App: 19 Inhaltsseiten + Startseite aus
   desktop-tutorial `fcc6ab7` per `scripts/import-zentrale.mjs` nach
   `public/zentrale/` (Links umgeschrieben, Presse/Rechte/Sicherheit entfernt,
   offener `@media`-Block geschlossen, Status-Skript injiziert). Adressen in
   `src/lib/zentralePages.ts`. Umbenannt: `/social-media-betreuung`,
   `/ki-schulung`. Zentrale-Kern vendored in `src/lib/zentrale/`
   (Planer, Rechte, Register, Gate).
9. **Startseite Variante 1, Schritt 1+2**: Kontaktformular (`/api/kontakt` →
   Betreiber-Posteingang, Quelle „Webseite“), Agenten-Daten (`/api/agenten`),
   Demo-Planer (`/api/demo/plan`), **Chat** (`/api/chat`: Gate-Regeln vor KI,
   KI nur mit `WEBSITE_KI=true` + `WEBSITE_KI_TAGESLIMIT`, sonst Liste),
   **Skill-Anfrage** (`/api/skill-agent`, nur mit KI), **Terminbuchung**
   (`/api/termine/…`, `/api/operator/termine/…`, Modell `WebsiteAppointment`,
   Betreiber-Panel `AppointmentsPanel.tsx`). Platform-Enum hat `WEBSITE`.
10. **Newsletter** Double-Opt-in über Resend: `src/lib/email.ts`,
    `src/lib/newsletter/`, `/api/newsletter/{anmelden,bestaetigen,abmelden}`,
    Modell `NewsletterSubscriber`. Formular nur sichtbar, wenn `RESEND_API_KEY`
    + `EMAIL_FROM` gesetzt. Token nur als Hash, 48 h, gleiche Antwort für jede
    Adresse, 1 Mail/10 Min./Adresse, 5 Anmeldungen/h/IP. Ausgaben verschickt
    die App **nicht**.
11. **Betreiber-Beförderung**: `scripts/promote-operator.mjs` läuft in
    `start:server`; macht das Konto aus `OPERATOR_PROMOTE_EMAIL` zum Betreiber,
    nur solange noch keiner existiert; Audit-Eintrag. Alternativ `/setup` mit
    `OPERATOR_SETUP_TOKEN`.
12. Sicherheitslücke behoben: `/api/chat`-Freigabe hätte `/api/chatbot`
    geöffnet → `PUBLIC_EXACT`, Test prüft 401. Next auf 16.3.8 (npm audit);
    Rest (`deepmerge-ts` via Prisma CLI, `braces` via ESLint) ohne Fix.
13. Doku: `docs/STAND-2026-10-10.md` (Abschnitte 1–6),
    `docs/BETRIEB-UND-ZAHLUNGEN.md` (7b Composio, 8a Staging, Worker,
    Jahrespreise), `.env.example` vollständig. Rundgang-Galerie:
    https://claude.ai/artifact/V4kpwncb3K4EGjDB9wa3FV

### Nachtrag 14.10.2026 (erledigt, nicht erneut bauen)
- Hauptseite `/#social-media-ki` und `/buy#app`: Pro/Maxi-Kaufweg (gesperrt bis Freigabe), App-Symbol, „App installieren“; Sprachumschalter auch auf dem Handy.
- 34 Sprachen in der App (maschinell übersetzt, Prüfskript `scripts/schulung/pruefen-sprachen.mjs`); Zentrale-Seiten nur Deutsch.
- 23 Erklärvideos mit Untertiteln in allen Sprachen + Vorlesestimme (`public/schulung/videos`, `TrainingVideo`).
- „App installieren“ (Zentrale + App), Offline-Seite, Service Worker mit Allowlist.
- Hermes vorbereitet, alles aus (`docs/HERMES.md`); öffentlicher Chat fail-closed.
- Seitenleiste zeigt echten Nutzer; Schulungstexte ohne „einmalig“/Render-Anleitung.
- Unklar geblieben: Welche Seite die „zuletzt bearbeitete Hauptwebseite“ des Betreibers ist. Gearbeitet wurde an der Staging-App
  (Repo Operator). Eine Seite mit 3D-/Hologramm-Design und die Dateien `zentrale.html` / „2-Zentrale-Verkaufsseite.html“ liegen in
  keinem Repository (Quellpaket beim Betreiber). Nicht mit der Hauptseite zusammenführen.

## 4. Staging (läuft)

- Dienst **`secret58-staging`** (`srv-db58s37lot8c73e470fg`, Render,
  Frankfurt, Plan free, Auto-Deploy aus, Branch `claude/modest-fermat-ysdjp6`):
  **https://secret58-staging.onrender.com** — `/api/health` meldet Datenbank
  und Medienablage ok. Deploys über das Render-MCP (`trigger_deploy`).
- Datenbank **`secret58-staging-db`** (`dpg-db58s0ad0e5s73ejmrk0-a`, Postgres
  16, free, **läuft am 09.11.2026 ab**, IP-Allowlist leer → von außen nicht
  abfragbar).
- Gesetzte Variablen (Werte nur im Dashboard): `DATABASE_URL`,
  `SIGNUP_ALLOWED_EMAILS=matthiaslippek78@gmail.com`, `SITE_NOINDEX=true`,
  `OPERATOR_PROMOTE_EMAIL=matthiaslippek78@gmail.com`. **Nicht** gesetzt:
  `COMPOSIO_API_KEY`, `STRIPE_*`, `ANTHROPIC_API_KEY`, `WEBSITE_KI`,
  `RESEND_API_KEY`, `EMAIL_FROM`, `PUBLISH_WORKER`.
- Geprüft auf Staging: Start-/Buy-/Login-/Impressum 200; `/operator` und
  Arbeitsbereich ohne Login gesperrt; `/api/chatbot` 401; `x-robots-tag:
  noindex`; Registrierung nur für die freigegebene Adresse.
- Einschränkungen free: Dienst schläft nach 15 Min., Medien gehen bei jedem
  Deploy verloren (kein Disk), Postgres-Ablauf 09.11.
- **Sicherheitshinweis:** Das Staging-DB-Passwort wurde einmal im Chat
  eingefügt. Vor echten Kundendaten in Render „Rotate password“ ausführen und
  `DATABASE_URL` neu setzen.

## 5. Offen — in dieser Reihenfolge

1. **Betreiberkonto auf Staging**: Matthias registriert sich unter
   https://secret58-staging.onrender.com/signup mit matthiaslippek78@gmail.com.
   Danach Deploy auslösen → Log muss „promote-operator: Konto zum Betreiber
   gemacht.“ zeigen → `OPERATOR_PROMOTE_EMAIL` wieder entfernen. (Letzter Lauf:
   „kein Konto mit dieser Adresse“ — Registrierung war noch nicht auf Staging.)
2. **Abnahme auf Staging** (Browser, Desktop 1280 px + Handy 390 px, keine
   echten Posts/Zahlungen): Anmeldung, Arbeitsbereich, Pakete/Checkout-Seite
   (ohne Stripe-Keys als „vorbereitet“), Composio-Panel (Zustände), Content-
   Workflow, Planung + Worker-Status, Termine (Betreiber ↔ Besucher),
   Kontaktformular → Posteingang, Chat/Skill/Newsletter ausgeblendet bzw.
   Listenantwort. Befunde fixen, Doku `STAND` ergänzen.
3. **Stripe-Preise anlegen** (nur mit Stripe-Connector in der Sitzung; sonst
   Matthias bitten, ihn unter claude.ai/customize/connectors zu verbinden):
   vier Preise EUR, `tax_behavior=exclusive`: Pro 590 €/Monat, Maxi
   797 €/Monat, Pro 6.018 €/Jahr, Maxi 8.129,40 €/Jahr. IDs als
   `STRIPE_PRICE_ID_PRO`, `_MAXI`, `_PRO_YEAR`, `_MAXI_YEAR` in Render setzen
   (Testmodus zuerst). Webhook-Secret ebenfalls nur in Render.
4. **Schlüssel von Matthias** (nur Render-Dashboard): `COMPOSIO_API_KEY` →
   echten Lesetest; `ANTHROPIC_API_KEY` + `WEBSITE_KI=true` → Chat/Skill;
   `RESEND_API_KEY` + `EMAIL_FROM` (bestätigte Absenderdomain) → Newsletter-
   Formular sichtbar, echte Bestätigungsmail an eigene Adresse testen.
5. **Worker auf Staging**: `PUBLISH_WORKER=inline` setzen (ein Dienst), nach
   Freigabe echten Testpost auf ein eigenes Testkonto.
6. **Bezahlte Pläne**: sobald Zahlungsmittel hinterlegt — Web Service Starter,
   Postgres bezahlt (vor 09.11.), Disk für `public/media`, Backup-Routine
   (Verfahren in `docs/BETRIEB-UND-ZAHLUNGEN.md`).
7. **Zusammenführen**: PR #22 und PR #24 (dieser Branch) erst nach
   erfolgreicher Staging-Abnahme und meiner Freigabe in `main`; PR #23 offen
   lassen bzw. schließen nach Entscheidung.
8. **Domain/Go-live** www.secret58.com erst nach Abnahme + Freigabe:
   Custom Domain in Render, `PUBLIC_APP_URL`, Composio-Redirect-URL, Stripe
   Live-Modus, `SITE_NOINDEX` entfernen, `SIGNUP_ALLOWED_EMAILS` leeren.

## 6. Abschlussbericht je Schritt

Immer melden: **getestet** (mit Nachweis) / **vorbereitet** / **fehlt**,
meine Aufgaben, Vorschau-URL, Branch, Commit. Keine Garantien, keine
Beschönigung.

## Hauptseite www.secret58.com (unantastbar)

Die Hauptseite von SECRET 58 ist die **„Secret 58 Zentrale“** (claude.ai-Artifact, Eigentümer: Matthias Lippek):
<https://claude.ai/artifact/Kha1HUHqEmbZLRgNErWC6Q> — Unterseiten per `#/<seite>`, z. B. `#/social-media-ki`, `#/ki-agenten`, `#/preise`.

- Sie ist die Seite, von der alles ausgeht. Sagt Matthias „secret58.com“, „www.secret58.com“ oder „meine Hauptseite“, wird **immer diese Seite** gezeigt (Link angeben).
- **Oberfläche und Inhalt dieser Seite werden nie verändert** (kein Republish, keine Änderung an Gestaltung, Texten oder Technik), außer Matthias ordnet es ausdrücklich an. Änderungen nur an Kopien.
- Die Seite ist eine Demo mit Beispieldaten (rein im Browser, ohne Server). Was nicht angebunden ist, ist als Demo / vorbereitet / noch nicht eingerichtet zu kennzeichnen.
- Umstellung der echten Domain secret58.com (liegt bei IONOS) erst nach ausdrücklicher Freigabe eines geprüften Ergebnisses.
- Bekannt (Stand 14.10.2026): Die Buttons „Zum Dashboard“ und „Kaufen“ auf `#/social-media-ki` zeigen auf `http://localhost:3000` (nur auf dem Entwicklungsrechner nutzbar); „Live-Fassung“ zeigt auf `secret58-command-center.onrender.com` (leitet auf den Login). Preis dort: 797 €/Monat „Vollzugang“, nicht Pro/Maxi.

### Nachtrag 14.10.2026 abends (Hauptseite, Verlauf, Anbindung)

Kopiere diesen Block als Start-Prompt in eine neue Sitzung:

> Du arbeitest an SECRET 58 (Repo Operator, Branch `claude/modest-fermat-ysdjp6`, Entwurfs-PR #24; Staging https://secret58-staging.onrender.com, Render srv-db58s37lot8c73e470fg, Workspace tea-da7it3ifngtc73flhg20). Lies zuerst `CLAUDE.md`, `docs/STAND-2026-10-10.md` (Abschnitt 8) und `docs/UEBERGABE-PROMPT.md`. Verbindliche Regeln wie bisher: keine echten Zahlungen, Posts oder öffentliche Veröffentlichung ohne ausdrückliche Freigabe; fehlende Anbindungen als Demo / vorbereitet / noch nicht eingerichtet kennzeichnen; Schlüssel nur serverseitig; Pro 590 € / Maxi 797 € netto; Domain-Änderungen erst nach ausdrücklicher Freigabe.
>
> **Hauptseite = „Secret 58 Zentrale“** (claude.ai-Artifact `https://claude.ai/artifact/Kha1HUHqEmbZLRgNErWC6Q`, Unterseiten `#/<seite>`). Sagt Matthias „secret58.com / www.secret58.com / meine Hauptseite“, zeige immer diese Seite (Link + Artifact `open`). Sie bleibt in Gestaltung und Inhalt unverändert; geändert wurde auf seine Anordnung nur der Bereich `#/social-media-ki` (Version 69): Buttons → Staging `/buy`, `/login`; Pro/Maxi netto; Aktionszeiträume mit Codes BLACKFRIDAY26 (27.–30.11.), WEIHNACHTEN26 (16.–26.12.), VALENTIN27 (10.–15.02.2027); Autopilot S/M/L 149/399/999 € als „Demnächst“ (vorläufig); Block „Stand der Anbindungen“. Sicherungskopie des Originals: Arbeitsordner `ORIGINAL-index-1790657347-6fba.html` (Version vor der Änderung). Die Seite ist eine reine Browser-Demo ohne Server; Kontaktformular, Bestellbereich, Anmeldung, Finanzen, Agenten sind Beispiele.
>
> **Kopie auf Staging:** `public/hauptseite/` → `/hauptseite/index.html` (nach jeder Änderung am Original neu übernehmen, bauen, testen, ausliefern). **Verlauf:** `public/verlauf/` (15 historische Kopien 11.09.–08.10., Übersicht `/verlauf`). Beides ohne Anmeldung erreichbar, noindex auf Staging.
>
> **Gefundene frühere Fassungen:** Render-Dienste `secret58-web`, `secret58-vorschau` (07.10.), `secret58-alleseiten` (16.09., mit Leistungsseiten, Konnektoren, Skills, Vertrag), `secret58-command-center(-vorschau)`, `secret58-promaxi-preview`; Replit „NEURA Studio“; Branch `stand-2026-09-16` (am 17.09. auf Wunsch zurückgebaut, nichts verloren). Nicht gefunden: 3D-/Hologramm-Seiten, `zentrale.html`. Domain secret58.com liegt bei IONOS (kein Zugriff).
>
> **Übersichten (privat, claude.ai):** Seitenübersicht mit Verlauf `…/HWqAutnzgwi8ZbR96PcVFZ`, Dashboard-Links `…/JRcLB6j7EGveUv7mx8Wo4C`, Seitengalerie (96 Screenshots) `…/2PrCL2puFjCcF9ZoVtZdo9`, Mängelliste `…/YUNLEC9GRZthPeGXBDhYEE` (Version 2, 25 offene Punkte).
>
> **Offen / nächste Schritte:** (1) Kontaktformular der Kopie an `/api/kontakt` der App anschließen und den Bestellbereich als Demo kennzeichnen (Vorschlag, noch nicht freigegeben). (2) Aktionscodes im Betreiberbereich anlegen (vor 27.11.). (3) Stripe-Testkonto (Schlüssel, Webhook, 4 Preis-IDs) → Testkauf. (4) KI-Chat liefert `agent_nicht_erreichbar` trotz `ki:true` → Render-Log `[webchat]` prüfen (Log-Abruf lief in Zeitüberschreitung). (5) Meta-/TikTok-/YouTube-Konten, Resend, Handelsregister/Gewerbe/Datenschutz (Matthias). (6) Steuerangabe klären (Kleinunternehmer vs. netto zzgl. Steuer); Autopilot-Preise netto? (7) Bezahlte Render-Pläne vor 09.11.2026; Composio-Schlüssel und DB-Passwort rotieren. (8) Domain-Umstellung nur nach ausdrücklicher Freigabe, gemeinsam bei IONOS.
>
> Prüfstand: Lint 0 Fehler, Unit 21/21, Integration 46/46. Arbeitsweise: bauen → lokal im Browser prüfen → Tests → Commit/Push → `trigger_deploy` → Live-Seite prüfen → kurz berichten (getestet / vorbereitet / fehlt). Kein `pkill -f` mit Mustern, die den eigenen Befehl treffen.
