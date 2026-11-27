import type {
  IntegrationDefinition,
  IntegrationStatusResult,
  IntegrationTranslator,
} from "@/lib/integrations/types";

export function envPresent(key: string): boolean {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

/**
 * Leichter Live-Check: ein GET auf einen Endpunkt, der nur mit gültigem
 * Schlüssel 2xx liefert. Gibt niemals Antwortinhalte oder Schlüssel weiter.
 */
function pingVerify(
  service: string,
  url: string,
  headers: () => Record<string, string>
): IntegrationDefinition["verify"] {
  return async (t) => {
    try {
      const res = await withTimeout(fetch(url, { headers: headers(), cache: "no-store" }), 4000);
      if (res.ok) return { ok: true };
      return { ok: false, message: t("verifyFailedStatus", { service, status: res.status }) };
    } catch {
      return { ok: false, message: t("verifyUnreachable", { service }) };
    }
  };
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    key: "anthropic",
    name: "Anthropic",
    category: "AI",
    requiredEnv: ["ANTHROPIC_API_KEY"],
    verify: pingVerify("Anthropic", "https://api.anthropic.com/v1/models?limit=1", () => ({
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    })),
  },
  {
    key: "openai",
    name: "OpenAI",
    category: "AI",
    requiredEnv: ["OPENAI_API_KEY"],
    verify: pingVerify("OpenAI", "https://api.openai.com/v1/models", () => ({
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    })),
  },
  {
    key: "elevenlabs",
    name: "ElevenLabs",
    category: "VOICE",
    requiredEnv: ["ELEVENLABS_API_KEY"],
    verify: pingVerify("ElevenLabs", "https://api.elevenlabs.io/v1/user", () => ({
      "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
    })),
  },
  {
    key: "youtube",
    oauthPlatforms: ["YOUTUBE"],
    name: "YouTube",
    category: "PLATFORM",
    requiredEnv: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"],
  },
  {
    key: "instagram",
    oauthPlatforms: ["INSTAGRAM"],
    name: "Instagram",
    category: "PLATFORM",
    requiredEnv: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"],
  },
  {
    key: "tiktok",
    oauthPlatforms: ["TIKTOK", "TIKTOK_BUSINESS"],
    name: "TikTok",
    category: "PLATFORM",
    requiredEnv: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  },
  {
    key: "linkedin",
    oauthPlatforms: ["LINKEDIN", "LINKEDIN_PAGE"],
    name: "LinkedIn",
    category: "PLATFORM",
    requiredEnv: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  },
  {
    key: "facebook",
    oauthPlatforms: ["FACEBOOK"],
    name: "Facebook",
    category: "PLATFORM",
    requiredEnv: ["FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET"],
  },
  {
    key: "canva",
    name: "Canva",
    category: "DESIGN",
    requiredEnv: ["CANVA_API_KEY"],
  },
  {
    key: "capcut",
    name: "CapCut",
    category: "VIDEO",
    requiredEnv: ["CAPCUT_API_KEY"],
  },
  {
    key: "trend",
    name: "Trend-Datenquelle",
    category: "TREND",
    requiredEnv: ["TREND_API_KEY", "TREND_API_PROVIDER"],
  },
];

export async function checkIntegration(
  def: IntegrationDefinition,
  t: IntegrationTranslator
): Promise<IntegrationStatusResult> {
  const missing = def.requiredEnv.filter((key) => !envPresent(key));

  if (missing.length > 0) {
    return {
      key: def.key,
      name: def.name,
      category: def.category,
      status: "NOT_CONFIGURED",
      message: t("notConfigured", { vars: missing.join(", ") }),
      requiredEnv: def.requiredEnv,
    };
  }

  if (def.verify) {
    const result = await def.verify(t);
    if (!result.ok) {
      return {
        key: def.key,
        name: def.name,
        category: def.category,
        status: "ERROR",
        message: result.message ?? t("verifyFailedGeneric"),
        requiredEnv: def.requiredEnv,
      };
    }
  }

  return {
    key: def.key,
    name: def.name,
    category: def.category,
    status: "CONNECTED",
    message: t("connected"),
    requiredEnv: def.requiredEnv,
  };
}

export async function getAllIntegrationStatuses(
  t: IntegrationTranslator
): Promise<IntegrationStatusResult[]> {
  return Promise.all(INTEGRATIONS.map((def) => checkIntegration(def, t)));
}
