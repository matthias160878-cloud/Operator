import { test } from "node:test";
import assert from "node:assert/strict";
import { interpretCommand } from "@/lib/genesis/commands";
import { parseAmountToCents, parseSalesCsv } from "@/lib/connect/salesImport";
import { normalizeOrigin } from "@/lib/website";
import { PLANS, parsePlanKey, planForStripePrice } from "@/lib/plans";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { composioUserIdFor, hashState, sanitizeComposioMessage, stateMatches } from "@/lib/composio/client";
import { extractLabel } from "@/lib/composio/service";
import { COMPOSIO_TOOLKITS, getComposioToolkit, readToolFor } from "@/lib/composio/toolkits";

test("Genesis: geforderte Befehle navigieren korrekt", () => {
  const cases: [string, string][] = [
    ["Öffne Social Media AI.", "/social-media"],
    ["öffne schulung", "/schulung"],
    ["Öffne Marken-DNA", "/brand-dna"],
    ["Öffne Wachstum", "/growth"],
    ["Öffne Posteingang", "/inbox"],
    ["Öffne Zentrale", "/"],
    ["Posteingang", "/inbox"],
  ];
  for (const [input, href] of cases) {
    const a = interpretCommand(input);
    assert.equal(a.type, "navigate", input);
    assert.equal(a.type === "navigate" && a.href, href, input);
  }
});

test("Genesis: Pakete werden nur vorgewählt", () => {
  const pro = interpretCommand("Wähle Pro.");
  assert.equal(pro.type, "selectPlan");
  assert.equal(pro.type === "selectPlan" && pro.href, "/billing?plan=pro");
  const maxi = interpretCommand("wähle maxi");
  assert.equal(maxi.type === "selectPlan" && maxi.plan, "MAXI");
});

test("Genesis: Kauf, Zahlung, Löschen werden nie ausgeführt", () => {
  for (const s of ["Kaufe Maxi", "Bezahle jetzt", "Bestätige den Kauf", "Bestelle Pro", "Lösche alles", "Kündige mein Abo", "buy maxi"]) {
    assert.equal(interpretCommand(s).type, "refuse", s);
  }
  assert.equal(interpretCommand("mach irgendwas").type, "unknown");
  assert.equal(interpretCommand("").type, "unknown");
});

test("CSV-Import: Beträge in Cent ohne Rundungsfehler", () => {
  assert.equal(parseAmountToCents("19,90"), 1990);
  assert.equal(parseAmountToCents("19.90"), 1990);
  assert.equal(parseAmountToCents("1.234,56"), 123456);
  assert.equal(parseAmountToCents("1,234.56"), 123456);
  assert.equal(parseAmountToCents("0.1"), 10);
  assert.equal(parseAmountToCents("1000"), 100000);
  assert.equal(parseAmountToCents("abc"), null);
  const { rows, errors } = parseSalesCsv("external_id,amount,currency\nA1,10.00,EUR\nA1,10.00,EUR\n,5,EUR\n");
  assert.equal(rows.length, 1);
  assert.equal(errors.length, 2);
});

test("Webseiten-Ursprung: nur https, keine Pfade oder Zugangsdaten", () => {
  assert.equal(normalizeOrigin("meine-firma.de/kontakt"), "https://meine-firma.de");
  assert.equal(normalizeOrigin("https://shop.example.com:8443/x?y"), "https://shop.example.com:8443");
  assert.equal(normalizeOrigin("ftp://example.com"), null);
  assert.equal(normalizeOrigin("https://user:pw@example.com"), null);
  assert.equal(normalizeOrigin("intranet"), null);
});

test("Pakete: zentrale Definition und Preis-Zuordnung", () => {
  assert.equal(parsePlanKey("pro"), "PRO");
  assert.equal(parsePlanKey(" Maxi "), "MAXI");
  assert.equal(parsePlanKey("gold"), null);
  assert.ok(PLANS.MAXI.quotas.AI_TEXT > PLANS.PRO.quotas.AI_TEXT);
  process.env.STRIPE_PRICE_ID_PRO = "price_p";
  assert.equal(planForStripePrice("price_p"), "PRO");
  assert.equal(planForStripePrice("price_unbekannt"), null);
});

test("Passwörter: scrypt-Hash, Prüfung, Mindestlänge", async () => {
  const h = await hashPassword("ein-langes-passwort");
  assert.ok(h.startsWith("scrypt$"));
  assert.equal(await verifyPassword("ein-langes-passwort", h), true);
  assert.equal(await verifyPassword("falsch", h), false);
  assert.equal(await verifyPassword("x", null), false);
  assert.ok(passwordProblem("kurz"));
  assert.equal(passwordProblem("zwölf-zeichen"), null);
});

test("Weiterleitung nach Anmeldung: nur interne Pfade", async () => {
  const { safeInternalPath } = await import("@/lib/safeRedirect");
  const o = "https://app.example";
  assert.equal(safeInternalPath("/ideas?x=1", o, "/"), "/ideas?x=1");
  assert.equal(safeInternalPath("//evil.example", o, "/"), "/");
  assert.equal(safeInternalPath("/\\evil.example", o, "/"), "/");
  assert.equal(safeInternalPath("https://evil.example", o, "/"), "/");
  assert.equal(safeInternalPath(undefined, o, "/"), "/");
});

