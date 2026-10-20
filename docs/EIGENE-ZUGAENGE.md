# Eigene Zugänge der Kunden (API-Schlüssel)

Seite: **Einstellungen → Eigene Zugänge** (`/settings/zugaenge`). Inhaber und Admins eines Workspaces tragen dort ihre eigenen Schlüssel ein; jeder Anbieter hat einen Wegweiser mit Links, wo es den Schlüssel gibt.

| Anbieter | Wofür | Prüfung beim Speichern |
|---|---|---|
| Resend | Newsletter: Bestätigungsmails und Ausgaben | `GET /domains`: Schlüssel gültig, Absenderdomain bestätigt (reiner Versandschlüssel: nur Schlüsselprüfung); zusätzlich DNS-Abfrage des DMARC-Eintrags (`_dmarc.<domain>` oder der Hauptdomain) – ohne DMARC kein echter Versand |
| Anthropic | KI-Texte (Agenten, Content Brain, Antwortentwürfe, Webseiten-Widget) | `GET /v1/models` (kostenlos, nichts wird generiert) |
| OpenAI | wie Anthropic (Ersatz) | `GET /v1/models` |
| Google Gemini | wie Anthropic (Ersatz); nur mit Abrechnung (Paid Tier) für Kundendaten | `GET /v1beta/models` |

## Regeln
- Speicherung verschlüsselt (`TOKEN_ENCRYPTION_KEY`, Modell `WorkspaceZugang`), nur für den eigenen Workspace, nie an den Browser (nur die letzten vier Zeichen), nie im Log. Genutzt wird ein Zugang nur, wenn die letzte Prüfung erfolgreich war.
- **KI in Kunden-Workspaces nur mit eigenem Schlüssel**: kein Rückgriff auf die Betreiber-Schlüssel. Ohne eigenen Schlüssel arbeiten die Agenten im gekennzeichneten Template-Modus; der Webseiten-Widget-Chat antwortet „nicht verfügbar“. Reihenfolge bei mehreren Schlüsseln: Anthropic → OpenAI → Gemini.
- Umsetzung: `mitKiZugang(workspaceId, fn)` (`src/lib/ai/kundenKi.ts`) setzt die Schlüssel per `AsyncLocalStorage`; `runAgent` und der Widget-Chat laufen darin. Ohne Kontext (SECRET-58-eigene Webseiten-Chats, Hilfe-Chat in der App, Betreiberbereich) gelten die Server-Schlüssel. Workspaces mit einem Betreiber-Konto (`isOperator`) nutzen die Server-Schlüssel.
- Sprach-, Video- und Designdienste (ElevenLabs usw.) stellt weiterhin der Betreiber.
- Paket-Kontingente gelten unverändert.
- Datenschutz: Die Auftragsverarbeitung mit KI-Anbieter bzw. Resend schließt der Kunde selbst ab; für die Daten seiner Kontakte auf SECRET-58-Servern braucht es einen Auftragsverarbeitungsvertrag zwischen SECRET 58 und dem Kunden (Art. 28 DSGVO).
