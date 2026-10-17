/**
 * Versand-Worker gegen eine isolierte SQLite-Datenbank. Plattform-Aufrufe
 * werden abgefangen (globales fetch) — es wird nichts veröffentlicht.
 *
 *   npm run test:worker
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const workdir = mkdtempSync(path.join(tmpdir(), "s58-worker-"));
process.env.DATABASE_URL = `file:${path.join(workdir, "w.db")}`;
process.env.TOKEN_ENCRYPTION_KEY = "test-schluessel-nur-fuer-den-worker-test";
execFileSync("npx", ["prisma", "db", "push", "--skip-generate"], { env: process.env, stdio: "ignore" });

type Mod = typeof import("@/lib/publishWorker");
let worker: Mod;
let prisma: typeof import("@/lib/db").prisma;
let linkedInCalls = 0;
let linkedInDelayMs = 0;
const realFetch = globalThis.fetch;

before(async () => {
  ({ prisma } = await import("@/lib/db"));
  worker = await import("@/lib/publishWorker");
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("https://api.linkedin.com/v2/ugcPosts")) {
      linkedInCalls += 1;
      if (linkedInDelayMs) await new Promise((r) => setTimeout(r, linkedInDelayMs));
      return new Response("{}", { status: 201, headers: { "x-restli-id": `urn:li:share:${linkedInCalls}` } });
    }
    return realFetch(input, init);
  }) as typeof fetch;
});

after(async () => {
  globalThis.fetch = realFetch;
  await prisma.$disconnect();
  rmSync(workdir, { recursive: true, force: true });
});

let n = 0;
async function setup(opts: { plan?: boolean; connected?: boolean } = {}) {
  n += 1;
  const { encryptToken } = await import("@/lib/crypto");
  const ws = await prisma.workspace.create({ data: { name: `W${n}`, slug: `w-${n}-${Date.now()}` } });
  if (opts.plan !== false) {
    await prisma.workspacePlan.create({ data: { workspaceId: ws.id, plan: "PRO", status: "ACTIVE", source: "TEST" } });
  }
  if (opts.connected !== false) {
    await prisma.platformAccount.create({
      data: {
        workspaceId: ws.id, platform: "LINKEDIN", status: "CONNECTED", accountName: "Test", externalAccountId: "abc",
        accessTokenEnc: encryptToken("tok"), tokenExpiresAt: new Date(Date.now() + 86400_000),
      },
    });
  }
  return ws.id;
}

async function scheduled(workspaceId: string, when: Date) {
  const { queuePublishJob } = await import("@/lib/contentWorkflow");
  const item = await prisma.contentItem.create({
    data: { workspaceId, title: "Geplanter Post", platform: "LINKEDIN", caption: "Hallo", status: "SCHEDULED", scheduledAt: when },
  });
  const job = await queuePublishJob(item.id, workspaceId, when);
  return { item, job };
}

const past = () => new Date(Date.now() - 60_000);

test("fälliger Auftrag wird genau einmal gesendet; künftiger bleibt liegen", async () => {
  const ws = await setup();
  const due = await scheduled(ws, past());
  const later = await scheduled(ws, new Date(Date.now() + 3600_000));
  const before = linkedInCalls;
  await worker.tick("https://app.example.test");
  await worker.tick("https://app.example.test");
  assert.equal(linkedInCalls - before, 1);
  assert.equal((await prisma.publishJob.findUniqueOrThrow({ where: { id: due.job.id } })).status, "SUCCEEDED");
  assert.equal((await prisma.contentItem.findUniqueOrThrow({ where: { id: due.item.id } })).status, "PUBLISHED");
  assert.equal((await prisma.publishJob.findUniqueOrThrow({ where: { id: later.job.id } })).status, "QUEUED");
});

test("zwei Worker gleichzeitig: trotzdem nur ein Versand", async () => {
  const ws = await setup();
  const { job } = await scheduled(ws, past());
  linkedInDelayMs = 200;
  const before = linkedInCalls;
  try {
    const results = await Promise.all([worker.processJob(job.id, ""), worker.processJob(job.id, "")]);
    assert.deepEqual([...results].sort(), ["REQUEUED", "SUCCEEDED"]);
  } finally {
    linkedInDelayMs = 0;
  }
  assert.equal(linkedInCalls - before, 1);
});

test("erneute Prüfung: Freigabe entzogen oder Termin geändert → nicht gesendet", async () => {
  const ws = await setup();
  const { revokeApprovalOnChange } = await import("@/lib/contentWorkflow");
  const a = await scheduled(ws, past());
  await revokeApprovalOnChange(a.item.id); // Änderung nach Freigabe
  assert.equal((await prisma.publishJob.findUniqueOrThrow({ where: { id: a.job.id } })).status, "CANCELED");

  const b = await scheduled(ws, past());
  await prisma.contentItem.update({ where: { id: b.item.id }, data: { scheduledAt: new Date(Date.now() + 86400_000) } });
  const before = linkedInCalls;
  assert.equal(await worker.processJob(b.job.id, ""), "CANCELED");
  assert.equal(linkedInCalls, before);
});

test("ohne aktives Paket oder ohne Verbindung: kein Versand, Beitrag zurück auf Freigegeben", async () => {
  const noPlan = await scheduled(await setup({ plan: false }), past());
  assert.equal(await worker.processJob(noPlan.job.id, ""), "FAILED");
  assert.equal((await prisma.contentItem.findUniqueOrThrow({ where: { id: noPlan.item.id } })).status, "APPROVED");

  const noAccount = await scheduled(await setup({ connected: false }), past());
  assert.equal(await worker.processJob(noAccount.job.id, ""), "FAILED");
  const job = await prisma.publishJob.findUniqueOrThrow({ where: { id: noAccount.job.id } });
  assert.match(job.message, /nicht verbunden/);
  assert.equal((await prisma.contentItem.findUniqueOrThrow({ where: { id: noAccount.item.id } })).status, "APPROVED");
});

test("unterbrochener Versand → Ausgang unklar, keine automatische Wiederholung", async () => {
  const ws = await setup();
  const { item, job } = await scheduled(ws, past());
  // Simuliert einen Absturz mitten im Versand vor 20 Minuten.
  await prisma.publishJob.update({ where: { id: job.id }, data: { status: "RUNNING", startedAt: new Date(Date.now() - 20 * 60_000) } });
  await prisma.contentItem.update({ where: { id: item.id }, data: { publishingStartedAt: new Date(Date.now() - 20 * 60_000) } });
  const before = linkedInCalls;
  const r = await worker.tick("");
  assert.equal(r.recovered, 1);
  assert.equal(linkedInCalls, before, "darf nicht erneut senden");
  const after = await prisma.publishJob.findUniqueOrThrow({ where: { id: job.id } });
  assert.equal(after.status, "UNKNOWN");
  assert.match(after.message, /auf der Plattform prüfen/);
  assert.equal((await prisma.contentItem.findUniqueOrThrow({ where: { id: item.id } })).publishingStartedAt, null);
});

test("Klick-Versand läuft gerade → Auftrag wartet auf den nächsten Durchlauf", async () => {
  const ws = await setup();
  const { item, job } = await scheduled(ws, past());
  await prisma.contentItem.update({ where: { id: item.id }, data: { publishingStartedAt: new Date() } });
  assert.equal(await worker.processJob(job.id, ""), "REQUEUED");
  assert.equal((await prisma.publishJob.findUniqueOrThrow({ where: { id: job.id } })).status, "QUEUED");
});
