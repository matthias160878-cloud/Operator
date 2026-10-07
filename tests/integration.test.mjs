/**
 * Integrationstests gegen den echten Produktions-Build (next start) mit
 * isolierter SQLite-Testdatenbank und lokalen Attrappen für Stripe/KI.
 *
 *   npm run build && npm run test:integration
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
  const dbUrl = `file:${path.join(workdir, "test.db")}`;
  execFileSync("npx", ["prisma", "db", "push", "--skip-generate"], { env: { ...process.env, DATABASE_URL: dbUrl }, stdio: "ignore" });
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
