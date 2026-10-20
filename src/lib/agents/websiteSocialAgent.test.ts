import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { generateSocialPostsFromWebsite } from "@/lib/agents/websiteSocialAgent";
import { mockFetch, resetInbox } from "../../../tests/helpers";
import { SAMPLE_HTML } from "../../../tests/fixtures";

vi.mock("node:dns/promises", () => ({ lookup: vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]) }));

describe("generateSocialPostsFromWebsite", () => {
  let workspaceId: string;
  beforeEach(async () => {
    workspaceId = await resetInbox();
    await prisma.contentItem.deleteMany({ where: { workspaceId, format: "Post (aus Website)" } });
  });

  it("erzeugt pro Plattform Beiträge mit Quelle im Text (Vorlagen-Modus)", async () => {
    mockFetch(() => new Response(SAMPLE_HTML));
    const result = await generateSocialPostsFromWebsite({
      workspaceId,
      url: "https://example.com/abo",
      platforms: ["LINKEDIN", "INSTAGRAM"],
      postsPerPlatform: 2,
    });
    expect(result.provider).toBe("template");
    expect(result.source.title).toContain("Kaffee-Abo");
    expect(result.posts.map((p) => p.platform)).toEqual(["LINKEDIN", "LINKEDIN", "INSTAGRAM", "INSTAGRAM"]);
    for (const post of result.posts) {
      expect(post.caption).toContain("https://example.com/abo");
      expect(post.hashtags.every((h) => h.startsWith("#"))).toBe(true);
    }
    expect(result.savedContentItemIds).toEqual([]);
  });

  it("speichert mit save: true Entwürfe in der Content Factory", async () => {
    mockFetch(() => new Response(SAMPLE_HTML));
    const result = await generateSocialPostsFromWebsite({
      workspaceId,
      url: "https://example.com/abo",
      platforms: ["FACEBOOK"],
      save: true,
    });
    expect(result.savedContentItemIds).toHaveLength(1);
    const item = await prisma.contentItem.findUniqueOrThrow({ where: { id: result.savedContentItemIds[0] } });
    expect(item).toMatchObject({ status: "DRAFT", platform: "FACEBOOK", format: "Post (aus Website)" });
  });

  it("bricht bei Fehlerseiten mit verständlicher Meldung ab", async () => {
    mockFetch(() => new Response("weg", { status: 404 }));
    await expect(
      generateSocialPostsFromWebsite({ workspaceId, url: "https://example.com/weg", platforms: ["LINKEDIN"] })
    ).rejects.toThrow(/HTTP 404/);
  });
});
