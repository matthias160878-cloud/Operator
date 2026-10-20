import { describe, expect, it, vi } from "vitest";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async (host: string) =>
    host === "intern.example" ? [{ address: "10.0.0.5", family: 4 }] : [{ address: "93.184.216.34", family: 4 }]
  ),
}));

import { decodeEntities, extractPage, fetchPage } from "@/lib/web/fetchPage";
import { mockFetch } from "../../../tests/helpers";

describe("fetchPage — Schutz vor internen Adressen (SSRF)", () => {
  it.each([
    ["http://127.0.0.1/", /Lokale oder interne/],
    ["http://localhost:3000/", /Lokale oder interne/],
    ["http://[::1]/", /Lokale oder interne/],
    ["http://169.254.169.254/latest/meta-data", /Lokale oder interne/],
    ["https://intern.example/", /Lokale oder interne/],
    ["ftp://example.com/", /Nur http/],
    ["https://user:pass@example.com/", /Zugangsdaten/],
  ])("blockiert %s", async (url, error) => {
    const calls = mockFetch(() => new Response("nein"));
    await expect(fetchPage(url)).rejects.toThrow(error);
    expect(calls).toHaveLength(0);
  });

  it("prüft auch das Ziel von Weiterleitungen", async () => {
    mockFetch(() => new Response(null, { status: 302, headers: { location: "http://10.1.2.3/admin" } }));
    await expect(fetchPage("https://example.com/")).rejects.toThrow(/Lokale oder interne/);
  });

  it("folgt öffentlichen Weiterleitungen und kürzt große Antworten", async () => {
    mockFetch((call) =>
      call.url === "https://example.com/"
        ? new Response(null, { status: 301, headers: { location: "/neu" } })
        : new Response("x".repeat(50), { status: 200, headers: { "content-type": "text/html" } })
    );
    const page = await fetchPage("https://example.com/", { maxBytes: 10 });
    expect(page.finalUrl).toBe("https://example.com/neu");
    expect(page.redirects).toEqual(["https://example.com/"]);
    expect(page.body).toBe("x".repeat(10));
    expect(page.truncated).toBe(true);
  });
});

describe("extractPage", () => {
  const html = `<!doctype html><html lang="de"><head>
    <title>Kaffee &amp; Kuchen</title>
    <meta name="description" content="Frisch gerösteter Kaffee">
    <meta property="og:title" content="Kaffee OG">
    <link rel="canonical" href="/start">
    <script type="application/ld+json">{"@type":"Organization"}</script>
    </head><body>
    <h1>Unser Kaffee</h1><h2>Bohnen</h2>
    <p>Wir rösten jeden Tag frische Bohnen für dich.</p>
    <img src="a.jpg" alt="Bohnen"><img src="b.jpg">
    <a href="/kontakt">Kontakt</a><a href="https://extern.example/">Extern</a>
    <script>var geheim = "nicht im Text";</script>
    </body></html>`;

  it("liest Titel, Meta-Daten, Überschriften, Bilder und Links", () => {
    const page = extractPage(html, "https://example.com/");
    expect(page.title).toBe("Kaffee & Kuchen");
    expect(page.metaDescription).toBe("Frisch gerösteter Kaffee");
    expect(page.openGraph["og:title"]).toBe("Kaffee OG");
    expect(page.headings.map((h) => [h.level, h.text])).toEqual([
      [1, "Unser Kaffee"],
      [2, "Bohnen"],
    ]);
    expect(page.text).not.toContain("geheim");
    expect(page.images.filter((i) => !i.alt)).toHaveLength(1);
  });

  it("dekodiert HTML-Entities", () => {
    expect(decodeEntities("&lt;b&gt; &quot;x&quot; &#228; &#xFC;")).toBe('<b> "x" ä ü');
  });
});
