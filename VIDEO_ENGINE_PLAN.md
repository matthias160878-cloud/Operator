# VIDEO_ENGINE_PLAN.md — Zielarchitektur & Work-Package-Plan (WP01)

Begleitdokument zu `ARCHITECTURE.md`. Während `ARCHITECTURE.md` den
**Ist-Zustand** beschreibt (leeres Repository), beschreibt dieses Dokument die
**Ziel-Architektur** der SECRET 58 AI MEDIA ENGINE und den konkreten Plan, wie
sie in den Work Packages WP02–WP20 entsteht. Es ist ein Plan, keine
Implementierung — es wird in diesem Schritt kein Code geschrieben.

## 1. Zielsystem in einem Bild

```
                   SECRET 58
                       │
                MASTER MEDIA AI
                       │
       ┌───────────────┼───────────────┐
       ↓               ↓               ↓
    CREATIVE         VISUAL           AUDIO
       │               │               │
    SCRIPT          VIDEO/IMAGE       VOICE
    STORYBOARD      AVATAR            MUSIC
       │               │               │
       └───────────────┼───────────────┘
                       ↓
                    EDITOR
                       ↓
                   CAPTIONS
                       ↓
                    QA AI
                       ↓
                  FORMAT AI
                       ↓
                THUMBNAIL AI
                       ↓
                SOCIAL MEDIA
                       ↓
                  PUBLISHING
```

Ein Nutzer gibt eine einzige Anweisung ein (Thema, Stil, Sprache, Stimme,
Zielplattformen); der Master Agent orchestriert die Pipeline
`IDEA → SCRIPT → STORYBOARD → VISUAL PLANNING → VIDEO GENERATION → VOICE →
MUSIC → SOUND → EDITING → CAPTIONS → QA → FORMAT CONVERSION → THUMBNAIL →
SOCIAL CONTENT → READY`. Veröffentlichung bleibt bis zur expliziten
Nutzerfreigabe gesperrt.

## 2. Grundprinzipien (bindend für alle folgenden WPs)

- **Provider-Unabhängigkeit**: kein KI-Modell wird fest verdrahtet. Jeder
  Provider (Video, Bild, Stimme, Musik, Avatar, LLM, Publishing) wird über ein
  Adapter-Interface unter `/providers/<kategorie>/` angebunden.
- **Mock-First**: `MOCK_MODE=true` muss von Anfang an die komplette Pipeline
  ohne externe API-Aufrufe und ohne Kosten durchlaufen lassen. Provider-
  Interfaces und Mock-Implementierungen entstehen daher parallel (WP06/WP08),
  bevor irgendein echter Provider angebunden wird (WP09+).
- **Kein Secret im Code**: API-Keys ausschließlich über `.env` /
  `.env.example`, `.env` in `.gitignore`. Der Master-Agent selbst soll wo
  möglich keine Rohkeys sehen (sichere Provider-Schicht dazwischen).
- **Kostenkontrolle vor Ausführung**: die Cost Engine schätzt Kosten *vor*
  kostenpflichtigen Aufrufen und blockiert bei Überschreitung eines
  konfigurierbaren Limits, bis der Nutzer bestätigt.
- **Freigabe vor Veröffentlichung**: Publishing-Adapter werden implementiert,
  aber nicht aktiv geschaltet, bis der Nutzer im Approval-System explizit
  "APPROVE" wählt.
- **Kleine, geprüfte Schritte**: pro Work Package gilt Implementieren →
  Testen → Fehler beheben → Dokumentieren → Status melden (Spezifikation
  Abschnitt 47). Keine mehreren großen Pakete gleichzeitig ungeprüft.

## 3. Zielverzeichnisstruktur (Vorschlag, wird in WP02 verfeinert)

