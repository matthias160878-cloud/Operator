# Betrieb, Pakete und Zahlungen — SECRET 58 Social Command Center

Stand: 7. Oktober 2026, Branch `claude/dreamy-hypatia-pagne7`.
Dieses Dokument beschreibt, was technisch umgesetzt ist, wie es eingerichtet wird
und was ausdrücklich **nicht** umgesetzt oder noch offen ist. Es ist keine
Rechtsberatung und ersetzt weder AGB noch Datenschutzerklärung.

## 1. Mehrkundenbetrieb und Datentrennung

| Baustein | Umsetzung |
|---|---|
| Konten | E-Mail + Passwort (scrypt, mind. 12 Zeichen), `/signup`, `/login`. Jede Registrierung erhält einen **eigenen Workspace**. |
| Sitzungen | Zufallstoken im `httpOnly`-Cookie (`SameSite=Lax`, `Secure` in Produktion), in der Datenbank nur der SHA-256-Hash, 30 Tage gültig. |
| Workspace-Bestimmung | `getCurrentWorkspaceId()` liest ausschließlich die Sitzung. Keine Route übernimmt eine Workspace-ID aus dem Browser. |
| Datensätze per ID | `src/lib/ownership.ts` prüft jede ID gegen den Workspace der Sitzung; fremde IDs ergeben 404. |
| Proxy (`src/proxy.ts`) | Ohne Sitzung: Seiten → `/login`, API → 401. Ändernde API-Aufrufe nur vom eigenen Ursprung (CSRF-Schutz). `/operator` nur für Betreiber. |
| Dateien | Private Ablage `MEDIA_STORAGE_DIR/<workspaceId>/…` (nicht mehr unter `public/`), Abruf nur über `/api/media/...` mit Sitzung. |
| KI-Kontext | Agenten erhalten nur Daten des eigenen Workspaces. Der Webseiten-Assistent erhält nur öffentliche Markenangaben. |
| Hintergrundjobs | Es gibt keine zeitgesteuerten Hintergrundjobs; alle Agenten laufen in Anfragen des angemeldeten Kunden. |
| Export / Löschung | `Einstellungen → Meine Daten`: JSON-Export, endgültige Löschung des Arbeitsbereichs inkl. Dateien (Passwort + „LÖSCHEN“). |
| Betreiber | Konto nur über `/setup` mit `OPERATOR_SETUP_TOKEN` (mind. 32 Zeichen), nur solange noch kein Betreiber existiert. Alternativ (Datenbank von außen nicht erreichbar, z. B. Render): bereits registriertes Konto über `OPERATOR_PROMOTE_EMAIL` beim Serverstart befördern — ebenfalls nur, solange es keinen Betreiber gibt. Kein einfaches Admin-Passwort. |
| Support-Zugriff | **Nicht umgesetzt.** Der Betreiber hat keine Ansicht auf Kundeninhalte. Ein autorisierter, befristeter und protokollierter Supportzugang wäre eine eigene Erweiterung. |

Bestehende Kundenkonten aus dem früheren Einzelzugang (`OWNER_ACCESS_KEY`,
`/unlock`, Lizenz-Cookie) werden **nicht** übernommen. Die Tabelle `licenses`
bleibt nur zur Nachvollziehbarkeit bestehen.

## 2. Pakete und Kontingente

Die zentrale Definition steht in `src/lib/plans.ts`. Verkaufsseite (`/buy`),
Paketseite (`/billing`), Checkout, Berechtigungen und Kontingente greifen alle
darauf zu.

* **Abgerechnet wird über den Stripe-Preis** (`STRIPE_PRICE_ID_PRO` / `_MAXI` monatlich,
  `STRIPE_PRICE_ID_PRO_YEAR` / `_MAXI_YEAR` jährlich). Kontingente gelten auch im Jahresabo
  je Kalendermonat; nicht genutzte Mengen verfallen am Monatsende.
  Die Anwendung prüft vor jedem Checkout, dass er zu den bestätigten Konditionen passt.
  (Die Webhook-Verarbeitung kann technisch auch Einmalzahlungen, sie werden aber nicht verkauft.)
