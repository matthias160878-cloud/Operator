import { describe, expect, it, vi } from "vitest";
import { analyzeWebsite } from "@/lib/agents/seoAgent";
import { mockFetch } from "../../../tests/helpers";
import { SAMPLE_HTML } from "../../../tests/fixtures";

vi.mock("node:dns/promises", () => ({ lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]) }));

describe("analyzeWebsite", () => {
  it("bewertet eine Seite und gibt regelbasierte Empfehlungen ohne KI-Schlüssel", async () => {
    const calls = mockFetch((call) => {
      if (call.url.endsWith("/robots.txt")) return new Response("User-agent: *\nSitemap: https://example.com/sitemap.xml");
      return new Response(SAMPLE_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
    });
    const report = await analyzeWebsite({ url: "https://example.com/abo", focusKeyword: "Kaffee-Abo" });

    expect(report.provider).toBe("template");
    expect(report.score).toBeGreaterThan(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.facts).toMatchObject({ h1: ["Dein Kaffee-Abo"], images: 2, imagesWithoutAlt: 1 });
    expect(report.checks.find((c) => c.id === "focus-keyword")?.status).toBe("pass");
    expect(report.recommendations.length).toBeGreaterThan(0);
    // Ohne includePageSpeed kein Aufruf der PageSpeed-API.
    expect(calls.some((c) => c.url.includes("pagespeedonline"))).toBe(false);
  });

  it("meldet fehlende Grundlagen als Fehler", async () => {
    mockFetch((call) =>
      call.url.endsWith("/robots.txt") || call.url.endsWith("/sitemap.xml")
        ? new Response("", { status: 404 })
        : new Response("<html><body><p>Nur Text</p></body></html>")
    );
    const report = await analyzeWebsite({ url: "https://example.com/" });
    const failed = report.checks.filter((c) => c.status === "fail").map((c) => c.id);
    expect(failed.length).toBeGreaterThan(2);
    expect(report.score).toBeLessThan(60);
  });
});
