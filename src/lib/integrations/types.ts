export type IntegrationCategory =
  | "AI"
  | "VOICE"
  | "PLATFORM"
  | "DESIGN"
  | "VIDEO"
  | "TREND";

export type IntegrationLiveStatus = "CONNECTED" | "NOT_CONFIGURED" | "ERROR";

export interface IntegrationStatusResult {
  key: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationLiveStatus;
  message: string;
  requiredEnv: string[];
}

export interface IntegrationDefinition {
  key: string;
  name: string;
  category: IntegrationCategory;
  requiredEnv: string[];
  /**
   * Optionaler Live-Check (z.B. ein leichter API-Ping). Wird nur ausgeführt,
   * wenn alle requiredEnv-Variablen gesetzt sind. Muss innerhalb kurzer Zeit
   * antworten und darf niemals Secrets in Fehlermeldungen zurückgeben.
   */
  verify?: () => Promise<{ ok: boolean; message?: string }>;
}
