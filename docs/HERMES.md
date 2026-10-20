# Hermes-Anbindung (vorbereitet, standardmäßig AUS)

Stand: geprüft gegen die offizielle Hermes-Agent-Dokumentation (hermes-agent.nousresearch.com/docs → API Server, Toolsets Reference).
Es gab in beiden Repositories vorher keinen Hermes-Code (`/hermes-pilot`, `/api/hermes-pilot`, `/api/public-hermes-chat` und `HERMES_*` waren nicht vorhanden). Alles hier ist neu und ohne erfundene Zugangsdaten.

## Was gebaut ist

| Teil | Ort | Zugriff |
|---|---|---|
| Interner Pilot | `/operator/hermes-pilot`, `POST/GET /api/operator/hermes-pilot` | nur Betreiberkonto |
| Öffentlicher Besucherchat | `POST /api/public-hermes-chat` (GET = nur „verfügbar ja/nein“) | öffentlich, nur mit allen Freigaben |
| Webseiten-Chat der Zentrale | `POST /api/chat` nutzt Hermes nur, wenn der öffentliche Chat verfügbar ist, sonst wie bisher | öffentlich |
| Eingabe der Zugänge | Betreiberbereich → Zugänge → Gruppe „Hermes“ | nur Betreiberkonto, Schlüssel verschlüsselt in der Datenbank |

## Was die Hermes-Dokumentation sagt (und was daraus folgt)

- Der API-Server gibt dem Agenten **den vollen Werkzeugsatz** (Terminal, Dateien, Web, Speicher, Skills …).
- Es gibt **keine Sperre pro Anfrage** und **keinen dokumentierten Modus ohne Werkzeuge**. Pro Anfrage lassen sich nur Modell/Anbieter überschreiben.
- `GET /v1/toolsets` (nur lesend) meldet die aktivierten Toolsets der Plattform `api_server`. Das ist ein **Konfigurationsstand**, kein Beweis, welche Werkzeuge eine einzelne Anfrage wirklich nutzt.
- Die Antwortform von `/v1/toolsets` ist in der Dokumentation nicht beschrieben.
- `/v1/chat/completions` ist zustandslos (der Client sendet den ganzen Verlauf). Langzeit-Speicher hängt an `X-Hermes-Session-Key`/dem Gesprächsverlauf; mehrere Nutzer sollen getrennte Profile mit getrennten Schlüsseln haben.
- Ein Systemprompt ist **keine** technische Sperre.

Darum gilt für den öffentlichen Chat **fail-closed**: Er läuft nur, wenn alle Punkte erfüllt sind — sonst erscheint er als „nicht verfügbar“, nie als Verbindung.

## Bedingungen für den öffentlichen Chat (alle nötig)

1. `HERMES_PUBLIC_CHAT_ENABLED=true`
2. `HERMES_PUBLIC_CHAT_PRIVACY_APPROVED=true` — erst setzen, wenn der **Datenschutzhinweis** den Chat-/KI-Dienst nennt (Besuchertexte gehen an den Hermes-Server und dessen Modellanbieter). **Hier ist eine Ergänzung durch Sie nötig.**
3. `HERMES_PUBLIC_TOOLS_ATTESTED=true` — Ihre ausdrückliche Bestätigung, dass das Profil geprüft ist (siehe „Hermes-Profil für Besucher“).
4. `HERMES_PUBLIC_API_URL` (https) und `HERMES_PUBLIC_API_KEY` — **eigener Dienst bzw. eigenes Profil und eigener Schlüssel**, nicht dieselben wie beim Pilot (wird geprüft).
5. `HERMES_PUBLIC_MODEL` (leer = `hermes-agent`)
6. `HERMES_PUBLIC_RATE_LIMIT_SECRET` (mind. 16 Zeichen; Besucheradressen werden nur als HMAC-Hash gezählt)
7. Optional `HERMES_PUBLIC_DAILY_LIMIT` (Standard 300 Antworten pro Tag, höchstens 5000)
8. Laufende Prüfung (alle 60 s, bei Fehler alle 15 s): `/health` erreichbar und `/v1/toolsets` lesbar; **aktiv dürfen höchstens `clarify` und `todo` sein**. Unlesbare, leere oder unvollständige Antwort = nicht sicher.
9. Notbremse: Zeigt eine Antwort Werkzeugnutzung (`tool_calls`), ist der öffentliche Chat 15 Minuten aus.

