# Plattform-Zugänge beantragen (Veröffentlichen, Statistiken, Werbung)

Stand: 20.10.2026. Die App ist vorbereitet: Sobald die Zugangsdaten einer Plattform im Render-Dashboard
(Service → Environment) eingetragen sind, wird „Verbinden“ unter **Social Media** aktiv. Zugangsdaten nie per
Chat oder E-Mail weitergeben – nur direkt in Render eintragen.

Weiterleitungsadresse (Redirect-URI), die bei jeder Plattform eingetragen werden muss:
`https://<APP-ADRESSE>/api/oauth/<PLATTFORM>/callback` – z. B. für Staging
`https://secret58-staging.onrender.com/api/oauth/YOUTUBE/callback` (PLATTFORM in Großbuchstaben:
YOUTUBE, FACEBOOK, INSTAGRAM, LINKEDIN, TIKTOK).

| Plattform | Wo beantragen | Variablen in Render | Freigabe durch die Plattform |
|---|---|---|---|
| YouTube | [Google Cloud Console](https://console.cloud.google.com/apis/credentials): Projekt anlegen, „YouTube Data API v3“ aktivieren, OAuth-Client (Webanwendung) | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` | OAuth-Zustimmungsbildschirm verifizieren lassen; ohne Prüfung (Audit) des API-Projekts landen Uploads als „privat“ |
| Facebook (Seiten) | [Meta for Developers](https://developers.facebook.com/apps/): App vom Typ „Business“ | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | App Review für `pages_manage_posts`, `pages_read_engagement`; Unternehmensverifizierung |
| Instagram | dieselbe Meta-App, Produkt „Instagram“ (Instagram-Login) | `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET` | App Review für `instagram_business_content_publish`; nur Business-/Creator-Konten |
| LinkedIn | [LinkedIn Developers](https://www.linkedin.com/developers/apps): App anlegen, Produkt „Share on LinkedIn“ | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | „Share on LinkedIn“ ist ohne Antrag nutzbar; Unternehmensseiten brauchen die Community Management API (Antrag) |
| TikTok | [TikTok for Developers](https://developers.tiktok.com/apps): App, Produkte „Login Kit“ und „Content Posting API“ | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` | Audit für Direct Post; bis dahin sind Beiträge nur privat sichtbar |

## Statistiken (Wiedergabedauer, Speicherungen usw.)
Derzeit **manuell**: Werte aus der Statistik der Plattform unter *Weiterempfehlungen → Kennzahlen* bzw. im
*Variantenvergleich* eintragen. Ein automatischer Abruf braucht zusätzliche Berechtigungen und eine erneute
Prüfung durch die Plattform (YouTube Analytics API `yt-analytics.readonly`; Meta `instagram_business_manage_insights`,
`read_insights`; LinkedIn Community Management API; TikTok `video.list`). Er wird erst gebaut, wenn die Zugänge oben
freigegeben sind – sonst wäre er nicht testbar.

## Werbung (Meta, Google Ads, LinkedIn, TikTok)
Derzeit: Planung, Freigabe mit bestätigtem Betrag und Export (CSV/JSON); die Kampagne legen Sie selbst im Werbekonto an.
Für einen direkten Start braucht es je Plattform eine eigene Freigabe:

| Plattform | Antrag |
|---|---|
| Meta | Marketing API: App Review für `ads_management`/`ads_read` (Advanced Access) und Unternehmensverifizierung |
| Google Ads | Developer Token im [Google-Ads-Verwaltungskonto](https://ads.google.com/aw/apicenter), mindestens „Basic Access“ |
| LinkedIn | Antrag auf die Advertising API im LinkedIn-Developer-Portal |
| TikTok | TikTok API for Business: Entwickler-Freigabe beantragen |

Bis zur Freigabe bleibt „Kampagne starten“ gesperrt. Es wird nichts automatisch ausgegeben.

## Richtlinien, die die App bereits einhält
- Nur offizielle Schnittstellen, keine Bots, kein automatisches Folgen, Liken, Kommentieren oder Massen-Nachrichten.
- Veröffentlicht wird nur nach Freigabe; doppelte Veröffentlichungen sind gesperrt; alles ist pausierbar.
- KI-Videos werden gekennzeichnet (YouTube `containsSyntheticMedia`, TikTok `is_aigc`); TikTok-Beiträge ohne bezahlte Partnerschaft (`brand_content_toggle: false`).
- Offen für TikTok-Audit: Auswahl der Sichtbarkeit aus `creator_info` und Einwilligungshinweis vor dem Posten in der Oberfläche (bis dahin wird privat veröffentlicht).
