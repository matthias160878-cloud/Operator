import { randomBytes, createHash } from "crypto";

export interface OAuthTokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds?: number;
  /** Konto-ID, die manche Anbieter direkt im Token-Tausch liefern (TikTok Business: open_id). */
  accountId?: string;
}

export interface OAuthAccountInfo {
  name: string;
  externalId?: string;
  /**
   * Manche Plattformen (Facebook) verlangen für das eigentliche Posten
   * einen anderen Token als den ursprünglichen Nutzer-Zugangstoken (hier:
   * einen Seiten-Token). Wenn gesetzt, wird DIESER statt des Original-
   * Tokens verschlüsselt gespeichert.
   */
  overrideAccessToken?: string;
}

export interface OAuthProvider {
  platform: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  /** Zusätzliche Query-Parameter für die Autorisierungs-URL (z.B. offline-Zugriff bei Google). */
  extraAuthParams?: Record<string, string>;
  usesPkce?: boolean;
  /** Kodierung der PKCE-Challenge: Standard base64url (RFC 7636), TikTok verlangt hex. */
  pkceEncoding?: "base64url" | "hex";
  /** Ruft nach dem Token-Tausch grundlegende Kontoinformationen ab (Anzeigename). */
  fetchAccountInfo: (accessToken: string, token: OAuthTokenResult) => Promise<OAuthAccountInfo>;
  /**
   * "messaging": Zusatzverbindung nur für den Posteingang (eigene App beim
   * Anbieter); die Tokens landen in den messaging*-Feldern des
   * PlatformAccount von `platform`, die Veröffentlichungs-Verbindung bleibt
   * unberührt.
   */
  target?: "publishing" | "messaging";
  /**
   * Name des Client-ID-Parameters in Autorisierungs-URL, Token-Tausch und
   * Token-Erneuerung (Standard: client_id; TikTok: client_key).
   */
  clientIdParam?: string;
  /** Eigener Token-Tausch für Anbieter, die vom OAuth-2-Standard abweichen. */
  exchangeCode?: (code: string, redirectUri: string) => Promise<OAuthTokenResult>;
  /** Eigene Token-Erneuerung für Anbieter, die vom OAuth-2-Standard abweichen. */
  refresh?: (refreshToken: string) => Promise<OAuthTokenResult>;
  /**
   * Hinweis auf zusätzliche, außerhalb dieser Software liegende Freigaben,
   * die der jeweilige Anbieter für echtes Veröffentlichen verlangt (z.B.
   * App-Review). Wird ehrlich in der UI angezeigt statt verschwiegen.
   */
  publishingCaveat?: string;
}

function randomState(): string {
  return randomBytes(24).toString("base64url");
}

export function generatePkcePair(encoding: "base64url" | "hex" = "base64url") {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest(encoding);
  return { verifier, challenge };
}