* **Preise (bestätigt am 7. Oktober 2026):** Pro **590 € netto**, Maxi **797 € netto**,
  jeweils bereits nach 15 % Rabatt. Die Umsatzsteuer kommt je nach Land des
  Kunden hinzu: Checkout mit `automatic_tax`, Pflicht-Rechnungsadresse und
  USt-ID-Feld (Reverse Charge für Unternehmen berechnet Stripe Tax).
  Der Stripe-Preis muss **genau** diesen Nettobetrag in EUR mit
  `tax_behavior = exclusive` haben, sonst verweigert der Checkout.
  Ein durchgestrichener „Statt“-Preis wird nicht angezeigt: Nach § 11 PAngV
  zählt als Vergleich nur der niedrigste tatsächlich verlangte Preis der
  letzten 30 Tage, und den gibt es noch nicht.
* **Abrechnung (bestätigt):** monatliches Abo. Der Checkout verweigert Stripe-Preise,
  die nicht monatlich wiederkehren (Intervall 1 Monat).
* **Rabatte** nur über in Stripe angelegte Aktionscodes (`allow_promotion_codes`).
  Ein fester 15-%-Rabatt ist nicht eingebaut.
* **Kontingente je Monat (bestätigt):** Pro: 1 Marke, 30 Ideen, 10 Videos,
  10 Voiceovers, 300 KI-Texte, 500 Widget-Antworten, 1 Webseite. Maxi: 3 Marken,
  90, 30, 30, 900, 1500, 3 Webseiten.
* **Verkaufsstart:** Ohne `PACKAGE_TERMS_CONFIRMED=true` verweigert der Checkout
  jeden Kauf — setzen, sobald Stripe (inkl. Steuern), AGB und Pflichtangaben stehen.
* **Durchsetzung:** `reserveQuota()` erhöht den Zähler mit **einem** bedingten
  UPDATE (`used <= limit - 1`). Parallele Anfragen können das Limit deshalb
  nicht gemeinsam überschreiten (getestet: 12 parallele Anfragen bei 3 freien
  Einheiten → genau 3 erfolgreich). Scheitert der Anbieter-Aufruf, wird die
  Einheit zurückgegeben. Im gekennzeichneten Template-Modus (kein KI-Anbieter
  eingerichtet) wird kein Kontingent verbraucht.
* **Keine Überschreitungskosten.** Bei ausgeschöpftem Kontingent: HTTP 429 mit
  Hinweis auf einen Wechsel zu Maxi, den der Kunde selbst bestätigen muss.
  Zeitraum: UTC-Kalendermonat; Webseiten zählen gleichzeitig verbundene.

## 3. Paketzahlungen (Stripe, Betreiberkonto)

Ablauf: Kunde wählt Pro/Maxi auf `/billing` → setzt das Bestätigungshäkchen →
`POST /api/stripe/checkout` (nur mit Sitzung und `confirmed: true`) → Stripe
Checkout → Rückkehr auf `/billing?checkout=…`. Die Seite zeigt den
tatsächlichen Status; die Rückkehr-URL selbst schaltet **nichts** frei.

Freischaltung ausschließlich über den Webhook `/api/stripe/webhook`:

