# Reichweitenaufbau

Neuer Bereich in der Social-Media-App (`/reichweitenaufbau`), gegliedert in die Tabs Übersicht, Kampagnen, Content-Ideen, Variantenvergleich, Kooperationen, Werbeplanung, Newsletter und Demo-Testlauf.
Der Bereich baut auf dem Modul [Weiterempfehlungen](WEITEREMPFEHLUNGEN.md) auf: Er nutzt dessen Kampagnen, Empfehlungslinks und Messdaten; der Tab „Kampagnen“ ergänzt diese Kampagnen um Planung (Ziel, Kennzahl, Zeitraum, Verantwortliche, Budget) und Ablauf.
Inhalte laufen durch die bestehende Freigabe der Content Factory.

Stand: Auf Staging sind alle Bausteine eingeschaltet (`REICHWEITE_NEWSLETTER=1`, `REICHWEITE_WERBUNG=1`, freigegeben von Matthias am 19.10.2026). Ohne diese Variablen sind Newsletter und Werbeplanung **abgeschaltet**. Abgeschaltet sind dann Tab, API (404), öffentliche Seiten `/n/…` und die Demo-Daten des Bausteins. Die Abmeldung `/api/nl/abmelden` bleibt immer erreichbar. Es gibt keine echten Posts, E-Mails, Kooperationsnachrichten oder Werbeausgaben.

## Eigene Zugänge der Kunden (API-Schlüssel)
- Seite **Einstellungen → Eigene Zugänge** (`/settings/zugaenge`), Link aus den Einstellungen und aus dem Newsletter-Tab. Inhaber und Admins tragen dort ihren eigenen **Resend**-Schlüssel und Absender ein; Wegweiser mit Links (resend.com/signup → Domains → API Keys „Sending access“).
- Gespeichert verschlüsselt (`TOKEN_ENCRYPTION_KEY`) im Modell `WorkspaceZugang`, nur für den eigenen Workspace, nie an den Browser (nur die letzten vier Zeichen). Prüfung beim Speichern: Schlüssel gültig, Absenderdomain bei Resend bestätigt (bei reinem Versandschlüssel nur Schlüsselprüfung mit Hinweis).
- **Echter Newsletter-Versand** nur, wenn Baustein freigeschaltet, eigener Resend-Zugang geprüft und Anbieterangaben vollständig sind. Der Resend-Zugang des Betreibers wird für Kunden-Newsletter nie verwendet (getrennte Absender-Reputation je Kunde).
- Versand von Ausgaben: nur nach Freigabe, nur per Klick durch Inhaber/Admin (kein automatischer Versand zum geplanten Zeitpunkt), nur an bestätigte Kontakte mit passenden Themen, in Paketen zu 100 (Resend-Sammelversand). Jede Mail mit persönlichem Abmeldelink, Ein-Klick-Abmeldung (`List-Unsubscribe`, RFC 8058) und Anbieterangaben. Doppelversand wird über `NewsletterZustellung` verhindert; bei einem Fehler schickt ein erneuter Klick nur die übrigen.
- Werbekonten brauchen keine Schlüssel: Pläne werden exportiert und selbst im Werbekonto angelegt. Eine direkte Werbe-Anbindung erfordert die Freigabe der jeweiligen Plattform und ist nicht eingerichtet; „Kampagne starten“ bleibt gesperrt.

## Rechtliche Absicherungen (Stufe 1)
- **Impressum und Datenschutz des Kunden:** Öffentliche Seiten (`/e/…`, `/n/…`) sind nur erreichbar, wenn der Kunde unter „Verkaufen“ seine Pflichtangaben hinterlegt hat (Name, Anschrift, E-Mail, Link zur Datenschutzerklärung – dasselbe Verkäuferprofil wie im Shop). Sonst erscheint „noch nicht freigeschaltet“, Formulare und Links sind gesperrt (403), es wird nichts gezählt. Die Fußzeile verlinkt das Impressum des Kunden (`/e/<code>/impressum`) und seine Datenschutzerklärung; die Einwilligung im Anfrageformular nennt den Kunden als Empfänger. Demo-Seiten sind ausgenommen und tragen einen Hinweis.
- **Heilmittelwerbegesetz:** Vorher-nachher ist gesperrt, sobald das Briefing auf einen Schönheits- bzw. plastisch-chirurgischen Eingriff hindeutet (§ 11 Abs. 1 S. 3 Nr. 1 HWG) – auch wenn eine Grundlage angegeben ist. Bei Heilberufen und Behandlungen erscheint ein Hinweis auf weitere Grenzen des HWG. Die Erkennung beruht auf Stichwörtern und ersetzt keine Rechtsprüfung.
- **Werbekennzeichnung bei Kooperationen:** Jede Kooperation hat das Feld „Werbekennzeichnung“ (offen, Werbung, Anzeige, keine Gegenleistung) mit Hinweis auf § 5a Abs. 4 UWG und § 22 MStV. Ist sie bei einer vereinbarten oder umgesetzten Kooperation offen, erscheint eine Warnung in der Übersicht. Der Anfrage-Entwurf enthält einen Satz zur Kennzeichnung.

