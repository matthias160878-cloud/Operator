# Quelle der Schulungsvideo-Texte (de + en). Erzeugt messages/{de,en}/schulungVideos.json.
# Aufruf: python3 scripts/schulung/texte.py
import json, os
UI = {
 "playerTitle": ("Schulungsvideo", "Training video"),
 "subtitlesLabel": ("Untertitel", "Subtitles"),
 "subtitlesOff": ("Aus", "Off"),
 "soundLabel": ("Ton", "Sound"),
 "soundOn": ("Vorlesestimme an", "Voice on"),
 "soundOff": ("Vorlesestimme aus", "Voice off"),
 "soundHint": ("Die Vorlesestimme kommt aus deinem Browser. Welche Sprachen verfügbar sind, hängt von deinem Gerät ab.", "The voice comes from your browser. Which languages are available depends on your device."),
 "soundMissing": ("Für diese Sprache ist auf deinem Gerät keine Stimme installiert. Die Untertitel funktionieren trotzdem.", "No voice for this language is installed on your device. Subtitles still work."),
 "draftNote": ("Entwurf: Aufnahme der echten App mit Testdaten. Untertitel maschinell übersetzt.", "Draft: recording of the real app with test data. Subtitles machine-translated."),
 "whatLabel": ("Was ist das, welche Funktion hat es und wie führst du es aus.", "What it is, what it does and how to use it."),
 "videosTitle": ("Erklärvideos zu jedem Bereich", "Explainer videos for every area"),
}
V = {}
def v(key, title_de, title_en, cues):
    V[key] = (title_de, title_en, cues)
