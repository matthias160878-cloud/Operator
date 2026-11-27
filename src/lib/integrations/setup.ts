import { INTEGRATIONS, checkIntegration, envPresent } from "@/lib/integrations/registry";
import type { IntegrationDefinition, IntegrationTranslator } from "@/lib/integrations/types";
import { getProvider } from "@/lib/oauth/providers";
import { isTokenEncryptionConfigured } from "@/lib/crypto";

/** Eine Umgebungsvariable im Setup-Assistenten — nur Name und ob sie gesetzt ist, nie der Wert. */
export interface SetupEnvVar {
  name: string;
  set: boolean;
  /** Nur für die Posteingangs-Zusatz-App (TikTok/LinkedIn) nötig. */
  optional: boolean;
}

export interface SetupRedirect {
  /** OAuth-Schlüssel, z. B. YOUTUBE oder TIKTOK_BUSINESS. */
  platformKey: string;
  url: string;
  /** true = zweite Verbindung nur für den Posteingang. */
  messaging: boolean;
}

export interface SetupGuide {
  key: string;
  envVars: SetupEnvVar[];
  redirects: SetupRedirect[];
  /** true bei OAuth-Plattformen: Verbinden braucht zusätzlich TOKEN_ENCRYPTION_KEY. */
  needsEncryptionKey: boolean;
  encryptionKeySet: boolean;
  /** true, wenn „Verbindung prüfen“ einen echten Aufruf beim Anbieter macht. */
  liveCheck: boolean;
}

export function getIntegrationDefinition(key: string): IntegrationDefinition | null {
  return INTEGRATIONS.find((def) => def.key === key) ?? null;
}

/** Callback-URL, die der Anbieter für diese Plattform und diese Domain kennen muss. */
export function buildRedirectUri(origin: string, platformKey: string): string {
  return `${origin.replace(/\/+$/, "")}/api/oauth/${platformKey}/callback`;
}

/**
 * Stellt für eine Integration zusammen, was zum Einrichten fehlt: Variablen
 * (mit Status), Redirect-URLs für die aktuelle Domain und ob ein Live-Check
 * möglich ist. Liefert niemals Werte von Secrets.
 */
export function buildSetupGuide(def: IntegrationDefinition, origin: string): SetupGuide {
  const envVars: SetupEnvVar[] = def.requiredEnv.map((name) => ({
    name,
    set: envPresent(name),
    optional: false,
  }));
  const redirects: SetupRedirect[] = [];
  const oauthPlatforms = def.oauthPlatforms ?? [];

  for (const platformKey of oauthPlatforms) {
    const provider = getProvider(platformKey);
    if (!provider) continue;
    const messaging = provider.target === "messaging";
    redirects.push({ platformKey, url: buildRedirectUri(origin, platformKey), messaging });
    for (const name of [provider.clientIdEnv, provider.clientSecretEnv]) {
      if (!envVars.some((v) => v.name === name)) {
        envVars.push({ name, set: envPresent(name), optional: messaging });
      }
    }
  }

  const needsEncryptionKey = oauthPlatforms.length > 0;
  if (needsEncryptionKey) {
    envVars.push({ name: "TOKEN_ENCRYPTION_KEY", set: isTokenEncryptionConfigured(), optional: false });
  }

  return {
    key: def.key,
    envVars,
    redirects,
    needsEncryptionKey,
    encryptionKeySet: isTokenEncryptionConfigured(),
    liveCheck: Boolean(def.verify),
  };
}

export interface VerifyResult {
  status: "CONNECTED" | "NOT_CONFIGURED" | "ERROR";
  message: string;
  /** false = nur Variablen geprüft, kein Aufruf beim Anbieter. */
  liveCheck: boolean;
}

/**
 * „Verbindung prüfen“: Variablen prüfen und, wo möglich, einen leichten
 * Aufruf beim Anbieter machen. Für OAuth-Plattformen gibt es keinen Test
 * ohne Nutzer-Login — dann wird ehrlich gemeldet, dass nur die Zugangsdaten
 * vorhanden sind.
 */
export async function verifyIntegration(
  def: IntegrationDefinition,
  t: IntegrationTranslator
): Promise<VerifyResult> {
  const result = await checkIntegration(def, t);
  const liveCheck = Boolean(def.verify);
  if (result.status === "CONNECTED" && !liveCheck) {
    const needsKey = (def.oauthPlatforms?.length ?? 0) > 0;
    if (needsKey && !isTokenEncryptionConfigured()) {
      return {
        status: "NOT_CONFIGURED",
        message: t("notConfigured", { vars: "TOKEN_ENCRYPTION_KEY" }),
        liveCheck,
      };
    }
    return {
      status: "CONNECTED",
      message: t(needsKey ? "credentialsPresentOauth" : "credentialsPresent"),
      liveCheck,
    };
  }
  return { status: result.status, message: result.message, liveCheck };
}
