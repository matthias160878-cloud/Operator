# Reichweitenaufbau

Neuer Bereich in der Social-Media-App (`/reichweitenaufbau`), gegliedert in die Tabs Übersicht, Content-Ideen, Variantenvergleich, Kooperationen, Werbeplanung und Newsletter.
Der Bereich baut auf dem Modul [Weiterempfehlungen](WEITEREMPFEHLUNGEN.md) auf: Er nutzt dessen Kampagnen, Empfehlungslinks und Messdaten und legt keine eigene Kampagnenverwaltung an.
Inhalte laufen durch die bestehende Freigabe der Content Factory.

Stand: Vorschau im Branch `feature/reichweitenaufbau`. Nicht veröffentlicht. Es gibt keine echten Posts, E-Mails, Kooperationsnachrichten oder Werbeausgaben.

## Status je Baustein

| Baustein | Status | Was echt ist | Was Demo bzw. offen ist |
|---|---|---|---|
| 1. Inhalte zum Weiterempfehlen | **umgesetzt** | Geführtes Briefing mit sechs Vorlagenarten. Übernahme als Entwurf in die Content Factory (Prüfung → Freigabe → Planung wie bisher). | Die Vorlagen sind regelbasiert und enthalten keine KI-Texte. Vorher-nachher ist gesperrt, solange keine belegte Grundlage angegeben ist. |
| 2. Varianten testen und auswerten | **umgesetzt**, Plattformwerte **Demo/manuell** | Festlegungen vor dem Start. Eigener Empfehlungslink je Variante, darüber werden Linkklicks, Anfragen und bestätigte Newsletter-Anmeldungen selbst gemessen. Statistik per Zwei-Anteile-z-Test mit Mindestmengen. | Wiedergabedauer, Abschlussrate, Weiterleitungen, Speicherungen und Profilbesuche werden nur manuell oder als Demo erfasst, weil die Plattform-Statistiken nicht angebunden sind. |
| 3. Kooperationen | **umgesetzt** | Übersicht mit allen Feldern, Status, nächstem Schritt, Termin und Kampagne. Individueller Kampagnenlink zur Auswertung. Persönlicher Anfrage-Entwurf. | Es wird nichts versendet. Gemeinsame Beiträge (z. B. Instagram-Collab) sind nicht direkt ausführbar, weil keine Schnittstelle angebunden ist. |
| 4. Werbung planen | **umgesetzt als Planung und Export**, Werbeanbindung **noch offen** | Plan → Prüfung → Freigabe nur durch Inhaber oder Admin, mit ausdrücklich bestätigtem Betrag, Laufzeit und Ziel. Jede Änderung hebt die Freigabe auf. Export als JSON oder CSV. Gemeldete Ausgaben werden getrennt vom geplanten Budget geführt. Vorschläge zum Bewerben stützen sich auf gemessene Ergebnisse. | „Kampagne starten“ ist immer blockiert. Es gibt keine Anbindung an Meta, Google Ads, LinkedIn oder TikTok. |
| 5. Newsletter | **umgesetzt**, Versand **Demo** | Anmeldeseite `/n/<code>` mit Themenbeschreibung und Themenwahl. Double-Opt-in mit dokumentierter Einwilligung, Abmeldung (auch One-Click), kein Doppelkontakt je Workspace. Ausgaben mit Entwurf → Prüfung → Freigabe → Planung. Kampagnenzuordnung. Bestätigte Anmeldungen fließen in die Weiterempfehlungs-Auswertung ein. | Ohne Freischaltung wird keine E-Mail versendet: Bestätigungslinks erscheinen als DEMO. Der Versand von Ausgaben ist **noch nicht umgesetzt**, es gibt nur einen protokollierten Demo-Versand. Newsletter-Versand ist in keinem Paket (Pro, Maxi) als enthalten definiert. |
| Gemeinsame Oberfläche | **umgesetzt** | Statusleiste Entwurf → Prüfung → freigegeben → geplant → veröffentlicht/versendet → ausgewertet. Demo-Versand und freigegebene, aber nicht gestartete Werbung zählen nicht als umgesetzt. Nächste Schritte werden regelbasiert vorgeschlagen. | – |

## Messregeln
- **Variantenvergleich statt A/B-Test:** Werden Varianten organisch zu verschiedenen Zeiten veröffentlicht, heißt das Ergebnis „Variantenvergleich“. Ein Unterschied wird dann höchstens als „Hinweis, kein Beweis“ ausgegeben. „A/B-Test“ heißt es nur, wenn die Plattform selbst zufällig verteilt hat.
- **Wann ein Unterschied genannt wird:** Je Variante sind mindestens 100 Aufrufe und 10 Ereignisse nötig, außerdem |z| ≥ 1,96. Die Formel lautet: Kennzahl ÷ Aufrufe × 100.
- **Keine Wertung ohne Einzeldaten:** Durchschnittswerte der Plattform (Wiedergabedauer, Abschlussrate) werden nur gegenübergestellt, nicht statistisch getestet. Varianten auf verschiedenen Plattformen werden nicht gewertet.
- **Keine Doppelzählung:** Es gibt keine plattformübergreifende Summe, die als eindeutige Reichweite ausgegeben wird.
- **Newsletter-Zahlen:** Formularaufrufe, abgeschickte Anmeldungen, bestätigte Anmeldungen und Abmeldungen werden getrennt gezählt. Öffnungsraten werden nicht erhoben, weil sie technisch eingeschränkt sind.

