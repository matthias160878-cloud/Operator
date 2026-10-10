/**
 * Integrationstests gegen den echten Produktions-Build (next start) mit
 * isolierter SQLite-Testdatenbank und lokalen Attrappen für Stripe/KI.
 *
 *   npm run build && npm run test:integration
 *
 * Gegen PostgreSQL (Build vorher mit `npm run build:server` auf derselben URL):
 *   TEST_DATABASE_URL=postgresql://…/s58_test npm run test:integration
 *
 * Geprüft wird über HTTP — inklusive Proxy, Sitzungen, Webhook-Signaturen.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { startFakeServices } from "./fake-services.mjs";

const PORT = 3990;
const BASE = `http://127.0.0.1:${PORT}`;
const ORIGIN_HDR = { origin: BASE };
const WHSEC = "whsec_test_platform_secret";
const WHSEC_CONNECT = "whsec_test_connect_secret";
const SETUP_TOKEN = "t".repeat(40);

let fakes;
let server;
let prisma;
let workdir;
const stripe = new Stripe("sk_test_offline");

function sign(payload, secret = WHSEC) {
  return stripe.webhooks.generateTestHeaderString({ payload, secret });
}

async function webhook(event, { secret = WHSEC, path: p = "/api/stripe/webhook", badSignature = false } = {}) {
  const payload = JSON.stringify(event);
  return fetch(`${BASE}${p}`, {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": badSignature ? "t=1,v1=deadbeef" : sign(payload, secret) },
    body: payload,
  });
}

let eventCounter = 0;
function event(type, object, extra = {}) {
  eventCounter += 1;
  return { id: `evt_test_${eventCounter}`, object: "event", type, livemode: false, created: 1, data: { object }, ...extra };
}

class Client {
  constructor() {
    this.cookie = "";
  }
  async req(p, { method = "GET", body, headers = {}, raw } = {}) {
    const res = await fetch(`${BASE}${p}`, {
      method,
      redirect: "manual",
      headers: {
        ...(method !== "GET" ? ORIGIN_HDR : {}),
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(this.cookie ? { cookie: this.cookie } : {}),
        ...headers,
      },
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    const set = res.headers.get("set-cookie");
    if (set && set.includes("s58_session=")) this.cookie = set.split(";")[0];
    return res;
  }
  async json(p, opts) {
    const res = await this.req(p, opts);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }
}

async function signup(email, workspaceName) {
  const c = new Client();
  const r = await c.json("/api/auth/signup", {
    method: "POST",
    body: { email, password: "sehr-sicheres-passwort-123", name: workspaceName, workspaceName, acceptProcessing: true },
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return c;
}

async function workspaceIdOf(email) {
  return (await prisma.user.findUniqueOrThrow({ where: { email } })).workspaceId;
}

let A, B;

before(async () => {
  fakes = await startFakeServices();
  workdir = mkdtempSync(path.join(tmpdir(), "s58-it-"));
  // Standard: SQLite-Datei. Mit TEST_DATABASE_URL (eigene, leere Test-Datenbank!)
  // läuft dieselbe Suite gegen PostgreSQL (Datenbank muss leer sein).
  const pgUrl = process.env.TEST_DATABASE_URL;
  const dbUrl = pgUrl ?? `file:${path.join(workdir, "test.db")}`;
  const pushArgs = ["prisma", "db", "push", "--skip-generate"];
  execFileSync("npx", pushArgs, { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "ignore" });
  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  const env = {
    ...process.env,
    NODE_ENV: "production",
    DATABASE_URL: dbUrl,
    MEDIA_STORAGE_DIR: path.join(workdir, "media"),
    STRIPE_SECRET_KEY: "sk_test_fake",
    STRIPE_API_HOST: "127.0.0.1",
    STRIPE_API_PORT: String(fakes.stripePort),
    STRIPE_API_PROTOCOL: "http",
    STRIPE_WEBHOOK_SECRET: WHSEC,
    STRIPE_CONNECT_WEBHOOK_SECRET: WHSEC_CONNECT,
    STRIPE_PRICE_ID_PRO: "price_pro",
    STRIPE_PRICE_ID_MAXI: "price_maxi",
    STRIPE_PRICE_ID_PRO_YEAR: "price_pro_year",
    PACKAGE_TERMS_CONFIRMED: "true",
    // Testangaben — keine echten Anbieterdaten
    IMPRESSUM_NAME: "Test Anbieter",
    IMPRESSUM_ANSCHRIFT: "Teststraße 1 | 00000 Teststadt",
    IMPRESSUM_EMAIL: "kontakt@example.test",
    AGB_URL: "https://example.test/agb",
    DATENSCHUTZ_URL: "https://example.test/datenschutz",
    OPERATOR_SETUP_TOKEN: SETUP_TOKEN,
    ANTHROPIC_API_KEY: "sk-ant-fake",
    ANTHROPIC_BASE_URL: `http://127.0.0.1:${fakes.stripePort}`,
    OPENAI_API_KEY: "",
    ALLOW_PRIVATE_SITE_FETCH: "true",
    COMPOSIO_API_KEY: "ck_test_fake",
    COMPOSIO_BASE_URL: `http://127.0.0.1:${fakes.stripePort}`,
    COMPOSIO_AUTH_CONFIG_INSTAGRAM: "ac_instagram",
    COMPOSIO_AUTH_CONFIG_YOUTUBE: "ac_youtube",
  };
  server = spawn("npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], { env, stdio: ["ignore", "pipe", "pipe"], detached: true });
  server.stderr.on("data", (d) => process.env.DEBUG_SERVER && process.stderr.write(d));
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${BASE}/login`);
      if (r.status === 200) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  A = await signup("a@example.test", "Firma A");
  B = await signup("b@example.test", "Firma B");
});

after(async () => {
  // Ganze Prozessgruppe beenden (npx -> next-server).
  if (server?.pid) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
  }
  await prisma?.$disconnect();
  await fakes?.close();
  rmSync(workdir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
test("ohne Anmeldung: Seiten leiten zur Anmeldung, API antwortet 401", async () => {
  const page = await fetch(`${BASE}/ideas`, { redirect: "manual" });
  assert.equal(page.status, 307);
  assert.match(page.headers.get("location"), /\/login\?next=%2Fideas/);
  const api = await fetch(`${BASE}/api/ideas`);
  assert.equal(api.status, 401);
  const media = await fetch(`${BASE}/api/media/audio/x.mp3`);
  assert.equal(media.status, 401);
});

test("Impressum ist ohne Anmeldung erreichbar und überall verlinkt", async () => {
  const page = await fetch(`${BASE}/impressum`);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.ok(html.includes("Test Anbieter") && html.includes("Teststraße 1") && html.includes("§ 5"));
  for (const p of ["/buy", "/login", "/signup"]) {
    const h = await (await fetch(`${BASE}${p}`)).text();
    assert.ok(h.includes('href="/impressum"'), `Impressum-Link fehlt auf ${p}`);
    assert.ok(h.includes("https://example.test/datenschutz") && h.includes("https://example.test/agb"), `AGB/Datenschutz fehlen auf ${p}`);
  }
});

test("Anmeldung: falsches Passwort generisch abgelehnt, richtiges klappt", async () => {
  const c = new Client();
  const bad = await c.json("/api/auth/login", { method: "POST", body: { email: "a@example.test", password: "falsch-falsch-falsch" } });
  assert.equal(bad.status, 401);
  assert.equal(bad.data.error, "E-Mail-Adresse oder Passwort ist falsch.");
  const ok = await c.json("/api/auth/login", { method: "POST", body: { email: "a@example.test", password: "sehr-sicheres-passwort-123" } });
  assert.equal(ok.status, 200);
});

test("kurzes Passwort wird bei Registrierung abgelehnt", async () => {
  const r = await new Client().json("/api/auth/signup", {
    method: "POST",
    body: { email: "kurz@example.test", password: "kurz", name: "K", workspaceName: "K", acceptProcessing: true },
  });
  assert.equal(r.status, 400);
});

test("CSRF: ändernde Anfrage ohne eigenen Ursprung wird abgelehnt", async () => {
  const r = await A.req("/api/ideas", { method: "POST", body: { title: "x" }, headers: { origin: "https://evil.example" } });
  assert.equal(r.status, 403);
});

test("Kundentrennung: B erreicht keine Inhalte, Dateien oder Daten von A", async () => {
  const idea = await A.json("/api/ideas", { method: "POST", body: { title: "Geheime Idee von A" } });
  assert.equal(idea.status, 200);
  const ideaId = idea.data.idea.id;
  const item = await A.json("/api/content-items", { method: "POST", body: { title: "Geheimes Skript A", platform: "YOUTUBE" } });
  assert.equal(item.status, 200);
  const itemId = item.data.item.id;
  const rev = await A.json("/api/revenue", { method: "POST", body: { amount: 100, source: "Sponsor A" } });
  assert.equal(rev.status, 200);

  // Direkte API-Aufrufe von B auf A's IDs
  assert.equal((await B.req(`/api/content-items/${itemId}`)).status, 404);
  assert.equal((await B.req(`/api/content-items/${itemId}`, { method: "PATCH", body: { title: "gehackt" } })).status, 404);
  assert.equal((await B.req(`/api/content-items/${itemId}`, { method: "DELETE" })).status, 404);
  assert.equal((await B.req(`/api/content-items/${itemId}/duplicate`, { method: "POST" })).status, 404);
  assert.equal((await B.req(`/api/ideas/${ideaId}`, { method: "PATCH", body: { status: "ARCHIVED" } })).status, 404);
  assert.equal((await B.req(`/api/ideas/${ideaId}`, { method: "DELETE" })).status, 404);
  assert.equal((await B.req(`/api/revenue/${rev.data.entry.id}`, { method: "DELETE" })).status, 404);
  // Seiten
  assert.equal((await B.req(`/content-factory/${itemId}`)).status, 404);

  const listB = await B.json("/api/ideas");
  assert.ok(!JSON.stringify(listB.data).includes("Geheime Idee von A"));
  const exportB = await (await B.req("/api/account/export")).text();
  assert.ok(!exportB.includes("Geheime Idee von A") && !exportB.includes("Geheimes Skript A") && !exportB.includes("Sponsor A"));

  // A's Datensätze sind unverändert vorhanden
  assert.equal((await A.req(`/api/content-items/${itemId}`)).status, 200);
  assert.equal((await prisma.contentIdea.findUnique({ where: { id: ideaId } })).status, "NEW");

  // Private Dateien
  const wsA = await workspaceIdOf("a@example.test");
  const mediaDir = path.join(workdir, "media", wsA, "audio");
  mkdirSync(mediaDir, { recursive: true });
  writeFileSync(path.join(mediaDir, "voice-a.mp3"), "AUDIO-A");
  assert.equal((await A.req("/api/media/audio/voice-a.mp3")).status, 200);
  assert.equal((await B.req("/api/media/audio/voice-a.mp3")).status, 404);
  assert.equal((await A.req("/api/media/audio/..%2F..%2Fetc%2Fpasswd")).status, 404);
});

test("ohne bezahltes Paket sind KI-Funktionen gesperrt", async () => {
  const r = await A.json("/api/thumbnails/generate", { method: "POST", body: { topic: "Testthema" } });
  assert.equal(r.status, 402);
  assert.equal(r.data.code, "NO_PLAN");
});

test("Checkout verlangt ausdrückliche Bestätigung und gültiges Paket", async () => {
  assert.equal((await A.json("/api/stripe/checkout", { method: "POST", body: { plan: "pro" } })).status, 400);
  assert.equal((await A.json("/api/stripe/checkout", { method: "POST", body: { plan: "gold", confirmed: true } })).status, 400);
});

let checkoutA;
test("Kauf Pro (Monatsabo): Erfolgs-URL allein schaltet nichts frei", async () => {
  const r = await A.json("/api/stripe/checkout", { method: "POST", body: { plan: "pro", confirmed: true } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const call = fakes.calls.filter((c) => c.path === "/v1/checkout/sessions").at(-1);
  assert.equal(call.params.mode, "subscription");
  assert.equal(call.params["line_items[0][price]"], "price_pro");
  assert.equal(call.params.allow_promotion_codes, "true");
  // Nettopreis + Umsatzsteuer je Land
  assert.equal(call.params["automatic_tax[enabled]"], "true");
  assert.equal(call.params.billing_address_collection, "required");
  assert.equal(call.params["tax_id_collection[enabled]"], "true");
  checkoutA = r.data.url.split("/").pop();
  const status = await A.json(`/api/billing/status?checkout=${checkoutA}`);
  assert.equal(status.data.plan, null);
  assert.equal(status.data.checkout.status, "OPEN");
});

test("manipulierte Webhooks aktivieren nichts", async () => {
  const wsA = await workspaceIdOf("a@example.test");
  const paid = (id, extra = {}) => ({
    id, object: "checkout.session", mode: "subscription", payment_status: "paid", amount_subtotal: 59000, amount_total: 70210,
    currency: "eur", customer: "cus_A", payment_intent: null, subscription: "sub_A_fake", metadata: { workspaceId: wsA, plan: "MAXI" }, ...extra,
  });
  // Falsche Signatur
  assert.equal((await webhook(event("checkout.session.completed", paid(checkoutA)), { badSignature: true })).status, 400);
  // Unbekannte Session (nicht serverseitig angelegt), Metadaten zeigen auf A
  assert.equal((await webhook(event("checkout.session.completed", paid("cs_fremd"))) ).status, 200);
  // Nicht bezahlt
  assert.equal((await webhook(event("checkout.session.completed", paid(checkoutA, { payment_status: "unpaid" })))).status, 200);
  let plan = await prisma.workspacePlan.findUnique({ where: { workspaceId: wsA } });
  assert.equal(plan.status, "PENDING");
  assert.equal(await prisma.operatorPayment.count(), 0);
  // Falscher Betrag
  assert.equal((await webhook(event("checkout.session.completed", paid(checkoutA, { amount_subtotal: 100, amount_total: 100 })))).status, 200);
  plan = await prisma.workspacePlan.findUnique({ where: { workspaceId: wsA } });
  assert.notEqual(plan.status, "ACTIVE");
  const co = await prisma.planCheckout.findUnique({ where: { id: checkoutA } });
  assert.equal(co.status, "FAILED");
  // B ist unberührt
  assert.equal(await prisma.workspacePlan.findUnique({ where: { workspaceId: await workspaceIdOf("b@example.test") } }), null);
});

test("bestätigte Zahlung aktiviert genau Pro; wiederholter Webhook bucht nicht doppelt", async () => {
  const r = await A.json("/api/stripe/checkout", { method: "POST", body: { plan: "pro", confirmed: true } });
  // PENDING-Status verhindert keinen neuen Versuch für dasselbe Paket? -> darf abgelehnt werden
  let sessionId;
  if (r.status === 200) sessionId = r.data.url.split("/").pop();
  else {
    // Der vorige Versuch steht auf PENDING; zurücksetzen wie nach fehlgeschlagener Zahlung.
    await prisma.workspacePlan.update({ where: { workspaceId: await workspaceIdOf("a@example.test") }, data: { status: "PAYMENT_FAILED" } });
    sessionId = (await A.json("/api/stripe/checkout", { method: "POST", body: { plan: "pro", confirmed: true } })).data.url.split("/").pop();
  }
  const wsA = await workspaceIdOf("a@example.test");
  const evt = event("checkout.session.completed", {
    id: sessionId, object: "checkout.session", mode: "subscription", payment_status: "paid", amount_subtotal: 59000,
    amount_total: 59679, currency: "eur", customer: "cus_A", payment_intent: null, subscription: "sub_A", metadata: { plan: "MAXI" },
  });
  // Erste Monatsrechnung (mit Aktionscode, inkl. 19 % USt), doppelt zugestellt
  const firstInvoice = event("invoice.paid", { id: "in_A_1", object: "invoice", amount_paid: 59679, total_taxes: [{ amount: 9529 }],
    currency: "eur", customer: "cus_A", parent: { type: "subscription_details", subscription_details: { subscription: "sub_A" } },
    lines: { data: [{ period: { end: Math.floor(Date.now() / 1000) + 30 * 86400 } }] } });
  const first = await (await webhook(evt)).json();
  const second = await (await webhook(evt)).json();
  const third = await (await webhook(evt)).json();
  assert.equal(first.result, "processed");
  assert.equal(second.result, "duplicate");
  assert.equal(third.result, "duplicate");
  await webhook(firstInvoice);
  await webhook(firstInvoice);
  const plan = await prisma.workspacePlan.findUnique({ where: { workspaceId: wsA } });
  assert.equal(plan.plan, "PRO"); // aus der serverseitigen Bestellung, nicht aus den Metadaten ("MAXI")
  assert.equal(plan.status, "ACTIVE");
  const payments = await prisma.operatorPayment.findMany({ where: { workspaceId: wsA } });
  assert.equal(payments.length, 1);
  assert.equal(payments[0].amount, 59679); // tatsächlich bezahlter Betrag (Aktionscode, inkl. USt)
  assert.equal(payments[0].taxAmount, 9529);
  assert.ok(plan.currentPeriodEnd > new Date());
  const status = await A.json(`/api/billing/status?checkout=${sessionId}`);
  assert.equal(status.data.plan.status, "ACTIVE");
  assert.equal(status.data.checkout.status, "COMPLETED");
  // Zweiter Kauf (auch Maxi) wird verweigert — Wechsel nur über das Abo-Portal
  assert.equal((await A.json("/api/stripe/checkout", { method: "POST", body: { plan: "pro", confirmed: true } })).status, 409);
});

test("Pro-Grenzen greifen auch bei parallelen Anfragen", async () => {
  const wsA = await workspaceIdOf("a@example.test");
  const period = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
  await prisma.usageCounter.upsert({
    where: { workspaceId_metric_period: { workspaceId: wsA, metric: "AI_TEXT", period } },
    create: { workspaceId: wsA, metric: "AI_TEXT", period, used: 297 },
    update: { used: 297 },
  });
  const results = await Promise.all(
    Array.from({ length: 12 }, () => A.req("/api/thumbnails/generate", { method: "POST", body: { topic: "Parallel" } }))
  );
  const ok = results.filter((r) => r.status === 200).length;
  const limited = results.filter((r) => r.status === 429).length;
  assert.equal(ok, 3, `erfolgreich: ${ok}`);
  assert.equal(limited, 9);
  const counter = await prisma.usageCounter.findUnique({ where: { workspaceId_metric_period: { workspaceId: wsA, metric: "AI_TEXT", period } } });
  assert.equal(counter.used, 300);
  const msg = await (await A.req("/api/thumbnails/generate", { method: "POST", body: { topic: "Noch eins" } })).json();
  assert.equal(msg.code, "QUOTA_EXCEEDED");
  assert.match(msg.error, /Maxi/);
});

test("Pro-Grenze für Webseiten: nur 1 gleichzeitig", async () => {
  const one = await A.json("/api/websites", { method: "POST", body: { url: `http://localhost:${fakes.sitePort}` } });
  assert.equal(one.status, 200, JSON.stringify(one.data));
  const two = await A.json("/api/websites", { method: "POST", body: { url: "https://zweite-seite.example" } });
  assert.equal(two.status, 429);
});

test("Maxi als Abo: Aktivierung, Verlängerung, Kündigung", async () => {
  const wsB = await workspaceIdOf("b@example.test");
  const r = await B.json("/api/stripe/checkout", { method: "POST", body: { plan: "maxi", confirmed: true } });
  assert.equal(r.status, 200);
  const call = fakes.calls.filter((c) => c.path === "/v1/checkout/sessions").at(-1);
  assert.equal(call.params.mode, "subscription"); // aus dem wiederkehrenden Stripe-Preis, nicht erfunden
  const sid = r.data.url.split("/").pop();
  await webhook(event("checkout.session.completed", {
    id: sid, object: "checkout.session", mode: "subscription", payment_status: "paid", amount_subtotal: 79700, amount_total: 79700,
    currency: "eur", customer: "cus_B", payment_intent: null, subscription: "sub_B", metadata: {},
  }));
  let plan = await prisma.workspacePlan.findUnique({ where: { workspaceId: wsB } });
  assert.equal(plan.plan, "MAXI");
  assert.equal(plan.status, "ACTIVE");
  assert.equal(await prisma.operatorPayment.count({ where: { workspaceId: wsB } }), 0); // Abo-Zahlung kommt über invoice.paid

  const invoice = { id: "in_B_1", object: "invoice", amount_paid: 94843, currency: "eur", customer: "cus_B", total_taxes: [{ amount: 15143 }],
    parent: { type: "subscription_details", subscription_details: { subscription: "sub_B" } },
    lines: { data: [{ period: { end: Math.floor(Date.now() / 1000) + 30 * 86400 } }] } };
  const inv = event("invoice.paid", invoice);
  await webhook(inv);
  await webhook(inv);
  const payB = await prisma.operatorPayment.findMany({ where: { workspaceId: wsB } });
  assert.equal(payB.length, 1);
  assert.equal(payB[0].amount, 94843); // 797,00 € netto + 19 % USt
  assert.equal(payB[0].taxAmount, 15143);

  // Kontingent Maxi: 3 Webseiten
  for (const u of ["https://b1.example", "https://b2.example", "https://b3.example"]) {
    assert.equal((await B.json("/api/websites", { method: "POST", body: { url: u } })).status, 200);
  }
  assert.equal((await B.json("/api/websites", { method: "POST", body: { url: "https://b4.example" } })).status, 429);

  await webhook(event("invoice.payment_failed", { ...invoice, id: "in_B_2", amount_paid: 0 }));
  plan = await prisma.workspacePlan.findUnique({ where: { workspaceId: wsB } });
  assert.equal(plan.status, "PAST_DUE");
  assert.equal((await B.json("/api/thumbnails/generate", { method: "POST", body: { topic: "Abo überfällig" } })).status, 402);

  await webhook(event("customer.subscription.deleted", { id: "sub_B", object: "subscription", status: "canceled", cancel_at_period_end: false,
    items: { data: [{ price: { id: "price_maxi" }, current_period_end: Math.floor(Date.now() / 1000) }] } }));
  plan = await prisma.workspacePlan.findUnique({ where: { workspaceId: wsB } });
  assert.equal(plan.status, "CANCELED");

  const portal = await B.json("/api/stripe/portal", { method: "POST" });
  assert.equal(portal.status, 200);
  const pcall = fakes.calls.filter((c) => c.path === "/v1/billing_portal/sessions").at(-1);
  assert.equal(pcall.params.customer, "cus_B");
});

test("Erstattung einer Abo-Zahlung wird verbucht, das Abo entscheidet der Betreiber", async () => {
  const wsA = await workspaceIdOf("a@example.test");
  const charge = { id: "ch_A", object: "charge", payment_intent: "pi_A_invoice", customer: "cus_A", amount: 59679, amount_refunded: 20000, refunded: false, currency: "eur" };
  await webhook(event("charge.refunded", charge));
  await webhook(event("charge.refunded", { ...charge, amount_refunded: 59679, refunded: true }));
  const plan = await prisma.workspacePlan.findUnique({ where: { workspaceId: wsA } });
  assert.equal(plan.status, "ACTIVE"); // Kündigung/Sperre nur bewusst über Stripe
  const refunds = await prisma.operatorPayment.findMany({ where: { kind: "REFUND", workspaceId: wsA } });
  assert.equal(refunds.length, 1); // kumulativer Stand, nicht doppelt
  assert.equal(refunds[0].amount, 59679);
});

test("Review-Befunde: Mehrfachaufträge, 100-%-Rabatt, Reihenfolge der Events, doppelte Checkouts, Stimmen", async () => {
  const wsA = await workspaceIdOf("a@example.test");
  const period = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
  const key = { workspaceId_metric_period: { workspaceId: wsA, metric: "AI_TEXT", period } };
  // Content Brain: 3 Plattformen (eine doppelt) x 2 Beiträge = 6 Einheiten, nicht 1
  await prisma.usageCounter.update({ where: key, data: { used: 0 } });
  const cb = await A.json("/api/content-brain", { method: "POST", body: { topic: "Mehrfachauftrag", platforms: ["YOUTUBE", "TIKTOK", "TIKTOK", "INSTAGRAM"], itemsPerPlatform: 2 } });
  assert.equal(cb.status, 200, JSON.stringify(cb.data));
  assert.equal((await prisma.usageCounter.findUnique({ where: key })).used, 6);
  const tooMany = await A.json("/api/content-brain", { method: "POST", body: { topic: "Zu viele", platforms: Array(50).fill("YOUTUBE") } });
  assert.equal(tooMany.status, 400);

  // Doppelter Checkout: der frühere offene wird beendet
  const c = await signup("c@example.test", "Firma C");
  const wsC = await workspaceIdOf("c@example.test");
  const s1 = (await c.json("/api/stripe/checkout", { method: "POST", body: { plan: "pro", confirmed: true } })).data.url.split("/").pop();
  const s2 = (await c.json("/api/stripe/checkout", { method: "POST", body: { plan: "pro", confirmed: true } })).data.url.split("/").pop();
  assert.equal((await prisma.planCheckout.findUnique({ where: { id: s1 } })).status, "EXPIRED");
  assert.equal((await prisma.planCheckout.findUnique({ where: { id: s2 } })).status, "OPEN");

  // 100-%-Aktionscode: no_payment_required schaltet frei
  const freeSession = { id: s2, object: "checkout.session", mode: "subscription", payment_status: "no_payment_required",
    amount_subtotal: 59000, amount_total: 0, currency: "eur", customer: "cus_C", payment_intent: null, subscription: "sub_C", metadata: {} };
  await webhook(event("checkout.session.completed", freeSession));
  let planC = await prisma.workspacePlan.findUnique({ where: { workspaceId: wsC } });
  assert.equal(planC.status, "ACTIVE");
  assert.equal(planC.plan, "PRO");

  // Events ohne feste Reihenfolge: ein später eintreffendes "unbezahlt" nimmt nichts zurück
  await webhook(event("checkout.session.completed", { ...freeSession, payment_status: "unpaid" }));
  await webhook(event("checkout.session.async_payment_failed", freeSession));
  planC = await prisma.workspacePlan.findUnique({ where: { workspaceId: wsC } });
  assert.equal(planC.status, "ACTIVE");
  // Laufendes Abo: kein zweiter Checkout (auch nicht für Maxi), Wechsel über das Portal
  assert.equal((await c.json("/api/stripe/checkout", { method: "POST", body: { plan: "maxi", confirmed: true } })).status, 409);

  // Stimmen: fremde/beliebige IDs werden nicht an den Anbieter weitergereicht
  const voice = await A.json("/api/voices/preview", { method: "POST", body: { text: "Hallo", voiceId: "../../v1/user" } });
  assert.ok([404, 422].includes(voice.status), String(voice.status));
});

test("Betreiber: geschützte Einrichtung, Dashboard ohne Kundeninhalte, kein Zugriff für Kunden", async () => {
  const op = new Client();
  const wrong = await op.json("/api/auth/setup-operator", { method: "POST", body: { setupToken: "x".repeat(40), email: "op@example.test", name: "Op", password: "betreiber-passwort-123" } });
  assert.equal(wrong.status, 403);
  const ok = await op.json("/api/auth/setup-operator", { method: "POST", body: { setupToken: SETUP_TOKEN, email: "op@example.test", name: "Op", password: "betreiber-passwort-123" } });
  assert.equal(ok.status, 200);
  const again = await new Client().json("/api/auth/setup-operator", { method: "POST", body: { setupToken: SETUP_TOKEN, email: "op2@example.test", name: "Op2", password: "betreiber-passwort-123" } });
  assert.equal(again.status, 409);

  const page = await op.req("/operator");
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.ok(html.includes("123,45"), "verfügbares Stripe-Guthaben fehlt"); // aus balance.available
  assert.ok(html.includes("5,00"), "ausstehendes Guthaben fehlt");
  assert.ok(html.includes("596,79") && html.includes("948,43"), "Paketzahlungen fehlen");
  assert.ok(html.includes("246,72"), "Umsatzsteueranteil fehlt");
  assert.ok(!html.includes("Geheime Idee von A") && !html.includes("Geheimes Skript A"));

  const asCustomer = await A.req("/operator");
  assert.equal(asCustomer.status, 307);
});

test("Händlerkonten, Verkäufe und Importe bleiben getrennt und doppelt-sicher", async () => {
  const wsA = await workspaceIdOf("a@example.test");
  const wsB = await workspaceIdOf("b@example.test");
  const onboard = await A.json("/api/sales/onboarding", { method: "POST" });
  assert.equal(onboard.status, 200);
  const acctCall = fakes.calls.filter((c) => c.path === "/v1/accounts" && c.method === "POST").at(-1);
  assert.equal(acctCall.params["controller[fees][payer]"], "account");
  assert.equal(acctCall.params["controller[losses][payments]"], "stripe");
  const merchantA = await prisma.merchantAccount.findUnique({ where: { workspaceId: wsA } });
  assert.ok(merchantA);
  await B.json("/api/sales/onboarding", { method: "POST" });
  const merchantB = await prisma.merchantAccount.findUnique({ where: { workspaceId: wsB } });
  assert.notEqual(merchantA.stripeAccountId, merchantB.stripeAccountId);

  // Connect-Event mit falschem Schlüssel wird abgelehnt
  const upd = event("account.updated", { id: merchantA.stripeAccountId, object: "account", charges_enabled: true, payouts_enabled: true, details_submitted: true, requirements: { currently_due: [] } }, { account: merchantA.stripeAccountId });
  assert.equal((await webhook(upd, { path: "/api/stripe/connect-webhook", secret: WHSEC })).status, 400);
  assert.equal((await webhook(upd, { path: "/api/stripe/connect-webhook", secret: WHSEC_CONNECT })).status, 200);
  assert.equal((await prisma.merchantAccount.findUnique({ where: { workspaceId: wsA } })).chargesEnabled, true);

  const product = await A.json("/api/sales/products", { method: "POST", body: { name: "Beratung", amount: 4900, currency: "eur" } });
  assert.equal(product.status, 200);
  // B kann A's Produkt nicht ändern
  assert.equal((await B.req(`/api/sales/products/${product.data.product.id}`, { method: "PATCH", body: { active: false } })).status, 404);

  // Ohne eigene Anbieterangaben (Impressum) ist das Angebot nicht öffentlich und nicht kaufbar
  const pid = product.data.product.id;
  assert.equal((await fetch(`${BASE}/shop/${pid}`)).status, 404);
  assert.equal((await fetch(`${BASE}/api/shop/${pid}/checkout`, { method: "POST", headers: ORIGIN_HDR })).status, 404);
  // Unsichere Links werden abgelehnt
  const legalBase = { anbieter: "Anna Händlerin", firma: "", anschrift: "Marktweg 7\n12345 Handelstadt", email: "shop-a@example.test",
    telefon: "", ustId: "", register: "", aufsicht: "", verantwortlich: "", agbUrl: "", datenschutzUrl: "https://shop-a.example/datenschutz", widerrufUrl: "" };
  assert.equal((await A.json("/api/sales/legal", { method: "PUT", body: { ...legalBase, datenschutzUrl: "javascript:alert(1)" } })).status, 400);
  const saved = await A.json("/api/sales/legal", { method: "PUT", body: legalBase });
  assert.equal(saved.status, 200);
  assert.deepEqual(saved.data.missing, []);
  // B sieht A's Angaben nicht über die eigene Schnittstelle
  assert.equal((await B.json("/api/sales/legal")).data.profile, null);
  const shopHtml = await (await fetch(`${BASE}/shop/${pid}`)).text();
  assert.ok(shopHtml.includes("Anna Händlerin") && shopHtml.includes(`/shop/${pid}/impressum`) && shopHtml.includes("https://shop-a.example/datenschutz"));
  const sellerImp = await (await fetch(`${BASE}/shop/${pid}/impressum`)).text();
  assert.ok(sellerImp.includes("Marktweg 7") && sellerImp.includes("12345 Handelstadt") && sellerImp.includes("shop-a@example.test"));
  assert.ok(!sellerImp.includes("Test Anbieter"), "Impressum des Betreibers darf nicht als Verkäufer erscheinen");

  // Öffentlicher Kauf: Direct Charge auf A's Konto, Betrag aus der Datenbank
  const buyer = await fetch(`${BASE}/api/shop/${product.data.product.id}/checkout`, { method: "POST", headers: ORIGIN_HDR });
  assert.equal(buyer.status, 200);
  const call = fakes.calls.filter((c) => c.path === "/v1/checkout/sessions").at(-1);
  assert.equal(call.stripeAccount, merchantA.stripeAccountId);
  assert.equal(call.params["line_items[0][price_data][unit_amount]"], "4900");
  assert.equal(call.params["payment_intent_data[application_fee_amount]"], undefined);

  const paymentsBefore = await prisma.operatorPayment.count();
  const sale = event("checkout.session.completed", { id: "cs_shop_1", object: "checkout.session", mode: "payment", payment_status: "paid",
    amount_total: 4900, currency: "eur", payment_intent: "pi_shop_1", created: 1790000000, metadata: { workspaceId: wsA, productName: "Beratung" } },
    { account: merchantA.stripeAccountId });
  await webhook(sale, { path: "/api/stripe/connect-webhook", secret: WHSEC_CONNECT });
  await webhook(sale, { path: "/api/stripe/connect-webhook", secret: WHSEC_CONNECT });
  // Gleiches Event, aber von B's Konto mit A's workspaceId in den Metadaten -> darf A nicht gutgeschrieben werden
  const spoof = event("checkout.session.completed", { id: "cs_shop_2", object: "checkout.session", mode: "payment", payment_status: "paid",
    amount_total: 999999, currency: "eur", payment_intent: "pi_shop_spoof", created: 1790000000, metadata: { workspaceId: wsA } },
    { account: merchantB.stripeAccountId });
  await webhook(spoof, { path: "/api/stripe/connect-webhook", secret: WHSEC_CONNECT });

  const salesA = await prisma.customerSale.findMany({ where: { workspaceId: wsA } });
  assert.equal(salesA.length, 1);
  assert.equal(salesA[0].amount, 4900);
  assert.equal(await prisma.customerSale.count({ where: { workspaceId: wsB } }), 0);
  assert.equal(await prisma.operatorPayment.count(), paymentsBefore, "Kundenverkäufe dürfen nicht in Paketumsätzen landen");

  // Import: derselbe Verkauf (pi_shop_1) wird übersprungen, ein neuer importiert
  const csv = "external_id;date;amount;currency;product\npi_shop_1;2026-09-30;49,00;EUR;Beratung\nshop-77;2026-09-29;1.234,50;CHF;Kurs\n";
  const imp = await A.json("/api/sales/import", { method: "POST", raw: csv, headers: { "content-type": "text/csv" } });
  assert.equal(imp.status, 200);
  assert.equal(imp.data.imported, 1);
  assert.equal(imp.data.duplicates, 1);
  const chf = await prisma.customerSale.findFirst({ where: { workspaceId: wsA, externalId: "shop-77" } });
  assert.equal(chf.amount, 123450);
  assert.equal(chf.currency, "chf");

  // Erstattung im Händlerkonto
  await webhook(event("charge.refunded", { id: "ch_shop", object: "charge", payment_intent: "pi_shop_1", amount_refunded: 1000, refunded: false, currency: "eur" },
    { account: merchantA.stripeAccountId }), { path: "/api/stripe/connect-webhook", secret: WHSEC_CONNECT });
  const refunded = await prisma.customerSale.findFirst({ where: { workspaceId: wsA, externalId: "pi_shop_1" } });
  assert.equal(refunded.refundedAmount, 1000);
  assert.equal(refunded.status, "PARTIALLY_REFUNDED");
});

test("Webseiten-Widget: nur bestätigte Domain, nur freigegebener Ursprung, widerrufbar", async () => {
  const site = await prisma.websiteConnection.findFirst({ where: { workspaceId: await workspaceIdOf("a@example.test"), revokedAt: null } });
  const siteOrigin = `http://localhost:${fakes.sitePort}`;
  assert.equal(site.origin, siteOrigin);
  const chat = (origin) =>
    fetch(`${BASE}/api/widget/${site.publicKey}/chat`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ messages: [{ role: "user", content: "Was macht ihr?" }] }),
    });
  assert.equal((await chat(siteOrigin)).status, 403); // noch nicht bestätigt

  assert.equal((await A.json(`/api/websites/${site.id}/verify`, { method: "POST" })).status, 422);
  fakes.site.verifyText = site.verifyToken;
  assert.equal((await A.json(`/api/websites/${site.id}/verify`, { method: "POST" })).status, 200);
  assert.equal((await B.json(`/api/websites/${site.id}/verify`, { method: "POST" })).status, 404);

  fakes.site.homepage = `<html><body><script src="${BASE}/widget.js" data-secret58-key="${site.publicKey}" async></script></body></html>`;
  const t = await A.json(`/api/websites/${site.id}/test`, { method: "POST" });
  assert.deepEqual(t.data, { verified: true, embedFound: true });

  assert.equal((await chat("https://fremde-seite.example")).status, 403);
  const okRes = await chat(siteOrigin);
  assert.equal(okRes.status, 200);
  assert.equal(okRes.headers.get("access-control-allow-origin"), siteOrigin);
  const body = await okRes.json();
  assert.ok(body.reply);
  // Der Webseiten-Assistent bekommt keine privaten Inhalte des Arbeitsbereichs.
  const aiCall = fakes.calls.filter((c) => c.path === "/v1/messages").at(-1);
  assert.ok(aiCall.raw.includes("Firma A"), "Markenname sollte im Prompt stehen");
  assert.ok(!aiCall.raw.includes("Geheime Idee von A") && !aiCall.raw.includes("Geheimes Skript A") && !aiCall.raw.includes("Sponsor A"));

  const widgetJs = await (await fetch(`${BASE}/widget.js`)).text();
  assert.ok(!/sk_|whsec_|sk-ant|ANTHROPIC/.test(widgetJs));

  assert.equal((await B.req(`/api/websites/${site.id}`, { method: "DELETE" })).status, 404);
  assert.equal((await A.req(`/api/websites/${site.id}`, { method: "DELETE" })).status, 200);
  assert.equal((await chat(siteOrigin)).status, 403);
});

test("Datenlöschung: eigener Arbeitsbereich wird vollständig entfernt", async () => {
  const c = await signup("loeschen@example.test", "Löschfirma");
  const ws = await workspaceIdOf("loeschen@example.test");
  await c.json("/api/ideas", { method: "POST", body: { title: "weg damit" } });
  assert.equal((await c.json("/api/account/delete", { method: "POST", body: { password: "falsch", confirm: "LÖSCHEN" } })).status, 403);
  assert.equal((await c.json("/api/account/delete", { method: "POST", body: { password: "sehr-sicheres-passwort-123", confirm: "LÖSCHEN" } })).status, 200);
  assert.equal(await prisma.workspace.findUnique({ where: { id: ws } }), null);
  assert.equal(await prisma.contentIdea.count({ where: { workspaceId: ws } }), 0);
  assert.equal((await c.req("/api/ideas")).status, 401);
});

// ---------------------------------------------------------------------------
// Composio: Verbinden, Zuordnung zum richtigen Kunden, Lesetest, Erneuern, Trennen
function composioCalls(pathPart, method) {
  return fakes.calls.filter((c) => c.path.includes(pathPart) && (!method || c.method === method));
}

/** Startet die Verbindung und liefert die Rückkehr-Adresse (wie Composio sie aufrufen würde). */
async function composioStart(client, toolkit) {
  const r = await client.json("/api/composio/connect", { method: "POST", body: { toolkit } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.match(r.data.redirectUrl, /^https:\/\/connect\.composio\.test\/link\/ca_test_\d+$/);
  const linkCall = composioCalls("/api/v3/connected_accounts/link", "POST").at(-1);
  const accountId = r.data.redirectUrl.split("/").pop();
  const callback = new URL(linkCall.composioBody.callback_url);
  callback.searchParams.set("status", "success");
  callback.searchParams.set("connected_account_id", accountId);
  return { accountId, callback: callback.pathname + callback.search, linkBody: linkCall.composioBody };
}

test("Composio: Seite zeigt Status ehrlich, Server-Schlüssel erscheint nie im Browser", async () => {
  const page = await A.req("/social-media");
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.ok(html.includes("Konto verbinden über Composio"));
  assert.ok(html.includes("Noch nicht eingerichtet"), "LinkedIn/Facebook ohne Auth-Config müssen als nicht eingerichtet erscheinen");
  assert.ok(!html.includes("ck_test_fake") && !html.includes("ac_instagram"), "Schlüssel oder Auth-Config im HTML");
  const nope = await A.json("/api/composio/connect", { method: "POST", body: { toolkit: "LINKEDIN" } });
  assert.equal(nope.status, 502);
  assert.match(nope.data.error, /noch nicht eingerichtet/);
  const unknown = await A.json("/api/composio/connect", { method: "POST", body: { toolkit: "MYSPACE" } });
  assert.equal(unknown.status, 400);
  assert.equal((await new Client().req("/api/composio/connect", { method: "POST", body: { toolkit: "INSTAGRAM" } })).status, 401);
});

test("Composio: Verbinden ordnet das Konto genau dem eigenen Arbeitsbereich zu", async () => {
  const wsA = await workspaceIdOf("a@example.test");
  const { accountId, callback, linkBody } = await composioStart(A, "INSTAGRAM");
  assert.equal(linkBody.user_id, `s58-ws-${wsA}`);
  assert.equal(linkBody.auth_config_id, "ac_instagram");
  assert.equal(linkBody.allow_multiple, false);
  assert.ok(linkBody.callback_url.startsWith(`${BASE}/api/composio/callback?toolkit=INSTAGRAM&state=`), linkBody.callback_url);

  // B kann A's Rückkehr-Adresse nicht für sich nutzen.
  const stolen = await B.req(callback);
  assert.equal(stolen.status, 307);
  assert.match(stolen.headers.get("location"), /composio_error=invalid_state/);
  // Ohne Sitzung (z. B. anderer Browser auf dem Handy): erst anmelden, dann derselbe Link.
  const anon = await new Client().req(callback);
  assert.equal(anon.status, 307);
  const loginUrl = new URL(anon.headers.get("location"), BASE);
  assert.equal(loginUrl.pathname, "/login");
  assert.equal(loginUrl.searchParams.get("next"), callback);

  const ok = await A.req(callback);
  assert.equal(ok.status, 307);
  assert.match(ok.headers.get("location"), /composio_connected=INSTAGRAM/);
  const row = await prisma.composioConnection.findUniqueOrThrow({ where: { workspaceId_toolkit: { workspaceId: wsA, toolkit: "INSTAGRAM" } } });
  assert.equal(row.status, "ACTIVE");
  assert.equal(row.connectedAccountId, accountId);
  assert.equal(row.stateHash, null);
  // Zweite Verwendung derselben Rückkehr-Adresse ist wirkungslos.
  assert.match((await A.req(callback)).headers.get("location"), /composio_error=invalid_state/);
  assert.equal(await prisma.composioConnection.count({ where: { workspaceId: await workspaceIdOf("b@example.test") } }), 0);
});

test("Composio: fremdes oder nicht bestätigtes Konto wird nicht übernommen", async () => {
  const wsA = await workspaceIdOf("a@example.test");
  const wsB = await workspaceIdOf("b@example.test");
  const { accountId, callback } = await composioStart(B, "INSTAGRAM");
  fakes.composio.accounts.get(accountId).user_id = `s58-ws-${wsA}`; // Composio liefert ein Konto eines anderen Kunden
  assert.match((await B.req(callback)).headers.get("location"), /composio_error=mismatch/);
  let row = await prisma.composioConnection.findUniqueOrThrow({ where: { workspaceId_toolkit: { workspaceId: wsB, toolkit: "INSTAGRAM" } } });
  assert.notEqual(row.status, "ACTIVE");
  assert.equal(row.connectedAccountId, null);

  fakes.composio.nextStatus = "FAILED";
  try {
    const second = await composioStart(B, "INSTAGRAM");
    assert.match((await B.req(second.callback)).headers.get("location"), /composio_error=not_active/);
  } finally {
    fakes.composio.nextStatus = "ACTIVE";
  }
  row = await prisma.composioConnection.findUniqueOrThrow({ where: { id: row.id } });
  assert.equal(row.status, "FAILED");
  assert.ok(row.lastError);

  // Manipulierte Konto-ID in der Rückkehr-Adresse
  const third = await composioStart(B, "INSTAGRAM");
  const forged = third.callback.replace(/connected_account_id=[^&]+/, "connected_account_id=ca_test_1");
  assert.match((await B.req(forged)).headers.get("location"), /composio_error=mismatch/);
});

test("Composio: Lesetest, Kundentrennung, Erneuern und Trennen", async () => {
  const wsA = await workspaceIdOf("a@example.test");
  const row = await prisma.composioConnection.findUniqueOrThrow({ where: { workspaceId_toolkit: { workspaceId: wsA, toolkit: "INSTAGRAM" } } });

  // B sieht und steuert A's Verbindung nicht.
  assert.equal((await B.json(`/api/composio/${row.id}/test`, { method: "POST" })).status, 404);
  assert.equal((await B.json(`/api/composio/${row.id}/disconnect`, { method: "POST" })).status, 404);

  const test1 = await A.json(`/api/composio/${row.id}/test`, { method: "POST" });
  assert.equal(test1.status, 200);
  assert.equal(test1.data.ok, true);
  assert.equal(test1.data.label, `konto_${row.connectedAccountId}`);
  const exec = composioCalls("/api/v3/tools/execute/INSTAGRAM_GET_USER_INFO", "POST").at(-1);
  assert.equal(exec.composioBody.connected_account_id, row.connectedAccountId);
  assert.equal(exec.composioBody.user_id, `s58-ws-${wsA}`);
  assert.equal(composioCalls("/api/v3/tools/execute/", "POST").filter((c) => !/GET|LIST|STATISTICS|INFO/.test(c.path)).length, 0, "nur Lese-Werkzeuge");

  fakes.composio.failExecute = true;
  try {
    const test2 = await A.json(`/api/composio/${row.id}/test`, { method: "POST" });
    assert.equal(test2.data.ok, false);
    assert.match(test2.data.error, /insufficient scope/);
  } finally {
    fakes.composio.failExecute = false;
  }
  const html = await (await A.req("/social-media")).text();
  assert.ok(html.includes("Lesetest fehlgeschlagen"));

  // Erneuern: alte Verbindung bleibt bis zur erfolgreichen Rückkehr, danach gelöscht.
  const oldId = row.connectedAccountId;
  const renew = await composioStart(A, "INSTAGRAM");
  assert.equal(renew.linkBody.allow_multiple, true);
  assert.equal((await prisma.composioConnection.findUniqueOrThrow({ where: { id: row.id } })).connectedAccountId, oldId);
  assert.match((await A.req(renew.callback)).headers.get("location"), /composio_connected=INSTAGRAM/);
  const renewed = await prisma.composioConnection.findUniqueOrThrow({ where: { id: row.id } });
  assert.equal(renewed.connectedAccountId, renew.accountId);
  assert.equal(renewed.lastReadTestOk, null);
  assert.ok(composioCalls(`/api/v3/connected_accounts/${oldId}`, "DELETE").length === 1);
  assert.equal(fakes.composio.accounts.has(oldId), false);

  const off = await A.json(`/api/composio/${row.id}/disconnect`, { method: "POST" });
  assert.equal(off.status, 200);
  const gone = await prisma.composioConnection.findUniqueOrThrow({ where: { id: row.id } });
  assert.equal(gone.status, "DISCONNECTED");
  assert.equal(gone.connectedAccountId, null);
  assert.equal(fakes.composio.accounts.has(renew.accountId), false);
  assert.equal((await A.json(`/api/composio/${row.id}/test`, { method: "POST" })).status, 409);
  const audit = await prisma.auditLog.findMany({ where: { workspaceId: wsA, action: { startsWith: "composio." } } });
  assert.ok(audit.some((a) => a.action === "composio.connected") && audit.some((a) => a.action === "composio.disconnected"));
});

test("Composio: Kontolöschung entfernt verbundene Konten auch bei Composio", async () => {
  const c = new Client();
  const su = await c.json("/api/auth/signup", {
    method: "POST",
    headers: { "x-forwarded-for": "10.9.9.9" }, // eigene Adresse, unabhängig von der Registrierungsgrenze der übrigen Tests
    body: { email: "composio-weg@example.test", password: "sehr-sicheres-passwort-123", name: "W", workspaceName: "Composio Weg", acceptProcessing: true },
  });
  assert.equal(su.status, 200, JSON.stringify(su.data));
  const { accountId, callback } = await composioStart(c, "YOUTUBE");
  assert.match((await c.req(callback)).headers.get("location"), /composio_connected=YOUTUBE/);
  assert.ok(fakes.composio.accounts.has(accountId));
  const del = await c.json("/api/account/delete", { method: "POST", body: { password: "sehr-sicheres-passwort-123", confirm: "LÖSCHEN" } });
  assert.equal(del.status, 200);
  assert.equal(fakes.composio.accounts.has(accountId), false);
});

test("Health-Endpunkt: ohne Anmeldung erreichbar, meldet nur Zustand", async () => {
  const r = await fetch(`${BASE}/api/health`);
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.deepEqual(data, { ok: true, checks: { datenbank: "ok", medienablage: "ok" } });
});

test("Verkaufsseite (aus der Zentrale): Pakete aus der App, Kaufweg über Anmeldung, alte Adresse leitet um", async () => {
  const html = await (await fetch(`${BASE}/buy?plan=maxi`)).text();
  assert.ok(html.includes('class="zentrale"'), "Zentrale-Gestaltung fehlt");
  assert.ok(html.includes("Social Media KI") && html.includes("Ehrliche Grenzen"));
  assert.ok(/590,00\s*€/.test(html) && /797,00\s*€/.test(html), "Preise aus plans.ts fehlen");
  assert.ok(html.includes('href="/signup?plan=pro"') && html.includes('href="/signup?plan=maxi"'), "Kaufweg ohne Anmeldung falsch");
  assert.ok(/id="paket-maxi" class="preis-karte[^"]*ausgewaehlt/.test(html), "Vorauswahl wird nicht hervorgehoben");
  // Jahrespreise für Pro im Test eingerichtet, für Maxi nicht → nur Pro zeigt das Jahresabo.
  assert.ok(/6\.018,00\s*€/.test(html), "Jahrespreis Pro fehlt");
  assert.ok(!/8\.129,40\s*€/.test(html), "Jahrespreis Maxi darf ohne eingerichteten Stripe-Preis nicht erscheinen");
  const angemeldet = await (await A.req("/buy")).text();
  assert.ok(angemeldet.includes('href="/billing?plan=pro"'));
  const alt = await fetch(`${BASE}/social-media-ki?vorauswahl=pro`, { redirect: "manual" });
  assert.equal(alt.status, 307);
  assert.match(alt.headers.get("location"), /\/buy\?plan=pro/);
  assert.equal((await fetch(`${BASE}/zentrale/archivo-latin.woff2`)).status, 200);
});

test("Jahresabo: richtiger Stripe-Preis, Freischaltung per Webhook, Maxi ohne Jahrespreis gesperrt", async () => {
  const c = new Client();
  const su = await c.json("/api/auth/signup", {
    method: "POST",
    headers: { "x-forwarded-for": "10.9.9.10" },
    body: { email: "jahr@example.test", password: "sehr-sicheres-passwort-123", name: "J", workspaceName: "Jahresfirma", acceptProcessing: true },
  });
  assert.equal(su.status, 200, JSON.stringify(su.data));
  const ws = await workspaceIdOf("jahr@example.test");

  assert.equal((await c.json("/api/stripe/checkout", { method: "POST", body: { plan: "pro", interval: "woche", confirmed: true } })).status, 400);
  const maxi = await c.json("/api/stripe/checkout", { method: "POST", body: { plan: "maxi", interval: "year", confirmed: true } });
  assert.equal(maxi.status, 503);
  assert.match(maxi.data.error, /Jahresabo .* noch nicht eingerichtet/);

  const r = await c.json("/api/stripe/checkout", { method: "POST", body: { plan: "pro", interval: "year", confirmed: true } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const call = fakes.calls.filter((x) => x.path === "/v1/checkout/sessions" && x.method === "POST").at(-1);
  assert.equal(call.params["line_items[0][price]"], "price_pro_year");
  assert.equal(call.params["mode"], "subscription");
  assert.equal(call.params["subscription_data[metadata][interval]"], "year");
  const sessionId = r.data.url.split("/").pop();
  const order = await prisma.planCheckout.findUniqueOrThrow({ where: { id: sessionId } });
  assert.equal(order.expectedAmount, 601800);

  const done = await webhook(event("checkout.session.completed", {
    id: sessionId, object: "checkout.session", mode: "subscription", payment_status: "paid", amount_subtotal: 601800,
    amount_total: 716142, currency: "eur", customer: "cus_J", payment_intent: null, subscription: "sub_J", metadata: {},
  }));
  assert.equal((await done.json()).result, "processed");
  const plan = await prisma.workspacePlan.findUniqueOrThrow({ where: { workspaceId: ws } });
  assert.equal(plan.plan, "PRO");
  assert.equal(plan.stripePriceId, "price_pro_year");
  const billing = await (await c.req("/billing")).text();
  assert.ok(billing.includes("Jahresabo"), "aktives Jahresabo wird nicht angezeigt");
});

test("Freigabe-Workflow: Planen/Veröffentlichen nur nach Freigabe, Änderung entzieht Freigabe, Doppelversand gesperrt", async () => {
  const created = await A.json("/api/content-items", { method: "POST", body: { title: "Workflow-Test", platform: "YOUTUBE", script: "Hallo" } });
  assert.equal(created.status, 200, JSON.stringify(created.data));
  const id = created.data.item.id;
  const status = (action, extra = {}) => A.json(`/api/content-items/${id}/status`, { method: "POST", body: { action, ...extra } });
  const future = new Date(Date.now() + 3 * 86400_000).toISOString();

  // Ohne Freigabe: weder planen noch veröffentlichen
  assert.equal((await status("schedule", { scheduledAt: future })).status, 409);
  assert.equal((await status("publish")).status, 409);
  assert.equal((await prisma.contentItem.findUniqueOrThrow({ where: { id } })).status, "DRAFT");

  // Freigeben, dann ändern → Freigabe entzogen
  assert.equal((await status("approve")).status, 200);
  const edit = await A.json(`/api/content-items/${id}`, { method: "PATCH", body: { title: "Workflow-Test geändert" } });
  assert.equal(edit.status, 200);
  assert.equal(edit.data.approvalRevoked, true);
  assert.equal(edit.data.item.status, "IN_REVIEW");
  assert.equal((await status("schedule", { scheduledAt: future })).status, 409);

  // Erneut freigeben und planen; Termin in der Vergangenheit abgelehnt
  assert.equal((await status("approve")).status, 200);
  assert.equal((await status("schedule", { scheduledAt: "2020-01-01T10:00:00Z" })).status, 400);
  assert.equal((await status("schedule", { scheduledAt: future })).status, 200);
  // Speichern ohne inhaltliche Änderung lässt die Freigabe bestehen
  const same = await A.json(`/api/content-items/${id}`, { method: "PATCH", body: { title: "Workflow-Test geändert" } });
  assert.equal(same.data.approvalRevoked, false);
  assert.equal(same.data.item.status, "SCHEDULED");

  // Doppelversand: laufende Sperre → 409; verfallene Sperre (> 10 Min.) → erlaubt
  await prisma.contentItem.update({ where: { id }, data: { publishingStartedAt: new Date() } });
  assert.equal((await status("publish")).status, 409);
  await prisma.contentItem.update({ where: { id }, data: { publishingStartedAt: new Date(Date.now() - 11 * 60_000) } });
  const pub = await status("publish");
  assert.equal(pub.status, 200);
  assert.equal(pub.data.published, false); // YouTube ist nicht verbunden — ehrliche Meldung, kein Schein-Erfolg
  const after = await prisma.contentItem.findUniqueOrThrow({ where: { id } });
  assert.equal(after.publishingStartedAt, null, "Sperre nach dem Versuch nicht freigegeben");
  assert.equal(after.status, "SCHEDULED");

  // KI-Hashtags ändern einen geplanten Beitrag → Freigabe entzogen
  const tags = await A.json(`/api/content-items/${id}/hashtags`, { method: "POST" });
  assert.equal(tags.status, 200, JSON.stringify(tags.data));
  assert.equal(tags.data.approvalRevoked, true);
  assert.equal((await prisma.contentItem.findUniqueOrThrow({ where: { id } })).status, "IN_REVIEW");

  // B kann A's Beitrag weder freigeben noch veröffentlichen
  assert.equal((await B.json(`/api/content-items/${id}/status`, { method: "POST", body: { action: "approve" } })).status, 404);
});

test("Planen legt einen Versandauftrag an; Ablehnen verwirft ihn; Detailseite zeigt den Stand", async () => {
  const created = await A.json("/api/content-items", { method: "POST", body: { title: "Auftrag-Test", platform: "LINKEDIN", script: "x" } });
  const id = created.data.item.id;
  const status = (action, extra = {}) => A.json(`/api/content-items/${id}/status`, { method: "POST", body: { action, ...extra } });
  assert.equal((await status("approve")).status, 200);
  const when = new Date(Date.now() + 2 * 3600_000);
  const s = await status("schedule", { scheduledAt: when.toISOString() });
  assert.equal(s.status, 200);
  const job = await prisma.publishJob.findUniqueOrThrow({ where: { id: s.data.jobId } });
  assert.equal(job.status, "QUEUED");
  assert.equal(job.scheduledFor.getTime(), when.getTime());
  const html = await (await A.req(`/content-factory/${id}`)).text();
  assert.ok(html.includes("Automatischer Versand geplant"), "Versandstatus fehlt auf der Detailseite");
  // Neu planen ersetzt den Auftrag
  const s2 = await status("schedule", { scheduledAt: new Date(Date.now() + 5 * 3600_000).toISOString() });
  assert.equal((await prisma.publishJob.findUniqueOrThrow({ where: { id: job.id } })).status, "CANCELED");
  assert.equal(await prisma.publishJob.count({ where: { contentItemId: id, status: "QUEUED" } }), 1);
  assert.equal((await status("reject", { reason: "doch nicht" })).status, 200);
  assert.equal((await prisma.publishJob.findUniqueOrThrow({ where: { id: s2.data.jobId } })).status, "CANCELED");
});

test("Zeitzone: Termine erscheinen in deutscher Zeit, nicht in Server-UTC", async () => {
  const created = await A.json("/api/content-items", { method: "POST", body: { title: "Zeitzonen-Test", platform: "LINKEDIN", script: "x" } });
  const id = created.data.item.id;
  await A.json(`/api/content-items/${id}/status`, { method: "POST", body: { action: "approve" } });
  // 15.01.2030 10:00 UTC = 11:00 Uhr in Berlin (Winterzeit)
  const s = await A.json(`/api/content-items/${id}/status`, { method: "POST", body: { action: "schedule", scheduledAt: "2030-01-15T10:00:00.000Z" } });
  assert.equal(s.status, 200);
  const html = await (await A.req(`/content-factory/${id}`)).text();
  assert.ok(html.includes("11:00"), "Termin wird nicht in Europe/Berlin angezeigt");
  assert.ok(!/15\.01\.2030,? 10:00/.test(html), "Termin erscheint in UTC");
});

test("Zentrale-Seiten: öffentlich erreichbar, Gestaltung geladen, kein interner Link ins Leere", async () => {
  const pages = ["/ueber-uns", "/ki-dienstleistungen", "/ki-agenten", "/ki-automation", "/ki-beratung", "/ki-schulung", "/webdesign",
    "/webseiten-aufbau", "/content-erstellung", "/social-media-betreuung", "/referenz", "/portfolio", "/preise", "/faq", "/kontakt",
    "/demo", "/praesentationen", "/agb", "/datenschutz"];
  const links = new Set();
  for (const p of pages) {
    const r = await fetch(`${BASE}${p}`, { redirect: "manual" });
    assert.equal(r.status, 200, p);
    const html = await r.text();
    assert.ok(html.includes("— Secret 58</title>"), `Titel fehlt: ${p}`);
    assert.ok(html.includes('href="/zentrale/assets/seite.css"'), `Gestaltung fehlt: ${p}`);
    assert.ok(!html.includes("secret58-web.onrender.com"), `alte Adresse: ${p}`);
    for (const m of html.matchAll(/href="(\/[^"#]*)"/g)) links.add(m[1]);
  }
  for (const link of links) {
    const r = await fetch(`${BASE}${link}`, { redirect: "manual" });
    assert.ok([200, 307, 308].includes(r.status), `Link ${link} → ${r.status}`);
  }
  assert.equal((await fetch(`${BASE}/zentrale/assets/seite.css`)).status, 200);
  // Besucher auf "/" → Startseite der Zentrale; angemeldet → Arbeitsbereich
  const home = await fetch(`${BASE}/`, { redirect: "manual" });
  assert.equal(home.status, 200);
  const homeHtml = await home.text();
  assert.ok(homeHtml.includes('id="kontaktform"') && homeHtml.includes("/zentrale/assets/kern-bild.js"), "Zentrale-Startseite fehlt");
  assert.ok(homeHtml.includes('id="app-ausgeblendet"'), "nicht nachgebaute Teile müssen ausgeblendet sein");
  for (const m of homeHtml.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) links.add(m[1]);
  for (const link of links) {
    const r = await fetch(`${BASE}${link}`, { redirect: "manual" });
    assert.ok([200, 307, 308].includes(r.status), `Startseiten-Link ${link} → ${r.status}`);
  }
  const angemeldet = await (await A.req("/")).text();
  assert.ok(!angemeldet.includes('id="kontaktform"'), "angemeldet muss der Arbeitsbereich kommen");
  // App-Seiten mit gleichem Namen bleiben geschützt
  for (const p of ["/social-media", "/schulung"]) {
    assert.equal((await fetch(`${BASE}${p}`, { redirect: "manual" })).status, 307, p);
  }
});

test("Startseite: Kern-Bild-Daten, Demo-Planer und Kontaktformular bis in den Posteingang", async () => {
  const kern = await (await fetch(`${BASE}/api/agenten?knapp=1`)).json();
  assert.ok(kern.gesamt > 0 && kern.gesamt_alle >= kern.gesamt && kern.kategorien.length > 0, JSON.stringify(kern).slice(0, 200));
  assert.equal((await fetch(`${BASE}/api/agenten`)).status, 404); // volle Registratur nicht öffentlich

  const plan = await (await fetch(`${BASE}/api/demo/plan`, { method: "POST", headers: { "content-type": "application/json", ...ORIGIN_HDR },
    body: JSON.stringify({ ziel: "Beantworte jeden Morgen die Kundenanfragen aus dem Postfach" }) })).json();
  assert.equal(plan.ausgefuehrt, false);
  assert.ok(plan.gesperrt || plan.schritte.length > 0, JSON.stringify(plan).slice(0, 200));
  assert.ok(!/im Kundenbereich/.test(plan.hinweis ?? ""), "Hinweis darf keine Ausführung im Kundenbereich versprechen");
  assert.equal((await fetch(`${BASE}/api/demo/plan`, { method: "POST", headers: { "content-type": "application/json", ...ORIGIN_HDR }, body: "{}" })).status, 400);

  const leer = await fetch(`${BASE}/api/kontakt`, { method: "POST", headers: { "content-type": "application/json", ...ORIGIN_HDR }, body: JSON.stringify({ name: "x" }) });
  assert.equal(leer.status, 400);
  const fremd = await fetch(`${BASE}/api/kontakt`, { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example" },
    body: JSON.stringify({ name: "Eva", email: "eva@example.test", nachricht: "Hallo" }) });
  assert.equal(fremd.status, 403);
  const ok = await fetch(`${BASE}/api/kontakt`, { method: "POST", headers: { "content-type": "application/json", ...ORIGIN_HDR, "x-forwarded-for": "10.7.7.7" },
    body: JSON.stringify({ name: "Erika Muster", email: "erika@example.test", nachricht: "Wir verlieren jede Woche Stunden mit Angeboten." }) });
  assert.equal(ok.status, 200);
  const op = await prisma.user.findFirstOrThrow({ where: { isOperator: true } });
  const conv = await prisma.conversation.findFirstOrThrow({ where: { workspaceId: op.workspaceId, platform: "WEBSITE" }, include: { messages: true } });
  assert.equal(conv.participantHandle, "erika@example.test");
  assert.match(conv.messages[0].body, /Stunden mit Angeboten/);
  // Kein Kunde bekommt die Anfrage
  assert.equal(await prisma.conversation.count({ where: { platform: "WEBSITE", workspaceId: { not: op.workspaceId } } }), 0);
});

test("Startseite Schritt 2: Chat-Regeln, KI nur mit Freigabe, Skill-Anfrage, Terminbuchung bis zur Bestätigung", async () => {
  const post = (p, body, extra = {}) => fetch(`${BASE}${p}`, { method: "POST", headers: { "content-type": "application/json", ...ORIGIN_HDR, ...extra }, body: JSON.stringify(body) });
  // Kunden-Chatbot bleibt geschützt (kein Präfix-Leck über /api/chat)
  assert.equal((await post("/api/chatbot", { messages: [{ role: "user", content: "hi" }] })).status, 401);

  assert.deepEqual(await (await fetch(`${BASE}/api/webseite/status`)).json(), { ki: false });
  const chat = (text) => post("/api/chat", { messages: [{ role: "user", content: text }] }, { "x-forwarded-for": "10.6.6.6" });
  const gesperrt = await (await chat("Können Sie meine Überweisung im Online-Banking machen?")).json();
  assert.equal(gesperrt.entscheidung, "abgelehnt");
  const termin = await (await chat("Ich möchte einen Termin vereinbaren")).json();
  assert.equal(termin.entscheidung, "verwiesen");
  const ohneKi = await chat("Was kostet ein KI-Agent?");
  assert.equal(ohneKi.status, 503); // Seite antwortet dann aus ihrer hinterlegten Liste
  assert.equal((await ohneKi.json()).error, "kein_schluessel");
  assert.equal((await post("/api/skill-agent", { beschreibung: "Angebote schreiben" })).status, 503);
  assert.equal((await post("/api/chat", { messages: "kaputt" })).status, 400);

  // Termine: nur Betreiber legt an
  const op = new Client();
  assert.equal((await op.json("/api/auth/login", { method: "POST", body: { email: "op@example.test", password: "betreiber-passwort-123" } })).status, 200);
  assert.equal((await A.json("/api/operator/termine", { method: "POST", body: { datum: "2030-03-10", uhrzeit: "10:00" } })).status, 404);
  assert.equal((await op.json("/api/operator/termine", { method: "POST", body: { datum: "2020-01-01", uhrzeit: "10:00" } })).status, 400);
  assert.equal((await op.json("/api/operator/termine", { method: "POST", body: { datum: "2030-03-10", uhrzeit: "25:00" } })).status, 400);
  const neu = await op.json("/api/operator/termine", { method: "POST", body: { datum: "2030-03-10", uhrzeit: "10:00", notiz: "intern" } });
  assert.equal(neu.status, 200);
  assert.equal(new Date(neu.data.termin.startsAt).toISOString(), "2030-03-10T09:00:00.000Z"); // 10:00 Berlin (Winterzeit)

  const frei = await (await fetch(`${BASE}/api/termine/frei`)).json();
  const slot = frei.termine.find((t) => t.id === neu.data.termin.id);
  assert.deepEqual(slot, { id: neu.data.termin.id, datum: "2030-03-10", uhrzeit: "10:00" }); // keine Notiz nach außen

  const anfrage = (name) => post(`/api/termine/${slot.id}/anfragen`, { name, email: `${name.toLowerCase()}@example.test`, nachricht: "Gern vormittags" }, { "x-forwarded-for": `10.5.5.${name.length}` });
  const [r1, r2] = await Promise.all([anfrage("Paula"), anfrage("Konstantin")]);
  assert.deepEqual([r1.status, r2.status].sort(), [200, 409], "nur eine Anfrage darf den Termin bekommen");
  assert.ok(!(await (await fetch(`${BASE}/api/termine/frei`)).json()).termine.some((t) => t.id === slot.id));

  const opUser = await prisma.user.findFirstOrThrow({ where: { isOperator: true } });
  const conv = await prisma.conversation.findFirst({ where: { workspaceId: opUser.workspaceId, platform: "WEBSITE", messages: { some: { body: { contains: "Terminanfrage für 2030-03-10 um 10:00" } } } } });
  assert.ok(conv, "Terminanfrage fehlt im Posteingang des Betreibers");

  const opPage = await (await op.req("/operator")).text();
  assert.ok(opPage.includes("Termine für Erstgespräche") && opPage.includes("10.03.2030"));
  assert.equal((await op.json(`/api/operator/termine/${slot.id}`, { method: "POST", body: { action: "bestaetigen" } })).status, 200);
  assert.equal((await prisma.websiteAppointment.findUniqueOrThrow({ where: { id: slot.id } })).status, "BESTAETIGT");
  assert.equal((await A.json(`/api/operator/termine/${slot.id}`, { method: "POST", body: { action: "loeschen" } })).status, 404);
  assert.equal((await op.json(`/api/operator/termine/${slot.id}`, { method: "POST", body: { action: "loeschen" } })).status, 200);

  // Startseite: Termin-Skript wieder aktiv, Newsletter weiter aus
  const html = await (await fetch(`${BASE}/`)).text();
  assert.ok(html.includes("/api/termine/frei") && html.includes("app-webseite-status") && html.includes("div:has(> #newsletterform)"));
  // CSS-Blöcke der Startseite geschlossen (Zentrale-Fehler: offener @media-Block machte den Desktop ungestaltet)
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    assert.equal((m[1].match(/\{/g) ?? []).length, (m[1].match(/\}/g) ?? []).length, "CSS-Klammern unausgeglichen");
  }
});
