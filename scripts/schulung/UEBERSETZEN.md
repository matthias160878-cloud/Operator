# Regeln für die Übersetzung der App-Texte

Quelle: `messages/de/*.json` (Deutsch, 24 Dateien), zweite Referenz `messages/en/*.json`.
Ziel: dieselben 24 Dateinamen in `messages/<code>/` (Ordner anlegen). Dateien mit Bash schreiben (Heredoc oder kurzes Python-Skript).

- JSON-Struktur und alle Schlüssel exakt wie im Deutschen. Nur Textwerte übersetzen. Listen bleiben Listen gleicher Länge. In `schulungVideos.json` ist `order` eine Liste von Kennungen: unverändert kopieren.
- Platzhalter und ICU-Syntax exakt erhalten: `{name}`, `{count}`, `{x, plural, one {...} other {...}}`. Nur den Text in den Zweigen übersetzen, nur die Schlüsselwörter one/other verwenden (kein few/many ergänzen). `<Tags>` und Zeilenumbrüche erhalten.
- Zahlen, Beträge, Währungen, Prozentwerte, URLs, E-Mail-Adressen und code-artige Token unverändert lassen.
- Namen nicht übersetzen: SECRET 58, Genesis, Brand DNA, Content Brain, Content Factory, Script Studio, Voice Studio, Video Studio, Design Studio, Composio, ElevenLabs, Stripe, Canva, CapCut, YouTube, TikTok, Instagram, LinkedIn, Facebook, X, Anthropic, OpenAI, Gemini, Resend, Render, Pro, Maxi, Agentennamen wie IdeaAgent oder MessageAgent. Alltagswörter (Einstellungen, Posteingang, Kalender, Einnahmen, Speichern, Abbrechen ...) übersetzen.
- Informelle Anrede (wie deutsches „du“), natürliche, knappe Oberflächensprache. Treu bleiben: keine Aussagen, Zusicherungen, Preise oder Rechtshinweise hinzufügen oder weglassen. Anführungszeichen nach der Konvention der Zielsprache.
- Gültiges UTF-8-JSON.
- Prüfen: `cd /home/user/Operator && node scripts/schulung/pruefen-sprachen.mjs <code>` und alle Fehler beheben, bis ein Häkchen erscheint. Keine Dateien außerhalb von `messages/<code>/` ändern.