## Rechte und Datenschutz
- Mandantentrennung über die Sitzung. Fremde IDs ergeben 404.
- Rechte je Rolle:
  - **VIEWER:** nur lesen.
  - **EDITOR:** bearbeiten.
  - **OWNER/ADMIN:** zusätzlich Werbebudget freigeben, Newsletter freigeben, planen und versenden sowie Kontakte löschen.
- Öffentliche Seiten setzen keine Cookies und speichern keine IP-Adresse (nur ein Hash für die Ratenbegrenzung). Es gibt keinen Adressbuch-Import.
- Aufbewahrung:
  - Unbestätigte und abgemeldete Newsletter-Kontakte werden nach 30 Tagen gelöscht.
  - Zählereignisse werden nach `EMPFEHLUNG_AUFBEWAHRUNG_TAGE` gelöscht (Standard 180).
  - Mit „Demo entfernen“ werden auch Anmeldungen gelöscht, die im Demo-Modus entstanden sind. Sie wurden nie per E-Mail bestätigt.

## Benötigte Zugänge und Dienste (vor einer echten Aktivierung)
| Zweck | Benötigt | Hinweis |
|---|---|---|
| Newsletter-Bestätigungsmails | `RESEND_API_KEY`, `EMAIL_FROM` (bestätigte Absenderdomain) und `REICHWEITE_NEWSLETTER_ECHTVERSAND=1` | Resend ist im Projekt bereits vorhanden. Pro Kunde ist ein eigener Absender oder eine eigene Domain zu klären. |
| Versand von Newsletter-Ausgaben | noch zu bauen (Warteschlange, Abmeldelink je Mail, List-Unsubscribe-Header, Versandprotokoll) | Vorher ist zu klären, ob und in welchem Paket der Versand enthalten ist. |
| Plattform-Statistiken | Statistik-Schnittstellen von YouTube Analytics, Instagram/Facebook Graph Insights, LinkedIn und TikTok | Die vorhandenen OAuth-Anmeldungen decken das noch nicht ab. |
| Werbung Meta | Meta-App mit `ads_management`/`ads_read`; für Kundenkonten Advanced Access (App Review und Business-Verifizierung) | [Doku](https://developers.facebook.com/docs/marketing-api/get-started/authorization) |
| Werbung YouTube | Google Ads API, Developer Token mindestens Basic Access | [Doku](https://developers.google.com/google-ads/api/docs/access-levels) |
| Werbung LinkedIn | Zugang zur Advertising API. Lookalike Audiences sind seit 29.02.2024 eingestellt. | [Hinweis](https://www.linkedin.com/help/lms/answer/94287) |
| Werbung TikTok | Entwickler-Freigabe für TikTok API for Business mit Audience Management | Vor der Anbindung in der offiziellen Doku prüfen |
| Einwilligungsverwaltung | nötig, bevor Pixel, Retargeting oder Conversions-Messung eingesetzt werden | ist derzeit nicht vorhanden, deshalb gibt es kein Tracking mit Personenbezug |

Die Recherche zu den Plattform-Voraussetzungen ist vom 19.10.2026. Teile davon stützen sich auf Drittquellen, deshalb muss sie vor der Anbindung erneut in den offiziellen Unterlagen geprüft werden.

## Erster Testlauf (ohne Veröffentlichung, ohne Werbeausgaben)
1. Lokal starten:
   ```
   npm run build
   DATABASE_URL=file:./vorschau.db npx prisma db push
   DATABASE_URL=file:./vorschau.db npm run preview:seed
   DATABASE_URL=file:./vorschau.db npm run start
   ```
2. Mit einem Testkonto anmelden und `/reichweitenaufbau` öffnen. Dann „Demo-Daten laden“ klicken.
3. **Content-Ideen:** Ein Briefing ausfüllen und „Vorschläge erstellen“ klicken. Einen Vorschlag „Als Entwurf übernehmen“ und danach in der Content Factory prüfen und freigeben.
4. **Variantenvergleich:** Die Demo-Auswertung lesen, dort steht „keine Aussage“. Einen Wert eintragen und beobachten, wie sich die Aussage ändert.
5. **Kooperationen:** „Entwurf erstellen“ klicken und den Text kopieren. Es wird nichts versendet.
6. **Werbeplanung:** Beim Demo-Plan „Freigeben …“ wählen und einen falschen Betrag eingeben, die Freigabe wird abgelehnt. Mit den richtigen Werten wird sie gespeichert, startet aber nichts. „Kampagne starten“ bleibt blockiert. Danach „Export CSV“ ausprobieren.
7. **Newsletter:**
   - Die Anmeldeseite öffnen, eine Test-Adresse wie `test@example.invalid` eingeben und den DEMO-Bestätigungslink klicken.
   - Die Ausgabe zur Prüfung geben, freigeben, planen und versenden. Das ist nur ein Demo-Versand, es geht keine E-Mail hinaus.
8. Zum Schluss „Demo entfernen“ klicken.