async function jsonOrThrow(res: Response, context: string) {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${context}: ungültige Antwort (${res.status}).`);
  }
  if (!res.ok) {
    throw new Error(`${context} fehlgeschlagen (${res.status}): ${text.slice(0, 300)}`);
  }
  return data;
}

export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  YOUTUBE: {
    platform: "YOUTUBE",
    clientIdEnv: "YOUTUBE_CLIENT_ID",
    clientSecretEnv: "YOUTUBE_CLIENT_SECRET",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope:
      "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl",
    extraAuthParams: { access_type: "offline", prompt: "consent" },
    async fetchAccountInfo(accessToken) {
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = (await jsonOrThrow(res, "YouTube-Kanalabruf")) as {
        items?: { id: string; snippet?: { title?: string } }[];
      };
      const channel = data.items?.[0];
      return { name: channel?.snippet?.title ?? "YouTube-Kanal", externalId: channel?.id };
    },
  },
  FACEBOOK: {
    platform: "FACEBOOK",
    clientIdEnv: "FACEBOOK_APP_ID",
    clientSecretEnv: "FACEBOOK_APP_SECRET",
    authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scope:
      "pages_show_list,pages_manage_posts,pages_read_engagement,pages_read_user_content,pages_manage_engagement,pages_messaging",
    publishingCaveat:
      "Für echtes Veröffentlichen auf verbundenen Facebook-Seiten muss die App bei Meta zusätzlich zur Prüfung (App Review) eingereicht werden — das ist ein separater Schritt bei Meta, den diese Software nicht ersetzt. Facebook postet immer über eine Seite, nicht über das persönliche Profil; falls mehrere Seiten verwaltet werden, wird automatisch die erste verbunden. Der Seiten-Zugangstoken läuft nicht automatisch ab, ein Refresh ist hier nicht nötig. Für Antworten auf Kommentare und Messenger-Nachrichten verlangt Meta außerdem die Freigabe von pages_manage_engagement bzw. pages_messaging; Messenger-Antworten sind nur innerhalb von 24 Stunden nach der letzten Nachricht des Kunden erlaubt.",
    async fetchAccountInfo(accessToken) {
      const res = await fetch(
        `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(accessToken)}`
      );
      const data = (await jsonOrThrow(res, "Facebook-Seiten-Abruf")) as {
        data?: { id: string; name: string; access_token: string }[];
      };
      const page = data.data?.[0];
      if (!page) {
        throw new Error(
          "Keine Facebook-Seite gefunden, die du verwalten kannst. Lege zuerst eine Facebook-Seite an und verbinde sie mit deinem Konto, bevor du hier verbindest."
        );
      }
      return { name: page.name, externalId: page.id, overrideAccessToken: page.access_token };
    },
  },
  INSTAGRAM: {
    platform: "INSTAGRAM",
    clientIdEnv: "INSTAGRAM_CLIENT_ID",
    clientSecretEnv: "INSTAGRAM_CLIENT_SECRET",
    authorizeUrl: "https://www.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    scope:
      "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages",
    publishingCaveat:
      "Setzt ein verknüpftes Instagram-Business- oder Creator-Konto voraus. Für echtes Veröffentlichen prüft Meta die App zusätzlich (App Review) — ein separater Schritt bei Meta. Das gilt auch für Antworten auf Kommentare und Direktnachrichten (instagram_business_manage_comments/_messages); DM-Antworten sind nur innerhalb von 24 Stunden nach der letzten Kundennachricht erlaubt.",
    async fetchAccountInfo(accessToken) {
      const res = await fetch(
        `https://graph.instagram.com/me?fields=username&access_token=${encodeURIComponent(accessToken)}`
      );
      const data = (await jsonOrThrow(res, "Instagram-Profilabruf")) as {
        id: string;
        username?: string;
      };
      return { name: data.username ? `@${data.username}` : "Instagram-Konto", externalId: data.id };
    },
  },
  LINKEDIN: {
    platform: "LINKEDIN",
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scope: "openid profile w_member_social",
    publishingCaveat:
      "LinkedIn-Zugangstoken laufen nach ca. 60 Tagen ab; ein automatisches Verlängern (Refresh) ist ohne separat von LinkedIn freigegebenen Zugriff nicht möglich — danach ist ein erneutes Verbinden nötig. Antworten auf Kommentare sind möglich, das automatische Abrufen von Kommentaren und Direktnachrichten erlaubt LinkedIn nur Partner-Apps — Kommentare müssen daher mit ihrer Kommentar-URN manuell angelegt werden.",
    async fetchAccountInfo(accessToken) {
      const res = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = (await jsonOrThrow(res, "LinkedIn-Profilabruf")) as { sub: string; name?: string };
      return { name: data.name ?? "LinkedIn-Konto", externalId: data.sub };
    },
  },
  TIKTOK: {
    platform: "TIKTOK",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
    clientSecretEnv: "TIKTOK_CLIENT_SECRET",
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scope: "user.info.basic,video.publish",
    usesPkce: true,
    pkceEncoding: "hex",
    clientIdParam: "client_key",
    publishingCaveat:
      "TikTok schaltet den Veröffentlichungs-Zugriff (video.publish) erst nach eigener Prüfung der App durch TikTok frei — das ist ein separater Freigabeprozess bei TikTok, den diese Software nicht ersetzt. Bis dahin funktioniert nur das Verbinden/Anzeigen des Kontos. Antworten auf Kommentare oder Direktnachrichten bietet TikTok für Drittanbieter-Apps derzeit nicht an.",
    async fetchAccountInfo(accessToken) {
      const res = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=display_name,open_id",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = (await jsonOrThrow(res, "TikTok-Profilabruf")) as {
        data?: { user?: { display_name?: string; open_id?: string } };
      };
      return {
        name: data.data?.user?.display_name ?? "TikTok-Konto",
        externalId: data.data?.user?.open_id,
      };
    },
  },
};

const TIKTOK_BUSINESS_API = "https://business-api.tiktok.com/open_api/v1.3";
const LINKEDIN_REST = "https://api.linkedin.com/rest";

export function linkedInRestHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": process.env.LINKEDIN_API_VERSION || "202609",
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };
}

/** TikTok-Business-Antworten: HTTP 200, Fehler stehen in `code` != 0. */
async function tiktokBusinessJson<T>(res: Response, context: string): Promise<T> {
  const data = (await jsonOrThrow(res, context)) as { code?: number; message?: string; data?: T };
  if (data.code !== undefined && data.code !== 0) {
    throw new Error(`${context} fehlgeschlagen (Code ${data.code}): ${data.message ?? "unbekannter Fehler"}`);
  }
  return (data.data ?? {}) as T;
}