| Event | Wirkung |
|---|---|
| `checkout.session.completed` / `…async_payment_succeeded` | Nur wenn eine serverseitig angelegte `PlanCheckout`-Zeile existiert **und** Zwischensumme, Währung und Modus passen. `paid` → Paket ACTIVE (Paket aus der Bestellung, nicht aus Metadaten); sonst PENDING. Einmalzahlung wird als Umsatz verbucht. |
| `checkout.session.async_payment_failed` | PENDING → PAYMENT_FAILED |
| `checkout.session.expired` | Bestellung EXPIRED |
| `invoice.paid` | Abo-Zahlung verbuchen, Laufzeitende aktualisieren, ACTIVE |
| `invoice.payment_failed` | ACTIVE → PAST_DUE (Leistungen pausiert) |
| `customer.subscription.created/updated/deleted` | Status/Paket (z. B. Wechsel über das Kundenportal), Kündigung zum Laufzeitende |
| `charge.refunded` | Erstattungsstand verbuchen; vollständig erstattete Einmalzahlung → REFUNDED. Erstattungen von Abo-Zahlungen deaktivieren nichts automatisch. |

Wiederholungsschutz: Die Event-ID wird in derselben Datenbanktransaktion
gespeichert wie die Änderung. Ein Duplikat ändert nichts, und ein Fehler rollt
alles zurück, sodass Stripe erneut zustellen kann. Abo- und Rechnungsverwaltung
läuft über das Stripe-Kundenportal (`/api/stripe/portal`).

**Betreiber-Dashboard `/operator`:** Es zeigt Paketumsatz brutto, Erstattungen
(aus verifizierten Webhooks), das Stripe-Guthaben *ausstehend* und *verfügbar*
(`balance.retrieve`), Auszahlungen (`payouts.list`) sowie die Anzahl der Pakete
nach Status, aber keine Kundeninhalte. Manuelle Auszahlungen werden nicht
angeboten; die Auszahlung steuert Stripe nach dem dort eingestellten Plan.

## 4. Einnahmen der Kunden (getrennt von den Paketumsätzen)

**Weg B — Verkaufen über SECRET 58 (Stripe Connect):**

* Je Workspace ein verbundenes Konto (Accounts API v1 mit Controller-Eigenschaften):
  `fees.payer=account`, `losses.payments=stripe`, `requirement_collection=stripe`,
  `stripe_dashboard.type=full`. Der Kunde ist Händler: Er zahlt die Stripe-Gebühren,
  bearbeitet Erstattungen und Streitfälle und erhält Auszahlungen direkt.
* Onboarding über von Stripe gehostete Account Links (`/sales`).
* Verkäufe laufen als Direct Charge (`Stripe-Account`-Header), Betrag aus der
  Datenbank. Es gibt **keine Plattformgebühr**, weil keine vereinbart ist.
* Connect-Webhook `/api/stripe/connect-webhook` mit eigenem Signaturschlüssel.
  Der Workspace wird über `event.account` bestimmt, nicht über Metadaten.
  Verarbeitet werden `account.updated`, Checkout-Events und `charge.refunded`.
* Grundlage: docs.stripe.com/connect/saas und /connect/end-to-end-saas-platform
  (Stand Oktober 2026). Stripe empfiehlt für neue Plattformen inzwischen
  **Accounts v2**. Ein Umstieg ist offen, weil nicht sicher bestätigt ist, dass
  alle v2-Felder unter der Stripe-API-Version des installierten SDK (Dahlia) verfügbar sind.

**Weg A — bestehenden Shop einbinden:** Umgesetzt ist der CSV-Import
(`external_id, date, amount, currency, product`). `external_id` ist je Workspace
eindeutig, sodass derselbe Verkauf aus Import und Direktverkauf nur einmal zählt.
Direkte Live-Anbindungen an Shopsysteme (z. B. per OAuth) sind **nicht umgesetzt**.

Summen werden je Währung getrennt angezeigt, Testdaten (`livemode=false`) sind gekennzeichnet.

## 5. KI-Anbindung

* Anbieter: `ANTHROPIC_API_KEY` (vorrangig) oder `OPENAI_API_KEY`, nur auf dem Server.
  Zeitlimit `AI_TIMEOUT_MS` (Standard 60 s), Antwortlänge `AI_MAX_TOKENS_CAP` (Standard 2048).
