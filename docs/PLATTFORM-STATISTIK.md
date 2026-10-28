# Plattformzahlen automatisch abrufen

Stand 26.10.2026. Code: `src/lib/statistik/abruf.ts`, Test: `tests/statistik.test.ts`.

## Was schon automatisch läuft

Die App liest die Zahlen von Beiträgen, die **über die App veröffentlicht** wurden. Sie
schaut stündlich nach und fragt jeden Beitrag höchstens alle sechs Stunden ab, bis 90 Tage
nach der Veröffentlichung. Sie liest nur, auf der Plattform wird nichts verändert.

| Plattform | Zahlen | Voraussetzung |
|---|---|---|
| YouTube | Aufrufe, Likes, Kommentare je Video | Kanal unter „Social Media“ verbunden (Zugriff `youtube.readonly` ist schon dabei) |
| Facebook-Seite | Reaktionen, Kommentare, Teilungen je Beitrag | Seite verbunden (`pages_read_engagement` ist schon dabei) |
| Instagram | vorbereitet: Aufrufe, Reichweite, Likes, Kommentare, Teilungen, Speicherungen | Freigabe durch Meta, siehe unten |
| TikTok | vorbereitet: Aufrufe, Likes, Kommentare, Teilungen | Freigabe durch TikTok, siehe unten |
| LinkedIn | vorbereitet: Likes, Kommentare | LinkedIn gibt Beitragszahlen nur an geprüfte Partner frei |

Wohin die Zahlen gehen:

- **Dashboard, Analytics, Wachstum**: ein Eintrag je Beitrag. Er wird aktualisiert, nicht
  aufaddiert (Quelle `API:YouTube` usw.).
- **Weiterempfehlungen**: Videoaufrufe und Teilungen je Kampagne und Plattform, wenn der
  Beitrag aus dem Reichweitenaufbau dieser Kampagne stammt.
- **Variantenvergleich**: Aufrufe, Weiterleitungen und Gespeichert, wenn eine Variante mit dem
  Beitrag verknüpft ist.
- Werte, die von Hand eingetragen wurden, bleiben erhalten. Von Hand eintragen geht weiter,
  zum Beispiel für Beiträge, die nicht über die App veröffentlicht wurden.

Abschalten: Umgebungsvariable `STATISTIK_ABRUF=0`. Der Abruf läuft im Webdienst mit und ist
unabhängig vom Versand-Worker. Schläft der Dienst (Render-Gratistarif), holt er den Abruf
beim Aufwachen nach.

## Freigaben beantragen (macht der Betreiber)

Nach jeder Freigabe den Schalter in Render setzen (Dienst → Environment). Danach müssen die
Kunden das Konto **einmal neu verbinden**, damit der neue Zugriff mit angefragt wird.

1. **Instagram (Meta)**: Im Meta-Entwicklerportal für die App die Berechtigung
   `instagram_business_manage_insights` im App Review beantragen. Begründung: „Die App zeigt
   Kunden die Statistik ihrer eigenen, über die App veröffentlichten Reels.“ Nach der Freigabe
   `STATISTIK_INSTAGRAM=1` setzen.
2. **Facebook-Impressionen und -Reichweite (Meta)**: `read_insights` beantragen. Dafür ist im
   Code noch ein kleiner Zusatz nötig; Reaktionen, Kommentare und Teilungen laufen schon jetzt.
3. **TikTok**: Im TikTok-Entwicklerportal den Zugriff `video.list` (Display API) beantragen.
   Nach der Freigabe `STATISTIK_TIKTOK=1` setzen.
4. **LinkedIn**: `r_member_social` gibt LinkedIn nur an geprüfte Partner (Community
   Management API) heraus. Erst nach einer Partnerfreigabe `STATISTIK_LINKEDIN=1` setzen.

Ohne den jeweiligen Schalter wird die Plattform nicht abgefragt und auch kein zusätzlicher
Zugriff bei der Anmeldung angefordert. So bricht das Verbinden nicht ab, solange die Freigabe
fehlt.
