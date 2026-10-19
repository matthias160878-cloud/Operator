# Pilotstudio (intern, nur Betreiber)

Internes Werkzeug, um einen **Kundenanfragen-Piloten** sicher zu testen und den **Bedarf bei KMU** zu prüfen.
Es ist kein öffentliches Produkt und ändert weder Preise, Abonnements, Checkout noch Zahlungsabläufe.

- **Aufruf:** Betreiberbereich `/operator` → Knopf **„Pilotstudio“** oder direkt `/operator/pilotstudio`
  (Staging: <https://secret58-staging.onrender.com/operator/pilotstudio>).
- **Zugriff:** nur angemeldete Betreiber. Der Schutz greift serverseitig an drei Stellen: im Proxy (`src/proxy.ts`), auf der Seite (Weiterleitung) und in jeder API-Route (`withOperator`). Andere Konten erhalten 404.
- **Reiter:** Überblick · Kundenanfragen-Pilot · Nachfrageprüfung · Einrichtung.

## Ablauf einer Anfrage

Eingang → Einordnung → Antwortentwurf → Prüfung → Freigabe **oder** Übergabe an eine Person → Versandstatus → Protokoll.

1. **Eingang:** Es gibt drei Wege.
   - Manuell erfassen.
   - Die 10 Demo-Testfälle laden.
   - Anfragen aus dem vorhandenen Kontaktformular der Webseite übernehmen (Knopf). Jede Anfrage wird nur einmal übernommen, abgesichert über `sourceRef`.
2. **Einordnung:** regelbasiert über `classify()`. Zahlung, Datenschutz, Kündigung, Reklamation und Manipulationsversuche werden als „Mensch prüft“ markiert. Der Inhalt einer Anfrage gilt als nicht vertrauenswürdig und wird nie als Anweisung ausgeführt.
3. **Entwurf:** Es gibt zwei Arten.
   - „Musterantwort“: fester Text, ohne KI.
   - „KI-Entwurf“: nur mit hinterlegtem Server-Schlüssel. Die Anfrage wird als nicht vertrauenswürdiger Block übergeben, die Ausgabe wird geprüft. Ist sie unbrauchbar, wird der Fall an einen Menschen gegeben.
4. **Prüfung:** `guardFlags()` erkennt Preise, Passwortanforderungen, ungeprüfte Terminbestätigungen, Erstattungs- und Zahlungszusagen, behauptete Löschungen, Kündigungstermine, Verfügbarkeitszusagen sowie fremde E-Mail-Adressen und Telefonnummern. Ist eine Regel verletzt, ist keine Freigabe möglich (422).
5. **Freigabe** gilt nur für genau die geprüfte Textfassung (Version und SHA-256-Hash). Jede Änderung am Text hebt die Freigabe auf.
6. **Versand:**
   - Demo-Fälle werden nur **simuliert**.
   - Echtfälle werden nur versendet, wenn Resend eingerichtet ist und `PILOTSTUDIO_LIVE_SEND=true` gesetzt ist. Dazu kommen eine Rückfrage in der Oberfläche, eine atomare Sperre (`VERSAND_AUSSTEHEND`) und ein Idempotenzschlüssel `pilot-<id>-v<version>`. So geht jede Fassung höchstens einmal raus.
   - Statuswerte: Freigegeben, Versand ausstehend, Versendet (vom Anbieter angenommen; die Zustellung wird nicht verfolgt), Versand fehlgeschlagen (höchstens 3 Versuche).
7. **Protokoll:** Jede Aktion wird als `PilotEvent` gespeichert (wer, was, wann).

## Zehn Testfälle

Die Fälle stehen in `src/lib/pilotstudio/cases.ts`. Alle Inhalte sind erfunden. Je Fall gibt es ein erwartetes Verhalten, eine Musterantwort und eine automatische Prüfung (`autoCheck`). Für jeden Fall führt die Oberfläche ein Testprotokoll mit diesen Angaben:

- Testart (Demo / KI / Kanal)
- manuelle Vergleichszeit und Pilotzeit (mit Stoppuhr)
- Korrekturen und deren Art
- Ergebnis mit Pflichtbegründung

## Nachfrageprüfung

Es gibt fünf leere Gesprächsplätze. Dazu gehören ein Leitfaden und ein Eröffnungstext zum Kopieren sowie ein Vergleich, der den Zeitaufwand pro Woche errechnet. Firmen werden nur über einen Kürzel erfasst. Ein Budget wird nur mit Währung gespeichert. **Das System kontaktiert keine Unternehmen.**

## Einrichtung, Export und Import

- Hier werden Wissensbasis, Antwortregeln, Zuständigkeiten und die Checkliste (9 Punkte) gepflegt.
- **Export** (`GET /api/operator/pilotstudio/export`): als JSON im Format `secret58-pilotstudio` v1, ohne Schlüssel oder Passwörter.
- **Import** (`POST …/import`):
  - Das Format wird streng geprüft. Aktive Inhalte (script, iframe, svg, style, `javascript:`, `on…=`) werden abgelehnt.
  - Überschreiben ist nur mit Bestätigung möglich.
  - Freigaben und Versandstatus werden **nie** importiert.

## Kundenbereich `/kundenanfragen`

Der Kundenbereich ist vorbereitet, aber nicht freigeschaltet. Er wird erst mit `PILOTSTUDIO_KUNDENBEREICH=true` sichtbar. Dann zeigt er nur die eigenen Echtfälle des Arbeitsbereichs und nur zum Lesen.

## Geänderte und neue Dateien

| Datei | Inhalt |
|---|---|
| `prisma/schema.prisma` | Neue Tabellen `PilotInquiry`, `PilotEvent`, `PilotInterview`, `PilotConfig` (nur Ergänzungen) |
| `src/lib/pilotstudio/guard.ts` | `classify`, `guardFlags`, `CATEGORIES` |
| `src/lib/pilotstudio/cases.ts` | `DEMO_CASES`, `CATEGORY_TEMPLATES`, `autoCheck` |
| `src/lib/pilotstudio/service.ts` | Anfragen, Entwurf, Bearbeiten, Freigabe, Übergabe, Versand, Auswertung, Protokoll |
| `src/lib/pilotstudio/demand.ts` | Gespräche, Einrichtung, Export/Import |
| `src/lib/pilotstudio/overview.ts` | Gesamtzustand und Integrationsstatus |
| `src/lib/pilotstudio/http.ts` | `withOperator`, `readJson` |
| `src/app/api/operator/pilotstudio/**` | API-Routen (siehe unten) |
| `src/app/operator/pilotstudio/page.tsx` | Seite |
| `src/components/operator/PilotStudio.tsx` | Oberfläche |
| `src/app/operator/page.tsx` | Menüknopf „Pilotstudio“ |
| `src/app/(dashboard)/kundenanfragen/page.tsx` | Vorbereiteter Kundenbereich (aus) |
| `src/lib/email.ts` | `sendEmail` liefert die Nachrichten-ID und akzeptiert einen Idempotenzschlüssel (abwärtskompatibel) |
| `tests/*` | Unit-, Integrationstests und Attrappe für den E-Mail-Dienst |

### API (alle nur für Betreiber, mutierende Aufrufe nur von derselben Herkunft)

- `GET /api/operator/pilotstudio`: Gesamtzustand
- `POST /api/operator/pilotstudio`: `action` = `anfrage` | `demo` | `demo-zuruecksetzen` (mit `confirmed`) | `webseite-uebernehmen` | `einrichtung`
- `POST /api/operator/pilotstudio/anfragen/[id]`: `action` = `entwurf-demo` | `entwurf-ki` | `bearbeiten` | `freigeben` | `uebergeben` | `versenden` | `auswertung` | `autopruefung` | `abschliessen`
- `DELETE /api/operator/pilotstudio/anfragen/[id]`: Löschen (Rückfrage in der Oberfläche)
- `PUT /api/operator/pilotstudio/gespraeche/[slot]`
- `GET …/export`, `POST …/import`

## Befehle

```bash
npm install
npx prisma db push          # legt nur die neuen Tabellen an (Ergänzung)
npm run build && npm run start
npm run typecheck && npm run lint
npm test                    # Unit-Tests
npm run build && npm run test:integration
```

## Einstellungen (Werte nur im Server hinterlegen, nie im Chat)

| Variable | Wirkung |
|---|---|
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY`, `AI_PROVIDER` | Aktiviert den Knopf „KI-Entwurf“. Ohne Schlüssel gibt es nur Musterantworten. |
| `RESEND_API_KEY`, `EMAIL_FROM` | E-Mail-Versand |
| `PILOTSTUDIO_LIVE_SEND=true` | Versandschalter für Echtfälle (zusätzlich zu Resend). Standard: aus. |
| `PILOTSTUDIO_KUNDENBEREICH=true` | Blendet `/kundenanfragen` ein. Standard: aus. |

## Tests

- **Unit-Tests** (`tests/unit.test.ts`):
  - Alle 10 Musterantworten bestehen Prüfregeln und Autoprüfung.
  - Alle 10 Fälle werden richtig eingeordnet.
  - Die Prüfregeln erkennen erfundene Zusagen.
- **Integrationstest** „Pilotstudio: …“ (`tests/integration.test.mjs`):
  - Betreiberschutz (401/404)
  - Alle 10 Testfälle vollständig
  - Freigabe wird durch Bearbeiten aufgehoben
  - Falscher Hash ergibt 409
  - Preis-Prüfregel ergibt 422
  - Parallele Versandversuche: genau eine E-Mail
  - Fehlschlag mit erneutem Versuch
  - Unbrauchbare KI-Ausgabe ergibt 502 und Übergabe an einen Menschen
  - Fremder Arbeitsbereich ergibt 404
  - Gesprächsvalidierung
  - Übernahme aus dem Kontaktformular ohne Doppelung
  - Export ohne Geheimnisse
  - Import lehnt aktive Inhalte, fremde Formate und unbestätigtes Überschreiben ab
- **Stand 19.10.2026:**
  - Unit 24 + 6 bestanden.
  - Integration 48/48 bestanden.
  - Typecheck sauber; Lint ohne Fehler (5 ältere Warnungen außerhalb des Pilotstudios).
  - Browserprüfung Desktop und Handy ohne Überlauf und ohne JS-Fehler.
  - Daten bleiben nach einem Neustart des Servers erhalten.

## Grenzen

- Die frühere private Vorschau (`…chatgpt.site`) war nicht erreichbar (401). Daten daraus wurden nicht übernommen. Liegt eine Exportdatei vor, kann sie nur übernommen werden, wenn sie zum Format oben passt.
- Die Zustellung beim Empfänger wird nicht verfolgt. „Versendet“ heißt: Der Anbieter hat die Nachricht angenommen.
- KI-Entwürfe wurden nur mit Attrappe getestet, nicht mit einem echten Anbieter.
- Die Autoprüfung ist ein Hinweis und ersetzt nicht die menschliche Bewertung.

## Rückbau

`git revert <commit>` entfernt Oberfläche und Logik. Die vier Tabellen sind reine Ergänzungen und stören nicht. Sie können bleiben oder später bewusst und mit Freigabe entfernt werden. Es gibt keine destruktive Migration.

## Live-Schaltung (nur mit ausdrücklicher Freigabe durch Matthias)

1. Wissensbasis, Antwortregeln und Zuständigkeiten im Reiter „Einrichtung“ ausfüllen.
2. Alle zehn Testfälle bewerten (Ziel: bestanden).
3. Optional einen KI-Schlüssel im Server hinterlegen, eine Verbrauchsgrenze beim Anbieter setzen und die Fälle im Modus „KI“ wiederholen.
4. Resend (`RESEND_API_KEY`, `EMAIL_FROM`) einrichten und mit einer eigenen Testadresse prüfen.
5. Erst danach `PILOTSTUDIO_LIVE_SEND=true` setzen. Jeder Versand braucht weiterhin eine Freigabe und eine Bestätigung.
6. Datenschutzhinweis und Auftragsverarbeitung mit den Anbietern klären.
