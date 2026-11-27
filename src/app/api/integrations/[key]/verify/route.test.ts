import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/integrations/[key]/verify/route";
import { mockFetch, jsonResponse } from "../../../../../../tests/helpers";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

function call(key: string) {
  return POST(new Request(`http://localhost/api/integrations/${key}/verify`, { method: "POST" }), {
    params: Promise.resolve({ key }),
  });
}

describe("POST /api/integrations/[key]/verify", () => {
  it("kennt nur registrierte Integrationen", async () => {
    const res = await call("unbekannt");
    expect(res.status).toBe(404);
  });

  it("liefert Status und Meldung, aber keine Schlüssel", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "el-secret");
    mockFetch(() => jsonResponse({ subscription: {} }));
    const res = await call("elevenlabs");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ status: "CONNECTED", liveCheck: true });
    expect(JSON.stringify(body)).not.toContain("el-secret");
  });

  it("bremst Klick-Serien je Integration", async () => {
    vi.stubEnv("CANVA_API_KEY", "");
    let last: Response | undefined;
    for (let i = 0; i < 7; i++) last = await call("canva");
    expect(last?.status).toBe(429);
    expect(last?.headers.get("Retry-After")).not.toBeNull();
  });
});