* Jeder Agent-Lauf prüft das aktive Paket und reserviert Kontingent (`src/lib/agents/runner.ts`).
* Ohne Anbieter bleibt der Template-Modus gekennzeichnet. Der Webseiten-Assistent
  antwortet dann gar nicht, statt Vorlagentext auszugeben.
* Kunden werden nicht mehr nach API-Schlüsseln gefragt (Integrationsseite und
  Einrichtungsassistent nur für Betreiber). Social-Konten werden weiterhin per OAuth verbunden.

## 6. Genesis-Sprachsteuerung

* Kopfleiste auf allen Seiten (Zentrale, Social Media usw.): Texteingabe,
  Beispiel-Knöpfe und Mikrofon.
* Befehle (`src/lib/genesis/commands.ts`): „Öffne Social Media AI / Schulung /
  Marken-DNA / Wachstum / Posteingang / Zentrale“, „Wähle Pro“, „Wähle Maxi“.
  „Wähle …“ markiert das Paket nur vor; Kauf, Zahlung, Kündigung und Löschen
  werden abgelehnt.
* Spracheingabe über die Web Speech API des Browsers. Sie braucht HTTPS und eine
  Mikrofonfreigabe. Je nach Browser wird die Aufnahme an dessen Anbieter
  übertragen; darauf weist die Anwendung hin. **Firefox unterstützt das nicht**;
  dort sind Text und Klick aktiv. Getestet wurden nur Chromium-Desktop und
  Chromium mit Handy- und Tablet-Viewport, nicht echte iOS/Android-Geräte.
* Die Stimme ist kein Identitätsnachweis. Eine Beschränkung auf die Stimme des
  Kunden ist **nicht umgesetzt** (offen).

## 7. „Meine Webseite verbinden“

`/website`: Adresse eintragen → Domain bestätigen über `/.well-known/secret58-verify.txt`
→ Einbindungscode (`<script src=".../widget.js" data-secret58-key="s58w_…">`)
→ Verbindung testen → jederzeit widerrufen.

* Die öffentliche Kennung ist kein Geheimnis. Sie wirkt nur für die bestätigte
  Domain (Origin-Prüfung und CORS) und ist widerrufbar.
* Ratenbegrenzung je Besucher und je Kennung; jede Antwort zählt gegen das Kontingent.
* Die Domainprüfung ruft nur öffentliche Adressen ab: keine internen IPs, keine
  Weiterleitungen, Zeit- und Größenlimit.
* Nicht-Browser-Clients können einen Origin-Header fälschen. Dagegen schützen
  nur Ratenbegrenzung (20 je Besucher/10 min, 60 je Kennung/Stunde, 200 je
  Kennung/Tag) und das Kontingent. Wer die Kennung kopiert, kann das Tageslimit
  des Kunden dennoch ausschöpfen — ein Besucher-Token wäre der nächste Schritt (offen).
* Restrisiko Domainprüfung: DNS-Auflösung und Abruf erfolgen getrennt
  (theoretisch DNS-Rebinding); zurück kommt nur ja/nein. Akzeptiert, offen.
* Ein **Telefonassistent ist nicht umgesetzt** (dafür wären Telefonie-Anbindung,
  Rufnummer, Einwilligungen und Datenschutzabläufe nötig).

## 7b. Composio: „Konto verbinden“ (nur lesender Zugriffstest)

Composio ist eine **zusätzliche** Anmeldemöglichkeit neben den nativen
OAuth-Anbindungen (`src/lib/oauth/providers.ts`). Über Composio wird in
SECRET 58 **nichts veröffentlicht**; es gibt nur Verbinden, Lesetest,
Erneuern und Trennen. Eine Composio-Verbindung in Claude/Claude Code ist
davon unabhängig und beweist keine Integration in diese Anwendung.

