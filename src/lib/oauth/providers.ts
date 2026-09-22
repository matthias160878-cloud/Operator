import { randomBytes, createHash } from "crypto";

export interface OAuthTokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds?: number;
}

export interface OAuthAccountInfo {
  name: string;
  externalId?: string;
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
  /** Ruft nach dem Token-Tausch grundlegende Kontoinformationen ab (Anzeigename). */
  fetchAccountInfo: (accessToken: string) => Promise<OAuthAccountInfo>;
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

export function generatePkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
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
    scope: "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload",
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
    scope: "pages_show_list,pages_manage_posts,pages_read_engagement",
    publishingCaveat:
      "Für echtes Veröffentlichen auf verbundenen Facebook-Seiten muss die App bei Meta zusätzlich zur Prüfung (App Review) eingereicht werden — das ist ein separater Schritt bei Meta, den diese Software nicht ersetzt.",
    async fetchAccountInfo(accessToken) {
      const res = await fetch(
        `https://graph.facebook.com/me?fields=name&access_token=${encodeURIComponent(accessToken)}`
      );
      const data = (await jsonOrThrow(res, "Facebook-Profilabruf")) as { id: string; name?: string };
      return { name: data.name ?? "Facebook-Konto", externalId: data.id };
    },
  },
  INSTAGRAM: {
    platform: "INSTAGRAM",
    clientIdEnv: "INSTAGRAM_CLIENT_ID",
    clientSecretEnv: "INSTAGRAM_CLIENT_SECRET",
    authorizeUrl: "https://www.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    scope: "instagram_business_basic,instagram_business_content_publish",
    publishingCaveat:
      "Setzt ein verknüpftes Instagram-Business- oder Creator-Konto voraus. Für echtes Veröffentlichen prüft Meta die App zusätzlich (App Review) — ein separater Schritt bei Meta.",
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
      "LinkedIn-Zugangstoken laufen nach ca. 60 Tagen ab; ein automatisches Verlängern (Refresh) ist ohne separat von LinkedIn freigegebenen Zugriff nicht möglich — danach ist ein erneutes Verbinden nötig.",
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
    publishingCaveat:
      "TikTok schaltet den Veröffentlichungs-Zugriff (video.publish) erst nach eigener Prüfung der App durch TikTok frei — das ist ein separater Freigabeprozess bei TikTok, den diese Software nicht ersetzt. Bis dahin funktioniert nur das Verbinden/Anzeigen des Kontos.",
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

export function getProvider(platform: string): OAuthProvider | null {
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
  const clientId = process.env[provider.clientIdEnv] ?? "";
  const clientSecret = process.env[provider.clientSecretEnv] ?? "";

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
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
  };
  if (!data.access_token) {
    throw new Error(`${provider.platform}: keine access_token in der Antwort erhalten.`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
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
  url.searchParams.set("client_id", clientId);
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