## Status je Baustein

| Baustein | Status | Was echt ist | Was Demo bzw. offen ist |
|---|---|---|---|
| 1. Inhalte zum Weiterempfehlen | **umgesetzt** | Geführtes Briefing mit sechs Vorlagenarten. Übernahme als Entwurf in die Content Factory (Prüfung → Freigabe → Planung wie bisher). | Die Vorlagen sind regelbasiert und enthalten keine KI-Texte. Vorher-nachher ist gesperrt, solange keine belegte Grundlage angegeben ist. |
| 2. Varianten testen und auswerten | **umgesetzt**, Plattformwerte **Demo/manuell** | Festlegungen vor dem Start. Eigener Empfehlungslink je Variante, darüber werden Linkklicks, Anfragen und bestätigte Newsletter-Anmeldungen selbst gemessen. Statistik per Zwei-Anteile-z-Test mit Mindestmengen. | Wiedergabedauer, Abschlussrate, Weiterleitungen, Speicherungen und Profilbesuche werden nur manuell oder als Demo erfasst, weil die Plattform-Statistiken nicht angebunden sind. |
| 3. Kooperationen | **umgesetzt** | Übersicht mit allen Feldern, Werbekennzeichnung, Status, nächstem Schritt, Termin und Kampagne. Individueller Kampagnenlink zur Auswertung. Persönlicher Anfrage-Entwurf. | Es wird nichts versendet. Gemeinsame Beiträge (z. B. Instagram-Collab) sind nicht direkt ausführbar, weil keine Schnittstelle angebunden ist. |
| 4. Werbung planen | **auf Staging eingeschaltet** (`REICHWEITE_WERBUNG`); umgesetzt als Planung und Export, Werbeanbindung **noch offen** | Plan → Prüfung → Freigabe nur durch Inhaber oder Admin, mit ausdrücklich bestätigtem Betrag, Laufzeit und Ziel. Jede Änderung hebt die Freigabe auf. Export als JSON oder CSV. Gemeldete Ausgaben werden getrennt vom geplanten Budget geführt. Vorschläge zum Bewerben stützen sich auf gemessene Ergebnisse. | „Kampagne starten“ ist immer blockiert. Es gibt keine Anbindung an Meta, Google Ads, LinkedIn oder TikTok. |
| 5. Newsletter | **auf Staging eingeschaltet** (`REICHWEITE_NEWSLETTER`); echter Versand über den **eigenen Resend-Zugang** des Kunden, sonst Demo | Anmeldeseite `/n/<code>` mit Themenbeschreibung und Themenwahl. Double-Opt-in mit dokumentierter Einwilligung, Abmeldung (auch One-Click), kein Doppelkontakt je Workspace. Ausgaben mit Entwurf → Prüfung → Freigabe → Planung. Kampagnenzuordnung. Bestätigte Anmeldungen fließen in die Weiterempfehlungs-Auswertung ein. | Ohne Freischaltung wird keine E-Mail versendet: Bestätigungslinks erscheinen als DEMO. Ohne eigenen Resend-Zugang ist der Versand von Ausgaben nur ein protokollierter Demo-Versand. Newsletter-Versand ist in keinem Paket (Pro, Maxi) als enthalten definiert. |
| Gemeinsame Oberfläche | **umgesetzt** | Statusleiste Entwurf → Prüfung → freigegeben → geplant → veröffentlicht/versendet → ausgewertet. Demo-Versand und freigegebene, aber nicht gestartete Werbung zählen nicht als umgesetzt. Nächste Schritte werden regelbasiert vorgeschlagen. | – |

## Kampagnen (Kampagnenassistent) – Stand 20.10.2026

Tab **Kampagnen** (`/reichweitenaufbau?tab=kampagnen`). Vor der Umsetzung geprüft und wiederverwendet: Kampagnen, Links und Ereignisse aus Weiterempfehlungen, die Freigabe der Content Factory (`/api/content-items/[id]/status`), die Werbeplanung, die eigenen KI-Zugänge und der Versand-Worker.