type TikTokBusinessToken = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  open_id?: string;
};

function toTikTokTokenResult(data: TikTokBusinessToken, context: string, fallbackRefresh?: string): OAuthTokenResult {
  if (!data.access_token) throw new Error(`${context}: keine access_token in der Antwort erhalten.`);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? fallbackRefresh,
    expiresInSeconds: data.expires_in,
    accountId: data.open_id,
  };
}

/**
 * Zusatzverbindungen nur für den Posteingang. Beide Anbieter verlangen dafür
 * eine eigene, separat freigegebene App — daher eigene Zugangsdaten.
 */
export const MESSAGING_PROVIDERS: Record<string, OAuthProvider> = {
  TIKTOK_BUSINESS: {
    platform: "TIKTOK",
    target: "messaging",
    clientIdEnv: "TIKTOK_BUSINESS_APP_ID",
    clientSecretEnv: "TIKTOK_BUSINESS_APP_SECRET",
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    clientIdParam: "client_key",
    tokenUrl: `${TIKTOK_BUSINESS_API}/tt_user/oauth2/token/`,
    scope: "user.info.basic,video.list,comment.list,comment.list.manage",
    publishingCaveat:
      "Kommentare abrufen und beantworten läuft über die Accounts API der TikTok API for Business: eigene Developer-App im TikTok-for-Business-Portal mit freigegebenen Berechtigungen video.list, comment.list und comment.list.manage, verbunden mit einem TikTok-Business-Konto. Direktnachrichten (Business Messaging API) verlangen eine zusätzliche Zugangsprüfung durch TikTok und sind hier nicht angebunden.",
    async exchangeCode(code, redirectUri) {
      const res = await fetch(`${TIKTOK_BUSINESS_API}/tt_user/oauth2/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.TIKTOK_BUSINESS_APP_ID ?? "",
          client_secret: process.env.TIKTOK_BUSINESS_APP_SECRET ?? "",
          grant_type: "authorization_code",
          auth_code: code,
          redirect_uri: redirectUri,
        }),
      });
      return toTikTokTokenResult(await tiktokBusinessJson<TikTokBusinessToken>(res, "TikTok-Business-Token-Tausch"), "TikTok-Business-Token-Tausch");
    },
    async refresh(refreshToken) {
      const res = await fetch(`${TIKTOK_BUSINESS_API}/tt_user/oauth2/refresh_token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.TIKTOK_BUSINESS_APP_ID ?? "",
          client_secret: process.env.TIKTOK_BUSINESS_APP_SECRET ?? "",
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });
      return toTikTokTokenResult(
        await tiktokBusinessJson<TikTokBusinessToken>(res, "TikTok-Business-Token-Erneuerung"),
        "TikTok-Business-Token-Erneuerung",
        refreshToken
      );
    },
    async fetchAccountInfo(accessToken, token) {
      if (!token.accountId) throw new Error("TikTok lieferte keine open_id für das Business-Konto.");
      let name = "TikTok-Business-Konto";
      try {
        const params = new URLSearchParams({
          business_id: token.accountId,
          fields: JSON.stringify(["username", "display_name"]),
        });
        const res = await fetch(`${TIKTOK_BUSINESS_API}/business/get/?${params}`, {
          headers: { "Access-Token": accessToken },
        });
        const data = await tiktokBusinessJson<{ username?: string; display_name?: string }>(res, "TikTok-Profilabruf");
        name = data.username ? `@${data.username}` : data.display_name ?? name;
      } catch {
        // Anzeigename ist optional — die Verbindung funktioniert auch ohne.
      }
      return { name, externalId: token.accountId };
    },
  },
  LINKEDIN_PAGE: {
    platform: "LINKEDIN",
    target: "messaging",
    clientIdEnv: "LINKEDIN_PAGE_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_PAGE_CLIENT_SECRET",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scope:
      process.env.LINKEDIN_PAGE_SCOPE ||
      "rw_organization_admin r_organization_social w_organization_social r_organization_social_feed w_organization_social_feed",
    publishingCaveat:
      "Kommentare abrufen und beantworten geht bei LinkedIn nur für Unternehmensseiten über die Community Management API. LinkedIn verlangt dafür eine eigene App, auf der ausschließlich dieses Produkt beantragt und nach Prüfung freigegeben ist, sowie eine Administrator-Rolle auf der Seite. Kommentare auf persönlichen Profilen und Direktnachrichten gibt LinkedIn für Drittanbieter nicht frei.",
    async fetchAccountInfo(accessToken) {
      const res = await fetch(
        `${LINKEDIN_REST}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=10`,
        { headers: linkedInRestHeaders(accessToken) }
      );
      const data = (await jsonOrThrow(res, "LinkedIn-Seitenabruf")) as {
        elements?: { organization?: string; organizationTarget?: string }[];
      };
      const orgUrn = data.elements?.map((e) => e.organizationTarget ?? e.organization).find(Boolean);
      if (!orgUrn) {
        throw new Error("Keine LinkedIn-Unternehmensseite gefunden, auf der du Administrator bist.");
      }
      let name = "LinkedIn-Unternehmensseite";
      try {
        const orgId = orgUrn.split(":").pop();
        const orgRes = await fetch(`${LINKEDIN_REST}/organizations/${orgId}`, { headers: linkedInRestHeaders(accessToken) });
        const org = (await jsonOrThrow(orgRes, "LinkedIn-Seitenname")) as { localizedName?: string };
        if (org.localizedName) name = org.localizedName;
      } catch {
        // Anzeigename ist optional.
      }
      return { name, externalId: orgUrn };
    },
  },
};