| Funktion | Native OAuth | Composio |
|---|---|---|
| Plattformen | YouTube, TikTok, Instagram, Facebook, LinkedIn | Instagram, Facebook-Seite, LinkedIn, YouTube |
| Zugangstoken | verschlüsselt in eigener DB (`TOKEN_ENCRYPTION_KEY`) | nur bei Composio; DB speichert Konto-ID + Status |
| Veröffentlichen | vorbereitet, nur nach Freigabe | nicht vorgesehen |
| Lesetest | — | ja (`/api/composio/[id]/test`) |

Ablauf (`src/lib/composio/`, `src/app/api/composio/`):

1. „Konto verbinden“ → `POST /api/composio/connect` → Composio
   `POST /api/v3/connected_accounts/link` mit `user_id = <COMPOSIO_USER_PREFIX>-ws-<workspaceId>`
   und einem einmaligen Sicherheitscode im Rückkehr-Link (nur HMAC-Hash in der DB, 15 Min. gültig).
2. Rückkehr `GET /api/composio/callback` verlangt die Sitzung desselben Kunden
   (ohne Sitzung: erst Anmeldung, dann derselbe Link), prüft Sicherheitscode,
   Konto-ID und fragt das Konto bei Composio nach: `user_id` und Toolkit müssen
   passen, Status muss `ACTIVE` sein. Sonst wird nichts zugeordnet.
3. Erneuern behält die alte Verbindung, bis die neue aktiv ist, und löscht sie dann bei Composio.
4. Trennen und Kontolöschung löschen die Verbindung auch bei Composio.
5. Grenzen: 10 Verbindungsversuche/Stunde, 30 Lesetests/Tag je Arbeitsbereich. Audit-Log `composio.*`.

Einrichtung (Betreiber, nur Server-Umgebung, nie im Repo/Chat):

- `COMPOSIO_API_KEY` — Projekt-Schlüssel aus platform.composio.dev.
- `COMPOSIO_AUTH_CONFIG_INSTAGRAM|FACEBOOK|LINKEDIN|YOUTUBE` — Auth-Config-IDs (`ac_…`);
  ohne Eintrag erscheint die Plattform als „Noch nicht eingerichtet“.
- `COMPOSIO_USER_PREFIX` — z. B. `s58test` (Staging) bzw. `s58live`, damit sich Umgebungen nicht mischen.
- `PUBLIC_APP_URL` — **Pflicht hinter Render/Proxy**, sonst kann die Rückkehr-Adresse falsch sein.
- Optional `COMPOSIO_READ_TOOL_<PLATTFORM>`: Lese-Werkzeug überschreiben. Dokumentiert bestätigt sind
  `INSTAGRAM_GET_USER_INFO` und `YOUTUBE_GET_CHANNEL_STATISTICS`; `LINKEDIN_GET_MY_INFO` und
  `FACEBOOK_LIST_MANAGED_PAGES` vor dem ersten echten Test im Composio-Dashboard prüfen.

Ob der Schlüssel wirkt, zeigt „Integrationen“ (lesender Aufruf `GET /api/v3/auth_configs`).
Geprüft ist der Ablauf nur gegen eine lokale Attrappe (`tests/fake-services.mjs`) — **kein echter
Composio-Aufruf, kein echtes Plattformkonto**.

## 7a. Missbrauchsschutz

* Ratenbegrenzung über die Datenbank. Die Client-Adresse ist der Eintrag, den der
  eigene Reverse Proxy anhängt (`TRUSTED_PROXY_HOPS`, Standard 1). Der erste,
  vom Client fälschbare Eintrag in `X-Forwarded-For` wird ignoriert.
* Anmeldung: 30 Versuche je Adresse und 10 je E-Mail in 15 Minuten. Die
  E-Mail-Grenze kann ein Angreifer nutzen, um ein Konto 15 Minuten zu sperren (offen: Zurücksetzen per E-Mail).