```
/agents/
    master_agent.py
    creative_director_agent.py
    script_agent.py
    storyboard_agent.py
    visual_agent.py
    video_agent.py
    image_agent.py
    avatar_agent.py
    voice_agent.py
    music_agent.py
    sound_fx_agent.py
    editor_agent.py
    caption_agent.py
    translation_dubbing_agent.py
    format_agent.py
    thumbnail_agent.py
    qa_agent.py
    cost_agent.py
    publishing_agent.py
    analytics_agent.py

/providers/
    video/
    image/
    voice/
    music/
    avatar/
    llm/
    publishing/

/router/
    model_router.py

/editor/
    ffmpeg_engine.py

/api/
    (Backend-Endpunkte für Dashboard-Kommunikation)

/frontend/
    (Dashboard: Eingabe, Produktionsmonitor, Preview, Approval)

/projects/videos/
    project-XXX/
        project.json
        script/
        storyboard/
        assets/{images,video,logos}/
        audio/{voice,music,sfx}/
        subtitles/
        renders/{master,youtube,shorts,reels,tiktok}.mp4
        thumbnails/
        metadata/
        logs/

/tests/

.env.example
.gitignore
requirements.txt
package.json
docker-compose.yml (optional, WP-übergreifend wenn sinnvoll)
INSTALLIEREN.ps1
S58-MEDIA-STARTEN.cmd
S58-MEDIA-TESTEN.cmd (optional)
README.md
ARCHITECTURE.md
INSTALLATION.md
```

Diese Struktur ist ein Vorschlag für WP02 (Core-Datenmodelle) und WP03
(Master Agent) — sie wird beim tatsächlichen Bau ggf. präzisiert, aber nicht
mehr grundsätzlich verändert, um Rework zu vermeiden.

## 4. Kernschnittstellen (Vorschau, Definition folgt in WP06/WP07)

Aus der Spezifikation übernommene Mindest-Interfaces:

```python
class VideoProvider:
    def text_to_video(self, prompt, settings): raise NotImplementedError
    def image_to_video(self, image, prompt, settings): raise NotImplementedError
    def extend_video(self, video, settings): raise NotImplementedError

class VoiceProvider:
    def text_to_speech(self, text, voice, settings): raise NotImplementedError
```

Analog für `ImageProvider`, `AvatarProvider`, `MusicProvider`,
`PublishingProvider`. Jeder Agent-Fehler folgt dem einheitlichen Format:

```json
{"status": "error", "agent": "video_agent", "message": "", "retryable": true}
```

## 5. Work-Package-Plan WP02–WP20