/** Schlüssel der Posteingangs-Verbindung je Plattform (falls separat nötig). */
export const MESSAGING_PROVIDER_KEY: Partial<Record<string, string>> = {
  TIKTOK: "TIKTOK_BUSINESS",
  LINKEDIN: "LINKEDIN_PAGE",
};

export function getMessagingProvider(platform: string): OAuthProvider | null {
  const key = MESSAGING_PROVIDER_KEY[platform];
  return key ? MESSAGING_PROVIDERS[key] : null;
}

export function getProvider(platform: string): OAuthProvider | null {
  if (MESSAGING_PROVIDERS[platform]) return MESSAGING_PROVIDERS[platform];
  return OAUTH_PROVIDERS[platform] ?? null;
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  const id = process.env[provider.clientIdEnv];
  const secret = process.env[provider.clientSecretEnv];
  return Boolean(id && id.trim() && secret && secret.trim());
}

export { randomState };

export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
  pkceVerifier?: string
): Promise<OAuthTokenResult> {
  if (provider.exchangeCode) return provider.exchangeCode(code, redirectUri);
  const clientId = process.env[provider.clientIdEnv] ?? "";
  const clientSecret = process.env[provider.clientSecretEnv] ?? "";

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    [provider.clientIdParam ?? "client_id"]: clientId,
    client_secret: clientSecret,
  });
  if (pkceVerifier) body.set("code_verifier", pkceVerifier);

  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await jsonOrThrow(res, `${provider.platform}-Token-Tausch`)) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (data.error) {
    throw new Error(
      `${provider.platform}-Token-Tausch fehlgeschlagen: ${data.error_description || data.error}`
    );
  }
  if (!data.access_token) {
    throw new Error(`${provider.platform}: keine access_token in der Antwort erhalten.`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresInSeconds: data.expires_in,
  };
}

/**
 * Erneuert einen abgelaufenen Zugangstoken über den Refresh-Token. Nur
 * Google (YouTube) und TikTok geben zuverlässig einen Refresh-Token
 * zurück, siehe jeweiliges publishingCaveat der anderen Plattformen.
 */
export async function refreshAccessToken(
  provider: OAuthProvider,
  refreshToken: string
): Promise<OAuthTokenResult> {
  if (provider.refresh) return provider.refresh(refreshToken);
  const clientId = process.env[provider.clientIdEnv] ?? "";
  const clientSecret = process.env[provider.clientSecretEnv] ?? "";
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    [provider.clientIdParam ?? "client_id"]: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await jsonOrThrow(res, `${provider.platform}-Token-Erneuerung`)) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (data.error) {
    throw new Error(
      `${provider.platform}-Token-Erneuerung fehlgeschlagen: ${data.error_description || data.error}`
    );
  }
  if (!data.access_token) {
    throw new Error(`${provider.platform}: Token-Erneuerung lieferte keinen access_token.`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresInSeconds: data.expires_in,
  };
}

export function buildAuthorizeUrl(
  provider: OAuthProvider,
  redirectUri: string,
  state: string,
  pkceChallenge?: string
): string {
  const clientId = process.env[provider.clientIdEnv] ?? "";
  const url = new URL(provider.authorizeUrl);
  url.searchParams.set(provider.clientIdParam ?? "client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", provider.scope);
  url.searchParams.set("state", state);
  for (const [key, value] of Object.entries(provider.extraAuthParams ?? {})) {
    url.searchParams.set(key, value);
  }
  if (provider.usesPkce && pkceChallenge) {
    url.searchParams.set("code_challenge", pkceChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}