* Antwortzeiten verraten nicht, ob eine E-Mail registriert ist.
* Stimmen: nur Stimmen des eigenen Arbeitsbereichs; der Import übernimmt nur
  Standardstimmen von ElevenLabs, keine geklonten Stimmen des Betreiberkontos.
* Veröffentlichen von Videos: Instagram/TikTok erhalten einen signierten Link,
  der eine Stunde gilt (`MEDIA_URL_SECRET`).

## 8. Bereitstellung auf einem Windows-VPS (vorbereitet, nicht ausgeführt)

**Datenbank:** SQLite (Standard) funktioniert für **einen** Prozess und wenige
gleichzeitige Schreibzugriffe; Kontingente und Wiederholungsschutz sind darauf
getestet. Für den Mehrkundenbetrieb empfehle ich **PostgreSQL**: gleichzeitige
Schreibzugriffe, Online-Sicherung, Point-in-Time-Recovery. Umstieg:

1. In `prisma/schema.prisma` `provider = "postgresql"` setzen.
2. `DATABASE_URL=postgresql://…` eintragen.
3. Einmalig `npx prisma migrate dev --name init` (lokal) ausführen; danach auf
   dem Server `npx prisma migrate deploy`.

Das ist noch nicht gegen Postgres getestet.

**Achtung, aktueller Render-Dienst:** `secret58-command-center` baut automatisch
von `main` und nutzt SQLite auf flüchtigem Speicher. **Nach jedem Deployment
wären alle Konten und Pakete weg.** Vor dem Merge nach `main` deshalb entweder
die Datenbank verlegen oder das Auto-Deployment stoppen.

Empfohlener Aufbau (Windows Server 2022/2025):

1. **Node.js 22 LTS** installieren, Repository nach `C:\secret58\app` klonen.
2. **Konfiguration geschützt ablegen:** `C:\secret58\app\.env`, NTFS-Rechte nur
   für das Dienstkonto und Administratoren
   (`icacls .env /inheritance:r /grant:r "NT SERVICE\secret58:R" Administrators:F`).
   Niemals ins Repository einchecken.
3. **Bauen:** `npm ci`, `npx prisma migrate deploy` (bzw. bei SQLite
   `npx prisma db push`), dann `npm run build`.
4. **Prozessbetrieb als Windows-Dienst** mit automatischem Neustart, z. B. NSSM:
   `nssm install secret58 "C:\Program Files\nodejs\node.exe" "C:\secret58\app\node_modules\next\dist\bin\next" start -p 3000 -H 127.0.0.1`,
   `AppDirectory C:\secret58\app`, Ausgaben in `C:\secret58\logs`. Nur auf
   127.0.0.1 lauschen.
5. **HTTPS** über einen Reverse Proxy mit automatischen Zertifikaten, z. B.
   Caddy als Dienst: `app.example.com { reverse_proxy 127.0.0.1:3000 }`. In der
   Windows-Firewall nur 80/443 öffnen (443 für HTTPS, 80 für die Zertifikatsprüfung).
6. **Stripe-Webhooks** auf `https://<domain>/api/stripe/webhook` und
   `/api/stripe/connect-webhook` einrichten (siehe Abschnitt 9).
7. **Sicherungen** per Aufgabenplanung täglich:
   - PostgreSQL: `pg_dump -Fc` (bei SQLite: `sqlite3 app.db ".backup backup.db"` im laufenden Betrieb)
   - zusätzlich `MEDIA_STORAGE_DIR` sichern
   - verschlüsselt auf einen zweiten Ort kopieren
   - Wiederherstellung regelmäßig testen
8. **Updates:** `git pull`, `npm ci`, Migrationen, Build, Dienst neu starten.

## 8a. Private Staging-Umgebung auf Render (PostgreSQL + persistente Medien)

Lokal und in den Tests bleibt SQLite. Für den Serverbetrieb stellt
`scripts/use-postgres.mjs` das Schema beim Build auf PostgreSQL um.