Pilot (intern): `HERMES_PILOT_ENABLED=true`, `HERMES_API_URL`, `HERMES_API_KEY`, optional `HERMES_MODEL`. Der Pilot sendet nur den vom Betreiber getippten Text — keine Kundendaten, keine Beiträge; die App führt nichts aus, was Hermes vorschlägt.

## Hermes-Profil für Besucher (so richten Sie es ein)

- Eigener Hermes-Dienst oder eigenes Profil (Port/Prefix `/p/<profil>`), eigener `API_SERVER_KEY`, `API_SERVER_HOST` nur intern/erreichbar für die App, CORS aus.
- In der Hermes-Konfiguration des Profils alle Toolsets aus (Terminal, Dateien, Browser, Code, Speicher, Skills, Web, Delegation, Cron …). Prüfen mit `GET /v1/toolsets`. Falls Hermes keinen Modus ganz ohne Werkzeuge zulässt: nur harmlose Reste (`clarify`, `todo`) zulassen — die Prüfung erlaubt nichts anderes.
- Speicher/Memory und Session-Suche aus, damit Besucher nicht über gemeinsame Erinnerungen vermischt werden. Die App sendet **keinen** `X-Hermes-Session-Id/-Key`.
- Der Dienst sollte in einem Container ohne Zugangsdaten und ohne Zugriff auf interne Netze laufen (zusätzliche Sicherung, falls doch ein Werkzeug aktiv wäre).

## Schutz im Code

- Nur `application/json`, höchstens 8000 Zeichen Body, Herkunft (`Origin`) muss die eigene Seite sein.
- Verlauf: höchstens 8 Nachrichten, Besuchernachricht höchstens 600 Zeichen, insgesamt 3000; Steuerzeichen entfernt.
- Antwort: höchstens 400 Tokens angefordert, höchstens 1500 Zeichen ausgegeben, 20 s Laufzeit, höchstens 4 gleichzeitige Aufrufe.
- Limits in der gemeinsamen Datenbank (wirken über Neustarts und mehrere Prozesse): 12 Fragen/10 Minuten und 60/Tag je Besucher-Hash, dazu das Tageslimit gesamt.
- Besucheradresse nur nach `TRUSTED_PROXY_HOPS` (Standard 1: der vom eigenen Proxy angehängte Eintrag).
- Gesperrte Themen, „bitte ein Mensch“ und Terminwünsche gehen **nie** an Hermes (gleiche Regeln wie beim Webseiten-Chat); Verweis auf Kontaktformular/info@secret58.com.
- Es werden keine Besuchertexte gespeichert. Fehler werden nur als Code geloggt, nie mit Schlüssel, URL-Parametern oder Inhalten.

## Offene Punkte für Sie

- **Datenschutzhinweise** ergänzen: eingesetzter Chat-/KI-Dienst (Hermes-Server, dessen Modellanbieter), Zweck, Rechtsgrundlage, Speicherdauer, Auftragsverarbeitung. Erst dann `HERMES_PUBLIC_CHAT_PRIVACY_APPROVED=true`.
- Impressumsangaben (Handelsregister, Gewerbe) ergänzen Sie selbst.
- Hermes-Server bereitstellen (Hosting, Schlüssel). Ohne ihn bleibt alles „nicht verfügbar“.
- Kundentrennung: Die App nutzt je Kunde einen eigenen Arbeitsbereich (getestet). Hermes bekommt davon nichts.
