/**
 * Plattformen, die sich zusätzlich zur nativen OAuth-Anbindung über Composio
 * verbinden lassen. Über Composio läuft in SECRET 58 ausschließlich ein
 * LESENDER Zugriffstest — veröffentlicht wird darüber nichts.
 *
 * Die Lese-Werkzeuge stammen aus der Composio-Toolkit-Dokumentation
 * (docs.composio.dev/toolkits/…, Stand 10.10.2026). Bestätigt dokumentiert:
 * INSTAGRAM_GET_USER_INFO, YOUTUBE_GET_CHANNEL_STATISTICS. Für LinkedIn und
 * Facebook ist der Werkzeugname vor dem ersten echten Test im
 * Composio-Dashboard zu prüfen; er lässt sich ohne Code-Änderung über
 * COMPOSIO_READ_TOOL_<TOOLKIT> überschreiben.
 */
export type ComposioToolkitKey = "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "YOUTUBE";

export interface ComposioToolkit {
  key: ComposioToolkitKey;
  /** Toolkit-Kennung bei Composio (klein geschrieben). */
  slug: string;
  label: string;
  /** Umgebungsvariable mit der Auth-Config-ID (ac_…) aus dem Composio-Dashboard. */
  authConfigEnv: string;
  readTool: string;
  readToolDocumented: boolean;
  readArguments: Record<string, unknown>;
}

export const COMPOSIO_TOOLKITS: ComposioToolkit[] = [
  {
    key: "INSTAGRAM",
    slug: "instagram",
    label: "Instagram",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_INSTAGRAM",
    readTool: "INSTAGRAM_GET_USER_INFO",
    readToolDocumented: true,
    readArguments: { ig_user_id: "me", fields: "id,username,account_type,media_count" },
  },
  {
    key: "FACEBOOK",
    slug: "facebook",
    label: "Facebook-Seite",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_FACEBOOK",
    readTool: "FACEBOOK_LIST_MANAGED_PAGES",
    readToolDocumented: false,
    readArguments: {},
  },
  {
    key: "LINKEDIN",
    slug: "linkedin",
    label: "LinkedIn",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_LINKEDIN",
    readTool: "LINKEDIN_GET_MY_INFO",
    readToolDocumented: false,
    readArguments: {},
  },
  {
    key: "YOUTUBE",
    slug: "youtube",
    label: "YouTube",
    authConfigEnv: "COMPOSIO_AUTH_CONFIG_YOUTUBE",
    readTool: "YOUTUBE_GET_CHANNEL_STATISTICS",
    readToolDocumented: true,
    readArguments: { mine: true, part: "snippet,statistics" },
  },
];

export function getComposioToolkit(key: string): ComposioToolkit | undefined {
  const upper = key.toUpperCase();
  return COMPOSIO_TOOLKITS.find((t) => t.key === upper);
}

export function readToolFor(toolkit: ComposioToolkit): string {
  const override = process.env[`COMPOSIO_READ_TOOL_${toolkit.key}`]?.trim();
  return override && /^[A-Z0-9_]{3,80}$/.test(override) ? override : toolkit.readTool;
}
