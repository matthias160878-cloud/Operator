import { test } from "node:test";
import assert from "node:assert/strict";
import { interpretCommand } from "@/lib/genesis/commands";
import { parseAmountToCents, parseSalesCsv } from "@/lib/connect/salesImport";
import { normalizeOrigin } from "@/lib/website";
import { PLANS, parsePlanKey, planForStripePrice } from "@/lib/plans";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";

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
