# Weiterempfehlungen & Reichweite

Modul in der Social-Media-App (`/weiterempfehlungen`). Stand: Vorschau im Branch `feature/weiterempfehlungen`, nicht veröffentlicht.

## Was das Modul tut
- **Freiwilliges Teilen:** Systemdialog (Web Share API), „Link kopieren“, offizielle Teilen-Adressen (WhatsApp, Telegram, Facebook, LinkedIn, X, E-Mail), Begleittexte. Empfänger wählt immer die Person selbst. Ein geöffneter Teilen-Dialog wird **nie** gezählt.
- **Kampagnen- und Empfehlungslinks:** `/e/<code>` mit zufälligem 10-Zeichen-Code. Der Code ist kein Login- oder Zugangstoken und enthält keine Personendaten. Öffentlich sichtbar sind nur Titel, Text und Zielseite der Reichweiten-Kampagne. Interne Kampagne und Bezeichnungen bleiben privat.
- **Stufen:** Eine neue Stufe entsteht nur, wenn jemand auf der öffentlichen Seite ausdrücklich „Eigenen Empfehlungslink erzeugen“ klickt. Das geht bis höchstens Stufe 5. Wird derselbe Link weitergegeben, bleibt es dieselbe Stufe.
- **Übersicht je Kampagne:** Jede Zahl trägt Quelle, Zeitraum, letzte Aktualisierung, Messlücken und ein Demo-Kennzeichen. Der Ablauf geht von Beitrag über dokumentierte Weiterempfehlung, Linkbesuch und Zielseite bis zu Newsletter und Anfrage.

## Was messbar ist und was nicht
| Größe | Status |
|---|---|
| Linkaufrufe über Empfehlungslinks | gemessen. Es sind Aufrufe, keine Personen. Bots, Messenger-Vorschauen und Prefetch werden nicht gezählt. |
| Klicks zur Zielseite | gemessen über `/e/<code>/weiter` |
| Anfragen über das Formular | gemessen. Sie landen als Kundenanfrage im Kanal `empfehlung`. |
| Ausdrücklich erzeugte eigene Links | gemessen (gemessene Weiterempfehlung) |
| Aufrufe über Team-Links | gemessen, Herkunft aber **unbekannt**: direkt aus dem Beitrag, aus der Bio oder aus einer weitergeleiteten Nachricht |
| Impressionen, Reichweite, Videoaufrufe, Shares | nur DEMO oder manuell übertragen. Der Statistik-Abruf per Schnittstelle ist **nicht angebunden**. |
| Plattformempfehlungen (Algorithmus) | nicht angebunden |
| Newsletter-Anmeldungen je Kampagne | nicht angebunden. Der vorhandene Newsletter ist global. |
| Eindeutige Personen | **nicht messbar**. Es gibt keine Cookies und keine Besucherkennung. |
| Weitergabe per Messenger (gleicher Link) | nicht messbar |

Reichweite, die über Plattformen summiert wird, ergibt keine Zahl eindeutiger Personen. Aufrufe, Klicks und Ausspielungen werden nicht miteinander verrechnet.

## Datenschutz
- Ereignisse speichern nur Art, Link, Kampagne und Zeit. Sie speichern keine IP-Adresse, keinen User-Agent und kein Cookie. Für den Missbrauchsschutz werden Zähler-Schlüssel (auch die IP-Adresse) mit einem geheimen Server-Wert per HMAC pseudonymisiert (`src/lib/rateLimit.ts`); abgelaufene Zähler werden nach 2 Tagen gelöscht.
- Es gibt keine Einwilligungsverwaltung. Deshalb ist bewusst kein Tracking mit Personenbezug eingebaut. Bevor echtes Tracking (Pixel, Cookies, Analytics) kommt, muss eine Einwilligungsverwaltung eingerichtet werden.
- Es gibt keinen Adressbuchzugriff, keine automatischen Nachrichten und keine Massen-DMs.
- Mandantentrennung: Alle Abfragen laufen über `workspaceId` aus der Sitzung, fremde IDs ergeben 404. Rollen: `VIEWER` darf nur lesen, alle anderen Rollen dürfen auch bearbeiten. Änderungen stehen im Audit-Log.
- Aufbewahrung: Ereignisse werden nach `EMPFEHLUNG_AUFBEWAHRUNG_TAGE` Tagen gelöscht (Standard 180), jeweils beim Öffnen einer Auswertung. Wird eine Kampagne gelöscht, werden ihre Links, Ereignisse und Kennzahlen mitgelöscht. Anfragen verwaltet der Bereich „Kundenanfragen“.
- Öffentliche Empfehlungsseiten sind nur mit vollständigem Verkäuferprofil des Kunden erreichbar (Name, Anschrift, E-Mail, Datenschutzerklärung); die Fußzeile verlinkt dessen Impressum (`/e/<code>/impressum`) und Datenschutzerklärung. Demo-Links sind ausgenommen und gekennzeichnet.
- Die Anfrage-Formulare verlangen eine Einwilligungs-Checkbox, die den Kunden als Empfänger nennt und auf seine Datenschutzerklärung verweist. Sie haben ein Honigtopf-Feld und ein Limit von 5 Anfragen pro Stunde je IP-Hash und von 30 pro Stunde je Link.

## Technik
- Modelle: `ReichweitenKampagne`, `EmpfehlungsLink`, `EmpfehlungsEreignis`, `ReichweitenKennzahl` (`prisma/schema.prisma`). Das ist eine reine Erweiterung, `db push` ist nicht destruktiv.
- Logik: `src/lib/reichweite/` (`auswertung.ts` ist rein und getestet).
- API mit Anmeldung: `/api/reichweite/**`. Öffentlich: `/e/[code]`, `/e/[code]/weiter`, `/api/empfehlung/[code]/{link,anfrage}`.
- Tests: `npm test` (Muster „Empfehlung“) und der Integrationstest „Weiterempfehlungen“.
