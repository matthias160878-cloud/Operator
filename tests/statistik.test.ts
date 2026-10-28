/**
 * Automatischer Abruf der Plattformzahlen gegen eine isolierte SQLite-Datenbank.
 * YouTube- und Facebook-Aufrufe werden abgefangen (globales fetch).
 *
 *   npx tsx --test tests/statistik.test.ts
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const workdir = mkdtempSync(path.join(tmpdir(), "s58-statistik-"));
process.env.DATABASE_URL = `file:${path.join(workdir, "s.db")}`;
process.env.TOKEN_ENCRYPTION_KEY = "test-schluessel-nur-fuer-den-statistik-test";
delete process.env.STATISTIK_INSTAGRAM;
execFileSync("npx", ["prisma", "db", "push", "--skip-generate"], { env: process.env, stdio: "ignore" });

let prisma: typeof import("@/lib/db").prisma;
let abruf: typeof import("@/lib/statistik/abruf");
const realFetch = globalThis.fetch;
const aufrufe: string[] = [];
let youtubeViews = 1200;

before(async () => {
  ({ prisma } = await import("@/lib/db"));
  abruf = await import("@/lib/statistik/abruf");
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("https://www.googleapis.com/youtube/v3/videos?part=statistics")) {
      aufrufe.push(url);
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer yt-tok");
      const ids = new URL(url).searchParams.get("id")!.split(",");
      return Response.json({ items: ids.map((id) => ({ id, statistics: { viewCount: String(youtubeViews), likeCount: "40", commentCount: "7" } })) });
    }
    if (url.startsWith("https://graph.facebook.com/v19.0/fb-post-1?")) {
      aufrufe.push(url);
      return Response.json({ shares: { count: 5 }, reactions: { summary: { total_count: 33 } }, comments: { summary: { total_count: 4 } } });
    }
    if (url.includes("instagram")) {
      aufrufe.push(url);
      return new Response("nicht erwartet", { status: 500 });
    }
    return realFetch(input, init);
  }) as typeof fetch;
});

after(async () => {
  globalThis.fetch = realFetch;
  await prisma.$disconnect();
  rmSync(workdir, { recursive: true, force: true });
});

async function arbeitsbereich() {
  const { encryptToken } = await import("@/lib/crypto");
  const ws = await prisma.workspace.create({ data: { name: "Statistik", slug: `st-${Date.now()}-${Math.random()}` } });
  for (const [platform, tok] of [["YOUTUBE", "yt-tok"], ["FACEBOOK", "fb-tok"], ["INSTAGRAM", "ig-tok"]] as const) {
    await prisma.platformAccount.create({
      data: { workspaceId: ws.id, platform, status: "CONNECTED", accountName: "Test", externalAccountId: "x", accessTokenEnc: encryptToken(tok), tokenExpiresAt: new Date(Date.now() + 86400_000) },
    });
  }
  const kampagne = await prisma.reichweitenKampagne.create({ data: { workspaceId: ws.id, titel: "Herbst" } });
  return { ws: ws.id, kampagne: kampagne.id };
}

async function beitrag(workspaceId: string, platform: "YOUTUBE" | "FACEBOOK" | "INSTAGRAM", externalPostId: string, kampagneId?: string) {
  return prisma.contentItem.create({
    data: { workspaceId, title: "Beitrag", platform, status: "PUBLISHED", publishedAt: new Date(Date.now() - 86400_000), externalPostId, reichweitenKampagneId: kampagneId },
  });
}

test("YouTube und Facebook: Zahlen landen in Analytics, Weiterempfehlungen und Variantenvergleich", async () => {
  const { ws, kampagne } = await arbeitsbereich();
  const yt = await beitrag(ws, "YOUTUBE", "vid-1", kampagne);
  const fb = await beitrag(ws, "FACEBOOK", "fb-post-1", kampagne);
  const ig = await beitrag(ws, "INSTAGRAM", "ig-1", kampagne);
  const test1 = await prisma.variantenTest.create({
    data: { workspaceId: ws, titel: "T", ziel: "Z", hauptkennzahl: "AUFRUFE", eigenschaft: "TITEL", datenquelle: "YouTube", laufzeitVon: new Date(), laufzeitBis: new Date(Date.now() + 86400_000) },
  });
  const variante = await prisma.testVariante.create({ data: { workspaceId: ws, testId: test1.id, label: "A", plattform: "YOUTUBE", contentItemId: yt.id } });

  const r = await abruf.statistikAbrufen(new Date());
  assert.equal(r.gespeichert, 2, "YouTube und Facebook gespeichert, Instagram ohne Freigabe übersprungen");
  assert.ok(!aufrufe.some((u) => u.includes("instagram")), "Instagram darf ohne Freigabe nicht abgefragt werden");

  const a = await prisma.analytics.findFirstOrThrow({ where: { contentItemId: yt.id } });
  assert.deepEqual([a.views, a.likes, a.comments, a.quelle], [1200, 40, 7, "API:YouTube"]);
  const f = await prisma.analytics.findFirstOrThrow({ where: { contentItemId: fb.id } });
  assert.deepEqual([f.likes, f.comments, f.shares, f.quelle], [33, 4, 5, "API:Facebook"]);
  assert.equal(await prisma.analytics.count({ where: { contentItemId: ig.id } }), 0);

  const mw = await prisma.variantenMesswert.findFirstOrThrow({ where: { varianteId: variante.id, metrik: "AUFRUFE" } });
  assert.deepEqual([mw.wert, mw.quelle], [1200, "API:YouTube"]);

  const kz = await prisma.reichweitenKennzahl.findMany({ where: { kampagneId: kampagne, quelle: "API:YouTube" } });
  assert.equal(kz.find((k) => k.metrik === "VIDEOAUFRUFE")?.wert, 1200);
  assert.equal(kz[0].plattform, "YOUTUBE");
  const kzFb = await prisma.reichweitenKennzahl.findMany({ where: { kampagneId: kampagne, quelle: "API:Facebook" } });
  assert.equal(kzFb.find((k) => k.metrik === "SHARES")?.wert, 5);
});

test("erneuter Abruf aktualisiert statt zu addieren und wartet den Abstand ab", async () => {
  const { ws, kampagne } = await arbeitsbereich();
  const yt = await beitrag(ws, "YOUTUBE", "vid-2", kampagne);
  const t0 = new Date();
  youtubeViews = 100;
  await abruf.statistikAbrufen(t0);
  const vorher = aufrufe.length;
  await abruf.statistikAbrufen(new Date(t0.getTime() + 60_000));
  assert.equal(aufrufe.length, vorher, "innerhalb von sechs Stunden kein erneuter Abruf");

  youtubeViews = 250;
  await abruf.statistikAbrufen(new Date(t0.getTime() + abruf.ABRUF_ABSTAND_MS + 1000));
  const rows = await prisma.analytics.findMany({ where: { contentItemId: yt.id } });
  assert.equal(rows.length, 1, "ein Eintrag je Beitrag, nicht aufaddiert");
  assert.equal(rows[0].views, 250);
  const kz = await prisma.reichweitenKennzahl.findMany({ where: { kampagneId: kampagne, metrik: "VIDEOAUFRUFE" } });
  assert.equal(kz.length, 1);
  assert.equal(kz[0].wert, 250);
});

test("manuell eingetragene Werte bleiben erhalten", async () => {
  const { ws, kampagne } = await arbeitsbereich();
  await beitrag(ws, "YOUTUBE", "vid-3", kampagne);
  const manuell = await prisma.reichweitenKennzahl.create({
    data: { workspaceId: ws, kampagneId: kampagne, plattform: "YOUTUBE", metrik: "VIDEOAUFRUFE", wert: 9, quelle: "MANUELL", zeitraumVon: new Date(), zeitraumBis: new Date() },
  });
  await abruf.statistikAbrufen(new Date());
  assert.ok(await prisma.reichweitenKennzahl.findUnique({ where: { id: manuell.id } }));
});

test("Freigabe-Schalter: Instagram, TikTok, LinkedIn nur vorbereitet", () => {
  assert.equal(abruf.abrufAktiv("YOUTUBE").aktiv, true);
  assert.equal(abruf.abrufAktiv("FACEBOOK").aktiv, true);
  for (const p of ["INSTAGRAM", "TIKTOK", "LINKEDIN"]) assert.equal(abruf.abrufAktiv(p).aktiv, false, p);
});