| WP | Inhalt | Abhängig von | Ergebnis |
|---|---|---|---|
| WP02 | Core-Datenmodelle (User, Project, Scene, Asset, Provider Usage, Costs, Voice Profile, Brand Profile, Video Version, Publishing Job, QA Result) | WP01 | Datenmodell + Migrationen |
| WP03 | Master Agent (Orchestrator-Grundgerüst, Statusverwaltung, Logging) | WP02 | lauffähiger Master Agent ohne echte Sub-Agenten-Logik |
| WP04 | Script Agent (Hook/Intro/Hauptbotschaft/Story/CTA/Outro) | WP03 | Skriptgenerierung (zunächst gegen Mock-LLM) |
| WP05 | Storyboard Agent (Szenenzerlegung gemäß Szenen-Schema) | WP04 | strukturierte Storyboard-JSON |
| WP06 | Provider-Interfaces (Video/Image/Voice/Music/Avatar/LLM/Publishing) | WP02 | abstrakte Basisklassen, keine Implementierung |
| WP07 | AI Model Router (Auswahl nach Qualität/Geschwindigkeit/Kosten/Aufgabe/Verfügbarkeit) | WP06 | Router-Logik inkl. FREE/BALANCED/QUALITY Mode |
| WP08 | Mock-Provider für alle Kategorien | WP06 | vollständiger `MOCK_MODE` |
| WP09 | Video-Provider-Adapter (echte Anbieter, erst nach Prüfung aktueller APIs) | WP07, WP08 | mind. ein realer Adapter hinter Feature-Flag |
| WP10 | Voice-Provider-Adapter | WP07, WP08 | TTS-Anbindung |
| WP11 | Music Engine (inkl. Lizenzinfo-Speicherung, Mixing unter Voiceover) | WP07, WP08 | Musikauswahl + Mischung |
| WP12 | FFmpeg Editor Engine (Schnitt, Übergänge, Audio-Mix, Text, Logo, Zoom, Crop, Scale, Render) | WP09–WP11 | programmatischer Editor |
| WP13 | Caption Engine (SRT/VTT/ASS, Social Captions, Sync) | WP12 | synchronisierte Untertitel |
| WP14 | Format Engine (16:9/9:16/1:1, Reframing mit Bildbereich-Erhalt) | WP12 | Multi-Format-Export |
| WP15 | Thumbnail Engine (mehrere Varianten, Benutzerauswahl) | WP14 | Thumbnail-Set |
| WP16 | QA Engine (alle in Abschnitt 22 gelisteten Prüfungen, "QA FAILED" blockiert Veröffentlichung) | WP12–WP15 | automatisierte Qualitätsprüfung |
| WP17 | Dashboard (Eingabe, Produktionsmonitor, Preview, Approval-System) | WP03–WP16 (zeigt deren Status) | nutzbares Frontend |
| WP18 | Cost Engine (Schätzung vor kostenpflichtigen Aufrufen, konfigurierbares Limit, "COST LIMIT REACHED") | WP07 | Kostenkontrolle |
| WP19 | Publishing-Adapter (YouTube, Shorts, Instagram, TikTok) — ohne aktive Auto-Veröffentlichung | WP16 (QA muss bestehen) | Adapter-Gerüst, standardmäßig gesperrt |
| WP20 | End-to-End-System (zunächst vollständig mit Mock-Providern) | alle vorherigen | durchgängiger Testlauf Input → Output |

## 6. Testkonzept (Vorschau für WP-übergreifend, konkretisiert je WP)

Gemäß Spezifikation Abschnitt 44/45: jeder Agent, der Router, jeder Provider-
Typ, Editor, Caption, Format Converter, Cost Engine und QA erhalten eigene
Tests; zusätzlich ein End-to-End-Test, der ausschließlich mit Mock-Providern
läuft (keine API-Kosten). Dieser E2E-Test ist Teil von WP20, aber die dafür
nötige Mock-Infrastruktur entsteht bereits in WP08, damit spätere WPs
inkrementell gegen sie getestet werden können.

## 7. Offene Entscheidungen für den Nutzer (vor WP02 zu klären oder als
   Annahme zu bestätigen)

- **Sprache/Framework-Wahl Backend**: Spezifikation nennt `requirements.txt`
  (→ Python) und `package.json` (→ Node) gleichzeitig; Vorschlag: Python-
  Backend (FastAPI) für Agenten/Provider/Editor-Logik, Node-basiertes
  Frontend für das Dashboard. Wird in WP02/WP03 verbindlich, falls keine
  andere Präferenz genannt wird.
- **Konkrete Provider**: Spezifikation nennt Beispiele (Runway, Veo, Kling)
  ausdrücklich unverbindlich ("Diese Namen sind Beispiele... nicht behaupten,
  dass ein Provider verfügbar ist, bevor dessen aktuelle API und Bedingungen
  geprüft wurden"). Auswahl konkreter Erstanbieter erfolgt frühestens in
  WP09/WP10, nach Prüfung von Verfügbarkeit, Kosten und Nutzungsbedingungen.
- **Docker**: Abschnitt 40 sagt "wenn sinnvoll" — Entscheidung wird
  zurückgestellt, bis Backend/Frontend/Worker-Aufteilung aus WP03/WP12/WP17
  feststeht.

## 8. Status

Dieses Dokument schließt **WORK PACKAGE 01** ab. Es wurde ausschließlich
geplant und dokumentiert. Es wartet auf ausdrückliche Freigabe für
**WORK PACKAGE 02 — Core-Datenmodelle**, bevor Implementierungsarbeit
beginnt.
