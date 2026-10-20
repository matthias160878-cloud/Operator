import { describe, expect, it, vi } from "vitest";
import { apiPreflight, authenticate } from "@/lib/api/publicApi";
import { seoAnalyzeSchema, websitePostsSchema } from "@/lib/api/schemas";

function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/v1/seo/analyze", { method: "POST", headers });
}

describe("authenticate", () => {
  it("antwortet mit 503, wenn keine Schlüssel konfiguriert sind", async () => {
    vi.stubEnv("PUBLIC_API_KEYS", "");
    const res = authenticate(request({ authorization: "Bearer x" }));
    expect(res?.status).toBe(503);
  });

  it("lehnt fehlende und falsche Schlüssel mit 401 ab", () => {
    vi.stubEnv("PUBLIC_API_KEYS", "geheim-1,geheim-2");
    expect(authenticate(request())?.status).toBe(401);
    const wrong = authenticate(request({ authorization: "Bearer falsch" }));
    expect(wrong?.status).toBe(401);
    expect(wrong?.headers.get("www-authenticate")).toBe("Bearer");
  });

  it("akzeptiert Bearer und X-API-Key mit jedem konfigurierten Schlüssel", () => {
    vi.stubEnv("PUBLIC_API_KEYS", `key-a-${Math.random()},key-b`);
    expect(authenticate(request({ "x-api-key": "key-b" }))).toBeNull();
  });

  it("begrenzt Anfragen pro Schlüssel (429 mit Retry-After)", () => {
    const key = `limit-${Math.random()}`;
    vi.stubEnv("PUBLIC_API_KEYS", key);
    vi.stubEnv("PUBLIC_API_RATE_LIMIT", "2");
    expect(authenticate(request({ authorization: `Bearer ${key}` }))).toBeNull();
    expect(authenticate(request({ authorization: `Bearer ${key}` }))).toBeNull();
    const limited = authenticate(request({ authorization: `Bearer ${key}` }));
    expect(limited?.status).toBe(429);
    expect(Number(limited?.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});

describe("CORS der externen API", () => {
  it("setzt Header nur für freigegebene Origins", () => {
    vi.stubEnv("PUBLIC_API_CORS_ORIGINS", "https://erlaubt.example");
    const allowed = apiPreflight(request({ origin: "https://erlaubt.example" }));
    expect(allowed.headers.get("access-control-allow-origin")).toBe("https://erlaubt.example");
    const other = apiPreflight(request({ origin: "https://fremd.example" }));
    expect(other.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("Eingabe-Schemas", () => {
  it("setzt Standardwerte für die SEO-Analyse", () => {
    expect(seoAnalyzeSchema.parse({ url: "https://example.com" })).toMatchObject({
      includePageSpeed: false,
      strategy: "mobile",
    });
  });

  it("verlangt gültige URL und mindestens eine Plattform", () => {
    expect(seoAnalyzeSchema.safeParse({ url: "kein-link" }).success).toBe(false);
    expect(websitePostsSchema.safeParse({ url: "https://example.com", platforms: [] }).success).toBe(false);
    expect(websitePostsSchema.safeParse({ url: "https://example.com", platforms: ["WEBSITE"] }).success).toBe(false);
    expect(
      websitePostsSchema.parse({ url: "https://example.com", platforms: ["LINKEDIN"] }).postsPerPlatform
    ).toBe(1);
  });
});
