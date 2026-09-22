import type {
  IntegrationDefinition,
  IntegrationStatusResult,
} from "@/lib/integrations/types";

function envPresent(key: string): boolean {
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

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    key: "anthropic",
    name: "Anthropic",
    category: "AI",
    requiredEnv: ["ANTHROPIC_API_KEY"],
  },
  {
    key: "openai",
    name: "OpenAI",
    category: "AI",
    requiredEnv: ["OPENAI_API_KEY"],
  },
  {
    key: "elevenlabs",
    name: "ElevenLabs",
    category: "VOICE",
    requiredEnv: ["ELEVENLABS_API_KEY"],
    verify: async () => {
      try {
        const res = await withTimeout(
          fetch("https://api.elevenlabs.io/v1/user", {
            headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "" },
            cache: "no-store",
          }),
          4000
        );
        if (res.ok) return { ok: true };
        return {
          ok: false,
          message: `ElevenLabs antwortete mit Status ${res.status}.`,
        };
      } catch {
        return {
          ok: false,
          message: "ElevenLabs konnte nicht erreicht werden.",
        };
      }
    },
  },
  {
    key: "youtube",
    name: "YouTube",
    category: "PLATFORM",
    requiredEnv: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"],
  },
  {
    key: "instagram",
    name: "Instagram",
    category: "PLATFORM",
    requiredEnv: ["INSTAGRAM_CLIENT_ID", "INSTAGRAM_CLIENT_SECRET"],
  },
  {
    key: "tiktok",
    name: "TikTok",
    category: "PLATFORM",
    requiredEnv: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"],
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    category: "PLATFORM",
    requiredEnv: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  },
  {
    key: "facebook",
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
  def: IntegrationDefinition
): Promise<IntegrationStatusResult> {
  const missing = def.requiredEnv.filter((key) => !envPresent(key));

  if (missing.length > 0) {
    return {
      key: def.key,
      name: def.name,
      category: def.category,
      status: "NOT_CONFIGURED",
      message: `Nicht konfiguriert — fehlende Variable(n): ${missing.join(", ")}.`,
      requiredEnv: def.requiredEnv,
    };
  }

  if (def.verify) {
    const result = await def.verify();
    if (!result.ok) {
      return {
        key: def.key,
        name: def.name,
        category: def.category,
        status: "ERROR",
        message: result.message ?? "Verbindung fehlgeschlagen.",
        requiredEnv: def.requiredEnv,
      };
    }
  }

  return {
    key: def.key,
    name: def.name,
    category: def.category,
    status: "CONNECTED",
    message: "Verbunden.",
    requiredEnv: def.requiredEnv,
  };
}

export async function getAllIntegrationStatuses(): Promise<
  IntegrationStatusResult[]
> {
  return Promise.all(INTEGRATIONS.map((def) => checkIntegration(def)));
}