| Einstellung | Wert |
|---|---|
| Build Command | `npm ci && npm run build:server` |
| Start Command | `npm run start:server` (`prisma db push` ohne `--accept-data-loss`, dann `next start`) |
| Health Check Path | `/api/health` (prüft Datenbank und Medienablage, gibt keine Inhalte preis) |
| Persistent Disk | Mount `/var/data`, `MEDIA_STORAGE_DIR=/var/data/media` |
| Datenbank | Render PostgreSQL 16, `DATABASE_URL` = **interne** Verbindungsadresse |

Umgebungsvariablen nur im Render-Dashboard setzen, Geheimnisse dort mit „Generate“
erzeugen, nie im Chat oder Repo: `DATABASE_URL`, `TOKEN_ENCRYPTION_KEY`,
`MEDIA_URL_SECRET`, `OPERATOR_SETUP_TOKEN`. Ohne Geheimnis gesetzt:
`NODE_ENV=production`, `PUBLIC_APP_URL`, `SITE_NOINDEX=true` (kein Suchmaschinen-Index),
`SIGNUP_ALLOWED_EMAILS` (Komma-Liste; nur diese Adressen dürfen sich registrieren),
`COMPOSIO_USER_PREFIX=s58test`. `PACKAGE_TERMS_CONFIRMED` bleibt im Staging ungesetzt
(kein Verkauf).

Versand zum Termin: entweder `PUBLISH_WORKER=inline` (im Webdienst; schläft im
Gratistarif mit) oder ein eigener Render-Background-Worker mit Build
`npm ci && npm run build:server`, Start `npm run worker` und denselben Variablen
(`DATABASE_URL`, `TOKEN_ENCRYPTION_KEY`, `MEDIA_URL_SECRET`, `PUBLIC_APP_URL`).
Nie beide gleichzeitig. `.npmrc` (`include=dev`) sorgt dafür, dass Prisma/tsx auch
mit `NODE_ENV=production` installiert werden.

Sicherung und Wiederherstellung:

- Render-PostgreSQL (kostenpflichtiger Plan) bietet Point-in-Time-Recovery im Dashboard;
  zusätzlich vor jeder Schemaänderung `pg_dump -Fc` über die externe Adresse ziehen.
- Persistente Disks werden von Render täglich als Snapshot gesichert (Wiederherstellung im Dashboard).
- Geprüft am 10.10.2026 lokal mit PostgreSQL 16: `pg_dump -Fc` → Datenbank gelöscht →
  `pg_restore --no-owner` → Anmeldung und Daten wieder vorhanden, `/api/health` ok.
  Eine Wiederherstellung **auf Render** ist damit noch nicht geprüft.
- Integrationssuite gegen PostgreSQL: leere Datenbank anlegen, `DATABASE_URL=… npm run build:server`,
  dann `TEST_DATABASE_URL=… npm run test:integration` (am 10.10.2026: 25/25).

## 9. Stripe-Einrichtung (Betreiber, zuerst im Testmodus)

0. **Stripe Tax aktivieren** (Einstellungen → Steuern): Ursprungsadresse,
   Steuerregistrierungen (z. B. Deutschland; OSS für EU-Privatkunden), Produktsteuercode
   für Software/SaaS. Stripe Tax ist bei Stripe kostenpflichtig.
1. Im Testmodus zwei Produkte *Pro* und *Maxi* mit je **zwei wiederkehrenden Preisen**
   anlegen, alle in EUR mit **Steuerverhalten „exklusive Steuer“**:

   | Variable | Preis | Intervall |
   |---|---|---|
   | `STRIPE_PRICE_ID_PRO` | 590,00 € | monatlich |
   | `STRIPE_PRICE_ID_MAXI` | 797,00 € | monatlich |
   | `STRIPE_PRICE_ID_PRO_YEAR` | 6.018,00 € | jährlich |
   | `STRIPE_PRICE_ID_MAXI_YEAR` | 8.129,40 € | jährlich |

   Jahrespreis = 12 Monatsbeträge minus 15 %. Der Checkout verweigert jeden Preis, dessen
   Betrag, Währung, Steuerart oder Intervall nicht genau passt. Fehlt ein Jahrespreis, ist
   nur das Jahresabo dieses Pakets gesperrt („noch nicht eingerichtet“).