test("Client-IP: nur der vom eigenen Proxy angehängte Eintrag zählt", async () => {
  const { clientIp } = await import("@/lib/rateLimit");
  const req = (xff: string) => new Request("http://x", { headers: { "x-forwarded-for": xff } });
  delete process.env.TRUSTED_PROXY_HOPS;
  assert.equal(clientIp(req("1.1.1.1, 9.9.9.9")), "9.9.9.9"); // erster Eintrag ist vom Client gefälscht
  process.env.TRUSTED_PROXY_HOPS = "0";
  assert.equal(clientIp(req("1.1.1.1")), "direct");
  delete process.env.TRUSTED_PROXY_HOPS;
});

test("Signierte Medien-Links: nur passende, gültige Signatur", async () => {
  process.env.MEDIA_URL_SECRET = "test-secret";
  const { signedMediaUrl, mediaSignature } = await import("@/lib/mediaStorage");
  const url = new URL(signedMediaUrl("https://app.example", "ws1", "/api/media/video/a.mp4", 60));
  const exp = Number(url.searchParams.get("exp"));
  assert.equal(url.searchParams.get("sig"), mediaSignature("ws1", "video", "a.mp4", exp));
  assert.notEqual(url.searchParams.get("sig"), mediaSignature("ws2", "video", "a.mp4", exp));
});

test("Rechtliche Angaben: Verkauf erst mit Impressum, AGB und Datenschutz", async () => {
  const { getImpressum, legalInfoComplete } = await import("@/lib/legal");
  for (const k of ["IMPRESSUM_NAME", "IMPRESSUM_ANSCHRIFT", "IMPRESSUM_EMAIL", "AGB_URL", "DATENSCHUTZ_URL"]) delete process.env[k];
  assert.equal(getImpressum(), null);
  assert.equal(legalInfoComplete(), false);
  process.env.IMPRESSUM_NAME = "A";
  process.env.IMPRESSUM_ANSCHRIFT = "Weg 1 | 1 Ort";
  process.env.IMPRESSUM_EMAIL = "a@example.test";
  assert.deepEqual(getImpressum()?.anschrift, ["Weg 1", "1 Ort"]);
  assert.equal(legalInfoComplete(), false); // AGB/Datenschutz fehlen noch
  process.env.AGB_URL = "https://x/agb";
  process.env.DATENSCHUTZ_URL = "https://x/ds";
  assert.equal(legalInfoComplete(), true);
});

test("Anbieterangaben der Kunden: Pflichtfelder und sichere Links", async () => {
  const { sellerProfileMissing, sellerProfileSchema } = await import("@/lib/connect/sellerProfile");
  assert.deepEqual(sellerProfileMissing(null), ["Name", "Anschrift", "E-Mail", "Link zur Datenschutzerklärung"]);
  assert.deepEqual(sellerProfileMissing({ anbieter: "A", anschrift: "W 1", email: "a@b.de", datenschutzUrl: "https://x/ds" }), []);
  const base = { anbieter: "A", firma: "", anschrift: "W", email: "a@b.de", telefon: "", ustId: "", register: "", aufsicht: "", verantwortlich: "", agbUrl: "", datenschutzUrl: "https://x", widerrufUrl: "" };
  assert.equal(sellerProfileSchema.safeParse(base).success, true);
  assert.equal(sellerProfileSchema.safeParse({ ...base, agbUrl: "javascript:alert(1)" }).success, false);
  assert.equal(sellerProfileSchema.safeParse({ ...base, email: "keine-mail" }).success, false);
});

test("Composio: Kundenkennung, Sicherheitscode, bereinigte Fehler, Kontoname", () => {
  delete process.env.COMPOSIO_USER_PREFIX;
  assert.equal(composioUserIdFor("ws123"), "s58-ws-ws123");
  process.env.COMPOSIO_USER_PREFIX = "s58test";
  assert.equal(composioUserIdFor("ws123"), "s58test-ws-ws123");
  process.env.COMPOSIO_USER_PREFIX = "bad prefix/../";
  assert.equal(composioUserIdFor("x"), "badprefix-ws-x");
  delete process.env.COMPOSIO_USER_PREFIX;

  const hash = hashState("abc");
  assert.ok(stateMatches("abc", hash));
  assert.ok(!stateMatches("abd", hash));
  assert.ok(!stateMatches(null, hash));
  assert.ok(!stateMatches("abc", null));

  const cleaned = sanitizeComposioMessage("invalid key ak_" + "x".repeat(30) + " and token " + "y".repeat(40));
  assert.ok(!cleaned.includes("xxxxxxxxxxxx") && !cleaned.includes("yyyyyyyyyyyy"), cleaned);
  assert.ok(sanitizeComposioMessage("a".repeat(500)).length <= 200);

  assert.equal(extractLabel({ data: { username: "firma" } }), "firma");
  assert.equal(extractLabel({ items: [{ snippet: { title: "Kanal" } }] }), "Kanal");
  assert.equal(extractLabel(JSON.stringify({ name: "Seite" })), "Seite");
  assert.equal(extractLabel(null), "");
});

test("Composio: nur bekannte Plattformen, Lese-Werkzeug nur gültig überschreibbar", () => {
  assert.equal(getComposioToolkit("instagram")?.key, "INSTAGRAM");
  assert.equal(getComposioToolkit("tiktok"), undefined);
  for (const tk of COMPOSIO_TOOLKITS) assert.match(tk.readTool, /(GET|LIST)_/);
  const li = getComposioToolkit("LINKEDIN")!;
  process.env.COMPOSIO_READ_TOOL_LINKEDIN = "LINKEDIN_GET_PROFILE";
  assert.equal(readToolFor(li), "LINKEDIN_GET_PROFILE");
  process.env.COMPOSIO_READ_TOOL_LINKEDIN = "rm -rf /";
  assert.equal(readToolFor(li), li.readTool);
  delete process.env.COMPOSIO_READ_TOOL_LINKEDIN;
});
