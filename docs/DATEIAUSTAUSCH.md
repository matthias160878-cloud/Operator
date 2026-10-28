# Dateiaustausch (Kunde ↔ Server ↔ SECRET 58)

Echter, serverseitiger Dateiaustausch je Kundenkonto. Die Demo im Arbeitsbereich der Hauptseiten-Kopie
(`public/hauptseite/`, nur im Browser) bleibt unverändert als Demo bestehen. Ist man angemeldet,
zeigt sie den Serverstand an und verlinkt den echten Dateibereich. Die neue Zentrale (`public/zentrale-neu/`,
auf Staging `/zentrale-neu`, ohne Anmeldung, noindex) übernimmt Arbeitsbereich, Kontaktformular
(`/api/kontakt`) und Chat (`/api/chat`) der Kopie und soll später die Hauptseite ablösen.

- **Kunde:** Menü „Dateien“ → `/dateien`
- **Betreiber:** `/operator` → „Dateiaustausch“ → `/operator/dateien`

## Ordner und wer sie sieht

| Ordner | Wer legt ab | Wer sieht es |
|---|---|---|
| Eigene Dateien, eigene Ordner | Kunde | nur der Kunde |
| Von Agenten | Agenten (`agentAblage()`) | nur der Kunde |
| **An SECRET 58** | Kunde | Kunde **und** Betreiber |
| **Von SECRET 58** | nur Betreiber | Kunde und Betreiber |

Der Betreiber sieht bewusst keine anderen Kundenordner. Das entspricht dem Grundsatz im Betreiberbereich: „Kundeninhalte sind hier bewusst nicht sichtbar“.

## Weitergabe an andere (auch an andere Kunden)

„Link teilen“ erzeugt einen Freigabe-Link `/api/freigabe/<schlüssel>`. Er funktioniert ohne Anmeldung, und es gilt:

- Standard: 7 Tage, 5 Abrufe. Möglich sind 1–30 Tage und 1–100 Abrufe.
- Jeder Link lässt sich jederzeit widerrufen.
- Gespeichert wird nur der Hash des Schlüssels. Der Link wird einmal angezeigt.
- Abrufe werden atomar gezählt, damit die Grenze auch bei gleichzeitigen Abrufen hält.

## Grenzen und Sicherheit

- **Dateigröße:** höchstens 10 MB je Datei (`DATEIEN_MAX_MB`, Obergrenze 10).
- **Speicher je Konto:** 100 MB (`DATEIEN_KONTINGENT_MB`).
- **Gesperrt:** Ausführbare Dateien wie `.exe`, `.bat`, `.js` oder `.msi` werden nicht angenommen.
- **Dateinamen:** Pfadanteile und Sonderzeichen werden entfernt.
- **Auslieferung:**
  - Standard ist immer der Download (`application/octet-stream`, `nosniff`).
  - „Ansehen“ im Browser gibt es nur für PDF, Bilder und Text, jeweils mit `Content-Security-Policy: sandbox`.
  - HTML und SVG werden nie im Browser angezeigt.
- **Zugriffsschutz:**
  - Der Arbeitsbereich wird immer aus der Sitzung bestimmt, nie aus der Anfrage. Fremde IDs ergeben 404.
  - Der Proxy prüft zusätzlich die Herkunft der Anfrage.
- **Protokoll:** Jede Ablage, Änderung, Löschung, Freigabe und jeder Abruf wird im `AuditLog` festgehalten.

## Speicherort

Die Dateiinhalte liegen in der **Datenbank** (Tabelle `kunden_datei_inhalte`), nicht auf der Festplatte. Der
Staging-Dienst läuft im kostenlosen Render-Tarif ohne Zusatz-Disk, und dessen Festplatte wird bei jedem Neustart geleert.
Die Datenbank sichert Render mit. Bei vielen oder großen Dateien sollte später ein Objektspeicher (z. B. S3) angebunden werden.

`next.config.ts` setzt `experimental.proxyClientMaxBodySize = "12mb"`. Der Proxy puffert Anfragen sonst nur bis 10 MB.

## Schnittstellen

| Methode und Pfad | Zweck |
|---|---|
| `GET /api/dateien` | Übersicht: Dateien ohne Inhalt, Ordner, Links, aktive Freigaben, Speicher |
| `POST /api/dateien` | Upload (multipart: `datei`, `ordner`) |
| `GET /api/dateien/:id` | Download (`?ansehen=1` zeigt sichere Typen im Browser) |
| `PATCH /api/dateien/:id` | Umbenennen oder verschieben (`{ name?, ordner? }`) |
| `DELETE /api/dateien/:id` | Löschen |
| `POST /api/dateien/:id/freigabe` | Freigabe-Link anlegen (`{ tage, maxAbrufe }`) |
| `DELETE /api/dateien/freigaben/:id` | Freigabe-Link widerrufen |
| `POST /api/dateien/ordner` | Eigenen Ordner anlegen (`{ name }`) |
| `DELETE /api/dateien/ordner` | Eigenen Ordner löschen, nur wenn leer (`{ name }`) |
| `POST /api/dateien/links` | Link anlegen (`{ titel, url, art }`), nur http/https |
| `DELETE /api/dateien/links/:id` | Link löschen |
| `GET /api/freigabe/:schlüssel` | Öffentlicher Abruf, immer als Download |
| `GET /api/operator/dateien` | Betreiber: Kundenkonten mit Zählern |
| `GET /api/operator/dateien?konto=<id>` | Betreiber: sichtbare Dateien eines Kontos |
| `POST /api/operator/dateien` | Betreiber: Datei an Kunden übergeben (multipart: `datei`, `konto`) |
| `GET /api/operator/dateien/:id` | Betreiber: Download, nur „An SECRET 58“ und eigene Ablagen |
| `DELETE /api/operator/dateien/:id` | Betreiber: eigene Ablage entfernen |

Für Agenten im Servercode: `agentAblage(workspaceId, agent, name, daten, mime?)` aus `src/lib/dateien/service.ts`.
Die Funktion legt die Datei in „Von Agenten“ ab und hält dieselben Grenzen ein.

## Tests

`tests/integration.test.mjs` → „Dateiaustausch: …“ prüft:

- Anmeldung und Herkunft der Anfrage
- Upload, Typsperre, leere und zu große Dateien, eine Datei mit genau 10 MB
- Kundentrennung, sichere Auslieferung, Ordnerregeln
- Freigabe-Links mit Abrufgrenze, Widerruf und Ablauf; der Schlüssel liegt nur als Hash vor
- Links (javascript: und Zugangsdaten in der Adresse werden abgelehnt)
- Betreiber: Sichtbarkeit, Übergabe, Löschrechte
- Kontingent und Protokoll

`tests/unit.test.ts` prüft die Bereinigung von Namen, Ordnern und Adressen sowie die Ansichtstypen.

Noch nicht direkt getestet: `agentAblage()`. Die Funktion ist ein dünner Aufruf von `ablegen()`, und `ablegen()` ist getestet.
Heute ruft noch kein Agent sie automatisch auf.

## Rückbau

`git revert` des Commits. Die vier Tabellen `kunden_dateien`, `kunden_datei_inhalte`, `datei_freigaben` und `kunden_links`
sind reine Ergänzungen. Ein Entfernen der Tabellen löscht Kundendateien und braucht deshalb eine ausdrückliche Freigabe.