2. Webhook-Endpunkt (dein Konto) auf `/api/stripe/webhook` mit diesen Events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - `charge.refunded`

   Dann `STRIPE_WEBHOOK_SECRET` setzen.
3. Connect aktivieren (Plattformprofil ausfüllen), dann einen zweiten Endpunkt
   „Connected accounts“ auf `/api/stripe/connect-webhook` mit diesen Events:
   - `account.updated`
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `charge.refunded`

   Dann `STRIPE_CONNECT_WEBHOOK_SECRET` setzen.
4. Kundenportal unter „Einstellungen → Billing → Kundenportal“ konfigurieren
   (Kündigung, Zahlungsmethode, ggf. Wechsel Pro ↔ Maxi).
5. Mit Testkarten einen vollständigen Kauf, eine Erstattung und ein Connect-Onboarding durchspielen.
6. Erst danach Live-Schlüssel eintragen und `PACKAGE_TERMS_CONFIRMED=true` setzen.

## 9a. Impressum, AGB, Datenschutz

* `/impressum` ist öffentlich und von jeder Seite (Verkauf, Anmeldung, Arbeitsbereich,
  Shop, Betreiberbereich) im Seitenfuß verlinkt. Inhalte nur aus `IMPRESSUM_*`
  (siehe `.env.example`); AGB und Datenschutzerklärung als Links (`AGB_URL`,
  `DATENSCHUTZ_URL`), z. B. auf secret58.com.
* Fehlen Name, Anschrift, E-Mail, AGB- oder Datenschutz-Link, verweigert der Checkout
  den Verkauf; das Betreiber-Dashboard zeigt den Stand.
* Kunden, die über ihren Shop verkaufen, pflegen unter „Verkauf & Shop“ ihre eigenen
  Anbieterangaben (Impressum nach § 5 DDG) und Links zu eigenen AGB, Datenschutz und
  Widerruf. Ihre Angebotsseiten zeigen dann **deren** Impressum
  (`/shop/<produkt>/impressum`), mit Hinweis auf SECRET 58 als technische Plattform.
* Ohne Name, Anschrift, E-Mail und Datenschutz-Link ist ein Angebot nicht öffentlich
  (404) und nicht kaufbar. Links werden nur als http(s) angenommen.

## 10. Datenschutz-Technik (Vorbereitung, keine rechtliche Vollständigkeit)

* Datenflüsse an Dritte:
  - KI-Anbieter (Anthropic/OpenAI): Eingaben, Markenangaben, Chatverläufe
  - ElevenLabs: Texte für die Sprachausgabe
  - Stripe: Zahlungs-, Kunden- und Händlerdaten
  - Social-Netzwerke: per OAuth verbundene Konten
  - Browser-Anbieter: Spracherkennung bei Genesis
* Einwilligung bei der Registrierung zur Übermittlung an KI-Anbieter, gespeichert als `consent.aiProcessing`.
* Keine Bank- oder Kartendaten in der Anwendung; diese liegen ausschließlich bei Stripe.
* Protokoll (`audit_logs`): Anmeldung, Registrierung, Paketänderungen, Webseiten-Einbindungen, Export.
* Offen:
  - Aufbewahrungsfristen und automatisches Löschen alter Protokolle und Sitzungen
  - Auftragsverarbeitungsverträge mit den Anbietern
  - Datenschutzerklärung, AGB, Impressum: deine Angaben fehlen und wurden nicht erfunden
  - E-Mail-Bestätigung und Passwort-Zurücksetzen (es ist kein E-Mail-Versand eingebunden)