v("start","Erste Schritte","First steps",[
 ("Willkommen zur Schulung: Erste Schritte. Alles, was du siehst, ist die echte App mit Testdaten.","Welcome to the training: first steps. Everything you see is the real app with test data."),
 ("Links ist die Navigation. Jeder Bereich der App hat hier einen Eintrag.","The navigation is on the left. Every area of the app has an entry here."),
 ("Schritt 1: Prüfe unter „Integrationen“, welche Dienste verbunden sind.","Step 1: Check under \"Integrations\" which services are connected."),
 ("Jede Zeile zeigt den echten, geprüften Status – nie eine vorgetäuschte Verbindung.","Each row shows the real, verified status – never a faked connection."),
 ("„Nicht konfiguriert“ heißt: Dieser Dienst ist noch nicht eingerichtet. Ohne KI-Anbieter arbeitet die App im Vorlagen-Modus.","\"Not configured\" means this service has not been set up yet. Without an AI provider, the app works in template mode."),
 ("Schritt 2: Trage deine Marke unter „Brand DNA“ ein. Ton, Zielgruppe und Werte fließen in jeden generierten Text ein.","Step 2: Enter your brand under \"Brand DNA\". Tone, audience and values flow into every generated text."),
 ("Beispiel: Branche und Zielgruppe ausfüllen und unten speichern.","Example: fill in industry and target audience, then save at the bottom."),
 ("Schritt 3: Lass dir unter „Ideen & Inspiration“ die erste Idee erzeugen. Thema eingeben und auf „Ideen generieren“ klicken.","Step 3: Generate your first idea under \"Ideas & Inspiration\". Enter a topic and click \"Generate ideas\"."),
 ("Die Ideen erscheinen als Karten. Im Vorlagen-Modus sind es Beispiele, mit KI-Anbieter werden sie individuell.","The ideas appear as cards. In template mode they are examples; with an AI provider they become tailored to you."),
 ("Alles bleibt ein Entwurf, bis du es freigibst. Zu jedem Bereich gibt es ein eigenes Erklärvideo.","Everything stays a draft until you approve it. Every area has its own explainer video."),
])
v("dashboard","Dashboard","Dashboard",[
 ("Das Dashboard ist deine Startseite: der Überblick über alles, was in deinem Arbeitsbereich passiert.","The dashboard is your home page: an overview of everything happening in your workspace."),
 ("Oben siehst du aktive Agenten, Content-Produktion und geplante Beiträge.","At the top you see active agents, content production and scheduled posts."),
 ("Weiter unten stehen die letzten Aktivitäten und Abkürzungen zu Content Factory und Brand DNA.","Further down you find the latest activity and shortcuts to Content Factory and Brand DNA."),
 ("Mit „Woche“ stellst du den Zeitraum der Kennzahlen um.","Use \"Week\" to change the period of the figures."),
 ("So nutzt du es: Öffne das Dashboard täglich, prüfe offene Entwürfe und springe von hier direkt in den passenden Bereich.","How to use it: open the dashboard daily, check open drafts and jump straight to the right area from here."),
])
v("schulung","Schulung","Training",[
 ("Die Schulung ist deine Anleitung in der App. Sie erklärt jeden Bereich Schritt für Schritt.","The training section is your guide inside the app. It explains every area step by step."),
 ("Jedes Thema hat eine Beschreibung, nummerierte Schritte und einen Link, der die passende Seite öffnet.","Each topic has a description, numbered steps and a link that opens the matching page."),
 ("Hier erscheinen auch diese Erklärvideos, zu jedem Bereich eines.","These explainer videos appear here too, one for each area."),
 ("So nutzt du es: Thema wählen, Schritte lesen, Seite öffnen und gleich ausprobieren.","How to use it: pick a topic, read the steps, open the page and try it right away."),
])
v("contentFactory","Content Factory","Content Factory",[
 ("Die Content Factory ist die Werkbank für alle deine Content-Items an einem Ort.","The Content Factory is the workbench for all your content items in one place."),
 ("Funktion: Items erstellen, duplizieren, umschreiben, mit Voiceover und Untertiteln anreichern und durch den Freigabe-Workflow führen.","Function: create, duplicate and rewrite items, enrich them with voiceover and subtitles and run them through the approval workflow."),
 ("Die Filter oben zeigen die Status: Entwurf, In Prüfung, Freigegeben, Geplant, Veröffentlicht und Archiviert.","The filters at the top show the statuses: Draft, In review, Approved, Scheduled, Published and Archived."),
 ("So geht’s: Mit „Neues Content-Item“ legst du ein Item an.","How to: use \"New content item\" to create an item."),
 ("Öffne ein Item, um Skript, Voiceover, Untertitel, Hashtags und Thumbnail zu bearbeiten.","Open an item to edit script, voiceover, subtitles, hashtags and thumbnail."),
 ("Die Freigabe ist immer ein manueller Schritt. Nichts wird ohne deine Bestätigung veröffentlicht.","Approval is always a manual step. Nothing is published without your confirmation."),
])
v("ideas","Ideen & Inspiration","Ideas & Inspiration",[
 ("Hier sammelst du Ideen: Themencluster, Serien und Formate für kommenden Content.","Here you collect ideas: topic clusters, series and formats for upcoming content."),
 ("Funktion: Der IdeaAgent erzeugt Ideen zu einem Thema, oder du erfasst eigene Ideen von Hand.","Function: the IdeaAgent generates ideas for a topic, or you add your own by hand."),
 ("So geht’s: Thema eintragen, Plattform, Ziel und Format wählen und „Ideen generieren“ klicken.","How to: enter a topic, choose platform, goal and format and click \"Generate ideas\"."),
 ("Jede Idee wird eine Karte mit Titel, Aufhänger und Priorität.","Each idea becomes a card with title, hook and priority."),
 ("Mit „Manuell“ legst du eine eigene Idee an.","Use \"Manual\" to add your own idea."),
 ("Gute Ideen nimmst du als Ausgangspunkt für den Content Brain.","Take good ideas as the starting point for the Content Brain."),
])
v("contentBrain","Content Brain","Content Brain",[
 ("Der Content Brain macht aus einer Idee einen kompletten Content-Plan.","The Content Brain turns one idea into a complete content plan."),
 ("Funktion: Er berücksichtigt deine Brand DNA und erzeugt für jede gewählte Plattform Hooks, Scripts, Hashtags und Thumbnail-Konzepte als Entwurf.","Function: it takes your Brand DNA into account and creates hooks, scripts, hashtags and thumbnail concepts as drafts for every chosen platform."),
 ("So geht’s: Thema und Zielgruppe eintragen.","How to: enter the topic and the target audience."),
 ("Ziel und Sprache wählen, dann die Plattformen anklicken. Hier kommt TikTok dazu.","Choose goal and language, then click the platforms. Here, TikTok is added."),
 ("Mit dem Regler legst du fest, wie viele Content-Items je Plattform entstehen.","The slider sets how many content items are created per platform."),
 ("Ein Klick auf „Content-Plan generieren“ startet den Lauf.","One click on \"Generate content plan\" starts the run."),
 ("Die Kampagne erscheint unten. Alle Items sind Entwürfe und liegen in der Content Factory.","The campaign appears below. All items are drafts and are stored in the Content Factory."),
])
v("brandDna","Brand DNA","Brand DNA",[
 ("Die Brand DNA beschreibt deine Marke: Name, Branche, Zielgruppe, Ton und Werte.","The Brand DNA describes your brand: name, industry, target audience, tone and values."),
 ("Funktion: Diese Angaben fließen automatisch in Content Brain sowie in den Script-, Hook- und Hashtag-Agenten ein.","Function: this information flows automatically into the Content Brain and the script, hook and hashtag agents."),
 ("So geht’s: Felder ausfüllen, zum Beispiel Branche und Zielgruppe.","How to: fill in the fields, for example industry and target audience."),
 ("Weiter unten pflegst du bevorzugte und verbotene Wörter, Handlungsaufrufe und Markenwerte.","Further down you maintain preferred and forbidden words, calls to action and brand values."),
 ("Zum Schluss klickst du auf „Brand DNA speichern“.","Finally, click \"Save Brand DNA\"."),
])
v("scriptStudio","Script Studio","Script Studio",[
 ("Das Script Studio ist die Werkstatt für Skripte und Hooks.","The Script Studio is the workshop for scripts and hooks."),
 ("Funktion: Es baut Skripte nach der Struktur Hook, Problem, Nutzen, Beispiel, Ergebnis und Handlungsaufruf und liefert mehrere Hook-Varianten.","Function: it builds scripts using the structure hook, problem, value, example, payoff and call to action and delivers several hook variants."),
 ("So geht’s: Thema eintragen und die Plattform wählen.","How to: enter a topic and choose the platform."),
 ("Dann auf „Script & Hooks generieren“ klicken.","Then click \"Generate script & hooks\"."),
 ("Das Ergebnis ist ein Entwurf, den du in der Content Factory weiterverwendest.","The result is a draft that you continue to use in the Content Factory."),
])
v("voiceStudio","Voice Studio","Voice Studio",[
 ("Das Voice Studio verwaltet Stimmen und erzeugt Voiceover.","The Voice Studio manages voices and creates voiceovers."),
 ("Funktion: Voice Library pflegen, Vorschauen erzeugen und Stimmen importieren. Die Anbindung läuft über ElevenLabs.","Function: maintain the voice library, create previews and import voices. The connection runs via ElevenLabs."),
 ("So geht’s: Stimme manuell anlegen oder von ElevenLabs importieren. Der Import braucht eine eingerichtete Anbindung.","How to: add a voice manually or import it from ElevenLabs. The import needs a configured connection."),
 ("Mit einem Text und einer Stimme erzeugst du eine Vorschau und spielst sie ab.","With a text and a voice you create a preview and play it."),
])
v("videoStudio","Video Studio","Video Studio",[
 ("Das Video Studio ist die Video-Pipeline der App.","The Video Studio is the video pipeline of the app."),
 ("Funktion: Format Manager, austauschbare Video-Anbieter sowie Anbindung von Voiceover und Untertiteln.","Function: format manager, interchangeable video providers and connection of voiceover and subtitles."),
 ("Die Seite zeigt, welche Anbieter eingerichtet sind. Nicht eingerichtete werden ehrlich als solche gekennzeichnet.","The page shows which providers are set up. Providers that are not set up are honestly marked as such."),
 ("So geht’s: Videos erzeugst du je Content-Item in der Content Factory.","How to: you create videos per content item in the Content Factory."),
])
v("designStudio","Design Studio","Design Studio",[
 ("Das Design Studio liefert Thumbnail-Konzepte und Bild-Assets.","The Design Studio delivers thumbnail concepts and image assets."),
 ("Funktion: Der Thumbnail-Agent schlägt Titel, Bildidee, Text und Layout vor. Die Canva-Integration ist hier vorgesehen.","Function: the thumbnail agent suggests title, visual idea, text and layout. The Canva integration is planned here."),
 ("So geht’s: Thema für das Thumbnail eintragen.","How to: enter the topic for the thumbnail."),
 ("Auf „Konzept generieren“ klicken.","Click \"Generate concept\"."),
 ("Das Konzept dient dir als Vorlage für dein Bild.","The concept serves as a template for your image."),
])
v("socialMedia","Social Media","Social Media",[
 ("Hier verbindest du deine Plattform-Konten und siehst ihren Status.","Here you connect your platform accounts and see their status."),
 ("Funktion: Zugänge werden serverseitig verwaltet und verschlüsselt gespeichert. Über Composio meldest du dich bei der Plattform an.","Function: access is managed on the server and stored encrypted. You sign in to the platform via Composio."),
 ("Jede Karte zeigt Plattform, Konto, Status und letzten Lesetest.","Each card shows platform, account, status and the last read test."),
 ("„Noch nicht eingerichtet“ heißt: Der Betreiber hat die Anbindung auf dem Server noch nicht aktiviert.","\"Not set up yet\" means the operator has not yet activated the connection on the server."),
 ("So geht’s: Sobald eingerichtet, klickst du bei der Plattform auf „Verbinden“ und meldest dich an. Es wird nur gelesen, nichts veröffentlicht.","How to: once set up, click \"Connect\" on the platform and sign in. It only reads, nothing is published."),
])
v("calendar","Content Kalender","Content Calendar",[
 ("Der Content Kalender zeigt geplante und veröffentlichte Inhalte im Überblick.","The Content Calendar shows scheduled and published content at a glance."),
 ("Funktion: Alle Content-Items mit Veröffentlichungsdatum erscheinen hier, filterbar nach Plattform.","Function: all content items with a publishing date appear here, filterable by platform."),
 ("So geht’s: Plane ein Item in der Content Factory mit Datum, dann erscheint es hier.","How to: schedule an item with a date in the Content Factory, then it appears here."),
 ("Vor jeder Veröffentlichung prüft die App live, ob die Zielplattform verbunden ist.","Before every publication the app checks live whether the target platform is connected."),
])
v("analytics","Analytics","Analytics",[
 ("Analytics zeigt deine Leistungskennzahlen.","Analytics shows your performance figures."),
 ("Funktion: Nur tatsächlich vorhandene Daten, importiert oder von dir erfasst. Nichts ist erfunden.","Function: only data that really exists, imported or entered by you. Nothing is made up."),
 ("Du siehst die Entwicklung über Zeit, den bestperformenden Content und Empfehlungen des Learning Agents.","You see the trend over time, the best performing content and recommendations from the Learning Agent."),
 ("So geht’s: Sobald Plattformen verbunden sind oder du Daten einträgst, füllen sich die Diagramme.","How to: as soon as platforms are connected or you enter data, the charts fill up."),
])
v("growth","Wachstum","Growth",[
 ("Die Wachstums-Seite gibt Empfehlungen für mehr Reichweite.","The Growth page gives recommendations for more reach."),
 ("Funktion: Aus deinen echten Analytics-Daten berechnet sie beste Posting-Zeiten, erfolgreiche Hashtags und Formate.","Function: from your real analytics data it calculates the best posting times, successful hashtags and formats."),
 ("So geht’s: Plattform wählen und die Empfehlungen lesen.","How to: choose a platform and read the recommendations."),
 ("Das sind Empfehlungen, keine Automatik. Follower oder Interaktionen werden nicht künstlich erhöht.","These are recommendations, not automation. Followers or interactions are never artificially boosted."),
])
v("revenue","Einnahmen","Revenue",[
 ("Unter Einnahmen führst du deine Erlöse über Plattformen und Kampagnen zusammen.","Under Revenue you bring together your earnings across platforms and campaigns."),
 ("Funktion: Beträge erscheinen erst, wenn du sie einträgst. Es gibt keine erfundenen Zahlen.","Function: amounts only appear once you enter them. There are no made-up numbers."),
 ("So geht’s: Klicke auf „Einnahme erfassen“, wähle Plattform und Art und trage den Betrag ein.","How to: click \"Record revenue\", choose platform and type and enter the amount."),
 ("Ausgezahlt wird immer direkt über die Plattform. SECRET 58 wickelt keine Auszahlungen ab.","Payouts always happen directly through the platform. SECRET 58 does not process payouts."),
])
v("sales","Verkauf & Shop","Sales & Shop",[
 ("„Verkauf & Shop“ zeigt deine eigenen Geschäftseinnahmen.","\"Sales & Shop\" shows your own business revenue."),
 ("Funktion: Sie sind getrennt von deinem SECRET-58-Paket. Gezählt werden nur tatsächliche Verkäufe, Testdaten sind gekennzeichnet.","Function: it is separate from your SECRET 58 plan. Only actual sales are counted, test data is marked."),
 ("Oben stehen die Summen je Währung, darunter deine Anbieterangaben für das Impressum.","At the top are the totals per currency, below that your provider details for the legal notice."),
 ("Option B: Verkaufen über SECRET 58. Option A: einen bestehenden Shop importieren.","Option B: sell via SECRET 58. Option A: import an existing shop."),
 ("So geht’s: Anbieterangaben ausfüllen und speichern, dann den Verkaufsweg wählen.","How to: fill in and save your provider details, then choose the sales route."),
])
v("website","Meine Webseite","My website",[
 ("Hier bindest du den Webseiten-Assistenten auf deiner eigenen Webseite ein.","Here you add the website assistant to your own website."),
 ("Funktion: Der Assistent beantwortet Fragen deiner Besucher.","Function: the assistant answers your visitors' questions."),
 ("Wir ändern deine Webseite nicht automatisch. Du fügst den Code selbst ein oder lässt ihn von deinem Webdesigner einfügen.","We do not change your website automatically. You add the code yourself or have your web designer add it."),
 ("So geht’s: Webadresse eintragen und „Webseite hinzufügen“ klicken.","How to: enter your web address and click \"Add website\"."),
 ("Danach kopierst du den angezeigten Code in deine Webseite.","Then copy the code shown into your website."),
])
v("inbox","Posteingang","Inbox",[
 ("Der Posteingang sammelt Nachrichten und Kommentare über alle Plattformen.","The inbox collects messages and comments across all platforms."),
 ("Funktion: Der MessageAgent schlägt Antworten vor. Gesendet wird nur, was du freigibst.","Function: the MessageAgent suggests replies. Only what you approve is sent."),
 ("So geht’s: Solange keine Plattform live verbunden ist, klickst du auf „Konversation simulieren“.","How to: as long as no platform is connected live, click \"Simulate conversation\"."),
 ("Prüfe den Antwortvorschlag, passe ihn an und gib ihn frei.","Check the suggested reply, adjust it and approve it."),
])
v("agents","Agenten","Agents",[
 ("Der Agent Monitor zeigt alle SECRET-58-Agenten.","The Agent Monitor shows all SECRET 58 agents."),
 ("Funktion: Status, letzte Aufgabe und Ergebnis jedes Agenten. Jeder Lauf wird protokolliert.","Function: status, last task and result of every agent. Every run is logged."),
 ("In der Lauf-Historie siehst du, was wann gelaufen ist und ob es geklappt hat.","The run history shows what ran when and whether it worked."),
 ("So nutzt du es: Prüfe hier, wenn etwas nicht wie erwartet erzeugt wurde.","How to use it: check here when something was not created as expected."),
])
v("integrations","Integrationen","Integrations",[
 ("Hier siehst du den Live-Status aller externen Dienste.","Here you see the live status of all external services."),
 ("Funktion: Jede Zeile basiert auf den tatsächlich gesetzten Zugängen. Es gibt keine vorgetäuschten Verbindungen.","Function: every row is based on the access that is actually set. There are no faked connections."),
 ("Die Gruppen sind: KI-Provider, Voice, Social-Plattformen, Design, Video und Trends.","The groups are: AI providers, voice, social platforms, design, video and trends."),
 ("So geht’s: Bei „Nicht konfiguriert“ führt „API-Schlüssel holen“ zur Seite des Anbieters.","How to: for \"Not configured\", \"Get API key\" leads to the provider's page."),
 ("Externe Anbieter haben ihre eigenen Preise. Bei jedem Dienst steht, welches Modell gilt.","External providers have their own prices. Each service shows which model applies."),
])
v("billing","Paket & Abrechnung","Plan & billing",[
 ("Unter „Paket & Abrechnung“ siehst du dein Paket und kannst es wechseln.","Under \"Plan & billing\" you see your plan and can change it."),
 ("Funktion: Die KI-Funktionen laufen über die Zugänge des Betreibers. Du brauchst kein eigenes KI-Abo.","Function: the AI features run through the operator's access. You do not need your own AI subscription."),
 ("Es gibt Pro und Maxi, monatlich oder jährlich. Die Preise stehen netto auf den Karten.","There are Pro and Maxi, monthly or yearly. The prices are shown net on the cards."),
 ("Gekauft wird nur durch einen ausdrücklichen Klick auf „Zahlungspflichtig bestellen“.","A purchase only happens with an explicit click on \"Order with obligation to pay\"."),
 ("Hast du einen Promocode, löst du ihn im Feld darunter ein.","If you have a promo code, redeem it in the field below."),
])
v("settings","Einstellungen","Settings",[
 ("In den Einstellungen verwaltest du Arbeitsbereich, Nutzer und Systeminformationen.","In Settings you manage workspace, users and system information."),
 ("Funktion: Workspace, Rollen, Systemstatus, Einrichtungsassistent und deine Daten mit Auskunft und Löschung.","Function: workspace, roles, system status, setup assistant and your data with access and deletion."),
 ("So geht’s: Scrolle durch die Abschnitte. Das Löschen des Arbeitsbereichs verlangt eine zusätzliche Bestätigung.","How to: scroll through the sections. Deleting the workspace requires an additional confirmation."),
 ("Prüfe hier regelmäßig deine Daten und den Einrichtungsassistenten.","Check your data and the setup assistant here regularly."),
])
ORDER = list(V.keys())
def build(i):
    d = {k: val[i] for k, val in UI.items()}
    d["order"] = ORDER
    d["videos"] = {k: {"title": t[i], "cues": {f"c{n+1}": c[i] for n, c in enumerate(t[2])}} for k, t in ((k, (V[k][0], V[k][1], V[k][2])) for k in ORDER)}
    return d
if __name__ == "__main__":
    root = os.path.join(os.path.dirname(__file__), "..", "..")
    for i, loc in enumerate(["de", "en"]):
        json.dump(build(i), open(os.path.join(root, "messages", loc, "schulungVideos.json"), "w"), ensure_ascii=False, indent=2)
    print(len(ORDER), "Videos,", sum(len(v[2]) for v in V.values()), "Untertitel-Zeilen")
