import { describe, expect, it, vi } from "vitest";
import { buildRedirectUri, buildSetupGuide, getIntegrationDefinition, verifyIntegration } from "@/lib/integrations/setup";
import { mockFetch, jsonResponse } from "../../../tests/helpers";

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

describe("Setup-Assistent", () => {
  it("baut die Redirect-URL ohne doppelten Schrägstrich", () => {
    expect(buildRedirectUri("https://app.example/", "YOUTUBE")).toBe(
      "https://app.example/api/oauth/YOUTUBE/callback"
    );
  });

  it("listet für TikTok beide Apps, markiert die Posteingangs-App als optional und verlangt den Token-Schlüssel", () => {
    vi.stubEnv("TIKTOK_CLIENT_KEY", "k");
    vi.stubEnv("TIKTOK_CLIENT_SECRET", "");
    vi.stubEnv("TIKTOK_BUSINESS_APP_ID", "");
    const guide = buildSetupGuide(getIntegrationDefinition("tiktok")!, "https://app.example");

    expect(guide.redirects.map((r) => [r.platformKey, r.messaging])).toEqual([
      ["TIKTOK", false],
      ["TIKTOK_BUSINESS", true],
    ]);
    const byName = Object.fromEntries(guide.envVars.map((v) => [v.name, v]));
    expect(byName.TIKTOK_CLIENT_KEY).toMatchObject({ set: true, optional: false });
    expect(byName.TIKTOK_CLIENT_SECRET).toMatchObject({ set: false, optional: false });
    expect(byName.TIKTOK_BUSINESS_APP_ID).toMatchObject({ set: false, optional: true });
    expect(byName.TOKEN_ENCRYPTION_KEY).toMatchObject({ set: true });
    expect(guide.needsEncryptionKey).toBe(true);
    expect(guide.liveCheck).toBe(false);
    // Niemals Werte, nur Namen und Status.
    expect(JSON.stringify(guide)).not.toContain('"k"');
  });

  it("hat für Anthropic keinen Redirect, aber einen Live-Check", () => {
    const guide = buildSetupGuide(getIntegrationDefinition("anthropic")!, "http://localhost:3000");
    expect(guide.redirects).toEqual([]);
    expect(guide.needsEncryptionKey).toBe(false);
    expect(guide.liveCheck).toBe(true);
  });
});

describe("Verbindung prüfen", () => {
  it("meldet fehlende Variablen ohne Aufruf beim Anbieter", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const calls = mockFetch(() => jsonResponse({}));
    const result = await verifyIntegration(getIntegrationDefinition("anthropic")!, t);
    expect(result.status).toBe("NOT_CONFIGURED");
    expect(calls).toHaveLength(0);
  });

  it("ruft Anthropic mit dem Schlüssel im Header auf und meldet Erfolg", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    const calls = mockFetch(() => jsonResponse({ data: [] }));
    const result = await verifyIntegration(getIntegrationDefinition("anthropic")!, t);
    expect(result).toMatchObject({ status: "CONNECTED", liveCheck: true });
    expect(calls[0].url).toContain("api.anthropic.com/v1/models");
    expect(calls[0].headers["x-api-key"]).toBe("sk-test");
  });

  it("gibt bei abgelehntem Schlüssel den Status weiter, nicht die Antwort", async () => {
    vi.stubEnv("OPENAI_API_KEY", "bad");
    mockFetch(() => jsonResponse({ error: { message: "Incorrect API key: bad" } }, { status: 401 }));
    const result = await verifyIntegration(getIntegrationDefinition("openai")!, t);
    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("401");
    expect(result.message).not.toContain("Incorrect");
  });

  it("meldet bei OAuth-Plattformen nur vorhandene Zugangsdaten statt eines Tests", async () => {
    vi.stubEnv("YOUTUBE_CLIENT_ID", "id");
    vi.stubEnv("YOUTUBE_CLIENT_SECRET", "secret");
    const calls = mockFetch(() => jsonResponse({}));
    const result = await verifyIntegration(getIntegrationDefinition("youtube")!, t);
    expect(result).toEqual({ status: "CONNECTED", message: "credentialsPresentOauth", liveCheck: false });
    expect(calls).toHaveLength(0);
  });

  it("verlangt bei OAuth-Plattformen den TOKEN_ENCRYPTION_KEY", async () => {
    vi.stubEnv("YOUTUBE_CLIENT_ID", "id");
    vi.stubEnv("YOUTUBE_CLIENT_SECRET", "secret");
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", "");
    const result = await verifyIntegration(getIntegrationDefinition("youtube")!, t);
    expect(result.status).toBe("NOT_CONFIGURED");
    expect(result.message).toContain("TOKEN_ENCRYPTION_KEY");
  });
});
