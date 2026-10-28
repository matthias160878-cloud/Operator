---
name: maengelliste
description: Mängelliste Social Media KI abarbeiten und aktuell halten — offene Punkte prüfen, selbst Behebbares beheben, Rest mit klarem "Wer/Was nötig" ausweisen. Verwenden, wenn Matthias "offene Punkte", "Mängelliste" oder "auf den heutigen Stand" sagt.
---

# Mängelliste Social Media KI pflegen

Liste: claude.ai-Artifact `YUNLEC9GRZthPeGXBDhYEE` (privat). Quelle der Wahrheit für den Stand; nach jeder Änderung neu veröffentlichen (gleiche URL).

## Ablauf
1. Artifact lesen (`Artifact read`), Punkte nach „Wer“ sortieren.
2. Jeden Punkt mit „Ich“ oder „Zusammen“ prüfen und, wenn möglich, beheben: Code ändern, `npm run typecheck`, `npm test`, bei Seitenänderungen `npm run build && npm run test:integration`, committen, auf `claude/modest-fermat-ysdjp6` pushen, Staging per Render `trigger_deploy` ausliefern (immer `workspaceId` mitgeben), live prüfen.
3. Punkte mit „Du“ nicht anfassen, nur den Stand und das, was fehlt, aktuell halten.
4. Liste neu veröffentlichen: Zähler (offen / blockiert / erledigt) und „Heute erledigt“ nachziehen.

## Grenzen (verbindlich)
- Oberfläche und Inhalt der Hauptseite („Secret 58 Zentrale“, `Kha1HUHqEmbZLRgNErWC6Q`) und der Social-Media-KI nicht grob verändern; nur verbessern. Hauptseite nur auf ausdrückliche Anordnung ändern, sonst an Kopien.
- Keine echten Zahlungen, öffentlichen Veröffentlichungen, Social-Media-Posts oder Nachrichten ohne ausdrückliche Freigabe. Versand-Worker nicht ohne Freigabe einschalten.
- Keine Zugangsdaten, Preise, Rechtsangaben (Handelsregister, Gewerbe, Datenschutz) oder Anbindungen erfinden. Fehlendes als Demo / vorbereitet / noch nicht eingerichtet kennzeichnen.
- Domain secret58.com (IONOS) erst nach ausdrücklicher Freigabe umstellen.
- Schlüssel nur serverseitig; nie im Chat oder Repo ausgeben.

## Typische Prüfpunkte
- KI-Chat: Render-Log nach `[webchat]` durchsuchen (`list_logs`, `text: ["webchat"]`); Statuscode 400 → Guthaben/Modell (`ANTHROPIC_MODEL`), 401 → Schlüssel.
- Kauf: `/buy` zeigt Kauf nur bei Stripe + Webhook; nach Eintrag der Testwerte Testkauf mit Testkarte.
- Aktionscodes vor Aktionsbeginn (27.11., 16.12., 10.02.) im Betreiberbereich anlegen.
- Render free: Datenbank läuft am 09.11.2026 ab.