| Anforderung | Umsetzung | Echt | Demo / offen |
|---|---|---|---|
| Ziel, Hauptkennzahl, Zielgruppe, Zielseite, Zeitraum, Verantwortlicher, ggf. Budget | Pflichtfelder im Assistenten (`kampagnenplan.ts`), Zeitraum höchstens 1 Jahr, Verantwortlicher nur Inhaber/Admin, Budget nur ausdrücklich durch Inhaber/Admin („kein Budget“ ist Standard). Fehlende Angaben älterer Kampagnen werden markiert. | ja | – |
| Bearbeitbarer Ablauf | Vorschlag (Inhalt → Prüfung → Freigabe → Veröffentlichung → ggf. Werbung → Zwischenstand → Auswertung) mit Fälligkeiten; danach abhaken, bearbeiten, verschieben, ergänzen, löschen. | ja | Erinnerungen per E-Mail gibt es nicht. |
| Plattformformate aus einem Thema | Regelbasiert ohne KI und ohne Kosten für Instagram, TikTok, YouTube, LinkedIn, Facebook. Fakten wortgleich mit Quellenangabe [n]; ungeprüfte mit `[UNGEPRÜFT]`; Hinweise zu Zeichenlimit, fehlender Quelle, Erfolgsversprechen. Jede Variante hat eine eigene Vorschau und wird als eigener Entwurf übernommen (einmal je Variante, `herkunftsSchluessel`). | ja | Keine Bild-/Videoerzeugung; Videoablauf ist ein Textvorschlag. |
| Eigene Prüfung und Freigabe je Variante | Bestehender Content-Workflow. Freigabe gesperrt, solange `[UNGEPRÜFT]` im Text steht, und nur durch die verantwortliche Person (oder den Inhaber). Freigabe ≠ Veröffentlichung. | ja | – |
| KI-Feinschliff (optional) | Nur mit eigenem KI-Schlüssel. Vorher Kostenschätzung (Höchstbetrag), Ausführung erst nach Bestätigung. Ergebnis wird verworfen, wenn Faktzeilen oder Markierungen verändert wurden. | ja | Schätzung ist eine Obergrenze; abgerechnet wird beim Anbieter. |
| Links mit Angebotsseite | Jeder Link kann eine eigene Angebotsseite haben (`angebotUrl`), sonst die Zielseite der Kampagne. Weitergegebene Links erben sie; `/e/<code>/weiter` leitet dorthin. Auch im Weiterempfehlungs-Board eintragbar. | ja | – |
| Nachvollziehbare Zuordnung | Tabelle je Link und je Angebotsseite (`zuordnung.ts`). Ereignisse ohne Link bleiben „Herkunft unbekannt“ und werden keiner Seite zugeordnet. Hauptkennzahl aus der eigenen Messung. | ja | Plattform-Statistiken weiter nur manuell/Demo. |
| Werbung nur mit Budget | Werbepläne einer Kampagne nur, wenn dort ein Budget festgelegt ist, und in Summe höchstens bis zu diesem Betrag. | ja | Keine Werbe-API, Start bleibt gesperrt. |
| Pausierbare Automatik | Übersicht → „Alle pausieren“ (Inhaber/Admin). Der Worker nimmt fällige Aufträge pausierter Workspaces nicht an; sie bleiben erhalten und laufen nach dem Fortsetzen genau einmal. | ja | Betrifft geplante Veröffentlichungen; Newsletter und Werbung laufen ohnehin nur per Klick. |
| Keine Doppelungen | Kampagne: `erstellKennung`; Variante: `herkunftsSchluessel`; Veröffentlichung: bestehende Sperre `publishingStartedAt` und atomare Auftragsübernahme; Newsletter: `NewsletterZustellung`; Testlauf: atomarer Schrittwechsel. | ja | – |

### Demo-Testlauf
Tab **Demo-Testlauf**: Briefing → Entwurf → Prüfung → Freigabe → simulierte Ausführung → Auswertung, Schritt für Schritt per Klick. Nutzt dieselben Funktionen wie echte Kampagnen (Assistent, Plattformformate, Freigaberegeln, Zuordnung). Die Ausführung ist **simuliert**: Inhalte bekommen `simuliertAm`, es entsteht kein Versandauftrag, nichts wird gepostet, versendet, bezahlt oder per KI erzeugt. Demo-Links und 73 Demo-Ereignisse (davon eine Anfrage ohne Link → „Herkunft unbekannt“) werden genau einmal angelegt, auch bei Doppelklick. „Neu starten“ und „Testlauf entfernen“ löschen nur die Testlauf-Daten.

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
| Versand von Newsletter-Ausgaben | eigener Resend-Zugang des Kunden mit bestätigter Domain und DMARC (umgesetzt, siehe oben) | Vorher ist zu klären, ob und in welchem Paket der Versand enthalten ist. |
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
