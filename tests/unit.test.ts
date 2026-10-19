import { test } from "node:test";
import assert from "node:assert/strict";
import { interpretCommand } from "@/lib/genesis/commands";
import { parseAmountToCents, parseSalesCsv } from "@/lib/connect/salesImport";
import { normalizeOrigin } from "@/lib/website";
import { isActionAllowed } from "@/lib/contentWorkflowRules";
import { PLANS, lookupStripePrice, netAmountFor, parseBillingInterval, parsePlanKey, planForStripePrice, yearlyMonthlyEquivalent } from "@/lib/plans";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { currentTextProvider, generateText } from "@/lib/ai/textGenerator";
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
  assert.equal(getComposioToolkit("tiktok")?.key, "TIKTOK");
  assert.equal(getComposioToolkit("twitter"), undefined);
  for (const tk of COMPOSIO_TOOLKITS) assert.match(tk.readTool, /(GET|LIST)_/);
  const li = getComposioToolkit("LINKEDIN")!;
  process.env.COMPOSIO_READ_TOOL_LINKEDIN = "LINKEDIN_GET_PROFILE";
  assert.equal(readToolFor(li), "LINKEDIN_GET_PROFILE");
  process.env.COMPOSIO_READ_TOOL_LINKEDIN = "rm -rf /";
  assert.equal(readToolFor(li), li.readTool);
  delete process.env.COMPOSIO_READ_TOOL_LINKEDIN;
});

test("Jahresabo: Beträge, Intervall-Eingaben und Preis-Zuordnung", () => {
  assert.equal(netAmountFor("PRO", "month"), 59000);
  assert.equal(netAmountFor("PRO", "year"), 601800); // 6.018,00 €
  assert.equal(netAmountFor("MAXI", "year"), 812940); // 8.129,40 €
  assert.equal(yearlyMonthlyEquivalent("PRO"), 50150);
  assert.equal(parseBillingInterval(undefined), "month");
  assert.equal(parseBillingInterval("year"), "year");
  assert.equal(parseBillingInterval("jahr"), "year");
  assert.equal(parseBillingInterval("woche"), null);
  process.env.STRIPE_PRICE_ID_PRO = "p_m";
  process.env.STRIPE_PRICE_ID_PRO_YEAR = "p_y";
  assert.deepEqual(lookupStripePrice("p_y"), { plan: "PRO", interval: "year" });
  assert.equal(planForStripePrice("p_m"), "PRO");
  assert.equal(lookupStripePrice("unbekannt"), null);
  delete process.env.STRIPE_PRICE_ID_PRO;
  delete process.env.STRIPE_PRICE_ID_PRO_YEAR;
});

test("Freigabe-Regeln: Planen und Veröffentlichen nur nach Freigabe", () => {
  for (const st of ["DRAFT", "IN_REVIEW", "REJECTED", "PUBLISHED", "ARCHIVED"] as const) {
    assert.equal(isActionAllowed("publish", st), false, st);
    assert.equal(isActionAllowed("schedule", st), false, st);
  }
  assert.ok(isActionAllowed("publish", "APPROVED") && isActionAllowed("publish", "SCHEDULED"));
  assert.ok(isActionAllowed("approve", "IN_REVIEW") && !isActionAllowed("approve", "PUBLISHED"));
});

test("KI-Anbieter: Reihenfolge, Vorzug über AI_PROVIDER, Gemini-Aufruf", async () => {
  const saved = { ...process.env };
  const reset = () => { for (const k of ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "AI_PROVIDER", "GEMINI_BASE_URL", "GEMINI_MODEL"]) delete process.env[k]; };
  try {
    reset();
    assert.equal(currentTextProvider(), "template");
    process.env.GEMINI_API_KEY = "AIza-test";
    assert.equal(currentTextProvider(), "gemini");
    process.env.OPENAI_API_KEY = "sk-test";
    assert.equal(currentTextProvider(), "openai", "OpenAI vor Gemini");
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    assert.equal(currentTextProvider(), "anthropic", "Anthropic zuerst");
    process.env.AI_PROVIDER = "gemini";
    assert.equal(currentTextProvider(), "gemini", "Vorzug greift");
    process.env.AI_PROVIDER = "openai";
    delete process.env.OPENAI_API_KEY;
    assert.equal(currentTextProvider(), "anthropic", "Vorzug ohne Schlüssel wird ignoriert");

    // Gemini-Aufruf gegen eine lokale Attrappe: Anfrageform und Antwortauswertung
    const { createServer } = await import("node:http");
    const seen: { url?: string; body?: Record<string, unknown>; key?: string } = {};
    const srv = createServer((req, res) => {
      let raw = ""; req.on("data", (c) => (raw += c)); req.on("end", () => {
        seen.url = req.url; seen.body = JSON.parse(raw); seen.key = String(req.headers["x-goog-api-key"]);
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hallo " }, { text: "aus Gemini" }] } }] }));
      });
    });
    await new Promise<void>((r) => srv.listen(0, "127.0.0.1", r));
    const port = (srv.address() as { port: number }).port;
    process.env.AI_PROVIDER = "gemini"; process.env.GEMINI_API_KEY = "AIza-test"; process.env.GEMINI_MODEL = "gemini-test-1";
    process.env.GEMINI_BASE_URL = `http://127.0.0.1:${port}`;
    const out = await generateText({ system: "Sei knapp.", messages: [{ role: "user", content: "Hi" }, { role: "assistant", content: "Hallo" }, { role: "user", content: "Wie geht's?" }], maxTokens: 50 });
    srv.close();
    assert.deepEqual(out, { text: "Hallo aus Gemini", provider: "gemini" });
    assert.equal(seen.url, "/v1beta/models/gemini-test-1:generateContent");
    assert.equal(seen.key, "AIza-test");
    const body = seen.body as { system_instruction: { parts: { text: string }[] }; contents: { role: string }[]; generationConfig: { maxOutputTokens: number } };
    assert.equal(body.system_instruction.parts[0].text, "Sei knapp.");
    assert.deepEqual(body.contents.map((c) => c.role), ["user", "model", "user"]);
    assert.equal(body.generationConfig.maxOutputTokens, 50);
  } finally {
    reset();
    for (const k of ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "AI_PROVIDER", "GEMINI_BASE_URL", "GEMINI_MODEL"]) if (saved[k] !== undefined) process.env[k] = saved[k];
  }
});

test("Sprachen: Auswahl deckt Europa ab, Browsersprache wird zugeordnet, Vorlesesprache", async () => {
  const { LOCALES, LOCALE_LABELS, isLocale, resolveLocaleFromAcceptLanguage, speechLang } = await import("@/i18n/config");
  assert.ok(LOCALES.length >= 30);
  for (const c of ["de", "en", "fr", "es", "it", "pl", "pt", "nl", "bg", "el", "hu", "ga", "mt", "uk", "tr", "no", "sr"]) assert.ok(isLocale(c), c);
  for (const c of LOCALES) assert.ok(LOCALE_LABELS[c]?.name && LOCALE_LABELS[c]?.flag, `Label für ${c}`);
  assert.equal(resolveLocaleFromAcceptLanguage("nb-NO,nb;q=0.9,en;q=0.5"), "no");
  assert.equal(resolveLocaleFromAcceptLanguage("pl-PL,pl;q=0.9"), "pl");
  assert.equal(resolveLocaleFromAcceptLanguage("ja-JP"), "de");
  assert.equal(speechLang("no"), "nb-NO");
  assert.equal(speechLang("pl"), "pl");
});

test("Schulungsvideos: Texte und Zeitmarken stimmen überein", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { TRAINING_VIDEO_KEYS } = await import("@/lib/training/videos");
  const de = JSON.parse(fs.readFileSync(path.join(process.cwd(), "messages/de/schulungVideos.json"), "utf8"));
  assert.deepEqual(de.order, [...TRAINING_VIDEO_KEYS]);
  for (const key of TRAINING_VIDEO_KEYS) {
    const timingFile = path.join(process.cwd(), "public/schulung/videos", `${key}.json`);
    if (!fs.existsSync(timingFile)) continue; // Video noch nicht aufgenommen
    const timing = JSON.parse(fs.readFileSync(timingFile, "utf8"));
    const ids = Object.keys(de.videos[key].cues);
    assert.deepEqual(timing.cues.map((c: { id: string }) => c.id), ids, `Cues ${key}`);
    let last = 0;
    for (const c of timing.cues) { assert.ok(c.start >= last && c.end > c.start, `Zeit ${key} ${c.id}`); last = c.start; }
    assert.ok(fs.existsSync(path.join(process.cwd(), "public/schulung/videos", `${key}.mp4`)), `mp4 ${key}`);
  }
});

test("Übersetzungen: alle Sprachen vollständig (Dateien, Schlüssel, Platzhalter)", async () => {
  const { execFileSync } = await import("node:child_process");
  const out = execFileSync("node", ["scripts/schulung/pruefen-sprachen.mjs"], { encoding: "utf8" });
  assert.ok(!out.includes("✗"), out);
  assert.ok((out.match(/✓/g) ?? []).length >= 33);
});

test("Hermes: Adressprüfung, Werkzeugprüfung (fail-closed), Eingabeprüfung, Besucher-Hash", async () => {
  const { parseHermesUrl } = await import("@/lib/hermes/config");
  const { evaluateToolsets, visitorKey } = await import("@/lib/hermes/publicSafety");
  const { sanitizeHistory } = await import("@/lib/hermes/publicChat");
  assert.ok(parseHermesUrl("https://hermes.example.com"));
  assert.ok(parseHermesUrl("https://hermes.example.com/p/oeffentlich"));
  assert.equal(parseHermesUrl("http://hermes.example.com"), null);
  assert.equal(parseHermesUrl("https://user:pw@hermes.example.com"), null);
  assert.equal(parseHermesUrl("https://hermes.example.com/?token=1"), null);
  assert.equal(parseHermesUrl(""), null);
  assert.equal(parseHermesUrl("ftp://x.example.com"), null);
  const ts = (items: unknown) => evaluateToolsets({ toolsets: items });
  assert.equal(ts([{ name: "clarify", enabled: true }, { name: "todo", enabled: true }, { name: "terminal", enabled: false }]).safe, true);
  assert.equal(ts([{ name: "terminal", enabled: true }]).safe, false);
  assert.equal(ts([{ name: "memory", enabled: true }]).safe, false);
  assert.equal(ts([{ name: "clarify" }]).safe, false, "ohne enabled = unklar = unsicher");
  assert.equal(ts([]).safe, false);
  assert.equal(evaluateToolsets({}).safe, false);
  assert.equal(evaluateToolsets(null).safe, false);
  assert.equal(evaluateToolsets([{ name: "web", enabled: true }]).safe, false);
  assert.equal(evaluateToolsets([{ id: "TODO", enabled: true }]).safe, true);
  assert.equal(sanitizeHistory([]).ok, false);
  assert.equal(sanitizeHistory([{ role: "user", content: "Hallo\u0000 Welt" }]).ok && (sanitizeHistory([{ role: "user", content: "Hallo\u0000 Welt" }]) as { history: { content: string }[] }).history[0].content, "Hallo Welt");
  assert.equal(sanitizeHistory([{ role: "assistant", content: "x" }]).ok, false);
  assert.equal(sanitizeHistory([{ role: "tool", content: "x" }]).ok, false);
  assert.equal(sanitizeHistory([{ role: "user", content: "a".repeat(601) }]).ok, false);
  assert.equal(sanitizeHistory(Array.from({ length: 41 }, () => ({ role: "user", content: "x" }))).ok, false);
  const k = visitorKey("203.0.113.7", "geheimnis-geheimnis-1");
  assert.match(k, /^[0-9a-f]{32}$/);
  assert.ok(!k.includes("203"));
  assert.notEqual(k, visitorKey("203.0.113.8", "geheimnis-geheimnis-1"));
});

// ---------------------------------------------------------------- Pilotstudio
import { DEMO_CASES, autoCheck } from "@/lib/pilotstudio/cases";
import { classify, guardFlags } from "@/lib/pilotstudio/guard";

test("Pilotstudio: zehn Testfälle, Musterantworten verletzen keine Prüfregel und erfüllen ihr Kriterium", () => {
  assert.equal(DEMO_CASES.length, 10);
  for (const c of DEMO_CASES) {
    assert.deepEqual(guardFlags(c.demoAnswer), [], `Fall ${c.no}: ${guardFlags(c.demoAnswer).join(", ")}`);
    const handed = c.route === "uebergabe";
    const r = autoCheck(c.no, { draftText: c.demoAnswer, status: handed ? "UEBERGEBEN" : "FREIGEGEBEN", needsHuman: classify(c.subject, c.body).needsHuman, assignee: handed ? "Zuständig" : "" });
    assert.ok(r.ok, `Fall ${c.no}: ${r.reasons.join(" ")}`);
  }
});

test("Pilotstudio: Einordnung erkennt sensible Fälle und Manipulationsversuch", () => {
  const cat = (n: number) => { const c = DEMO_CASES[n - 1]; return classify(c.subject, c.body); };
  assert.equal(cat(1).category, "angebot");
  assert.equal(cat(2).category, "termin");
  assert.equal(cat(3).category, "zugang");
  assert.equal(cat(4).category, "reklamation");
  assert.equal(cat(5).category, "zahlung");
  assert.equal(cat(6).category, "unklar");
  assert.equal(cat(7).category, "datenschutz");
  assert.equal(cat(8).category, "manipulationsversuch");
  assert.equal(cat(9).category, "verfuegbarkeit");
  assert.equal(cat(10).category, "kuendigung");
  for (const n of [4, 5, 7, 8, 10]) assert.equal(cat(n).needsHuman, true, `Fall ${n}`);
});

test("Pilotstudio: Prüfregeln erkennen erfundene Zusagen", () => {
  const has = (t: string, part: string) => guardFlags(t).some((f) => f.includes(part));
  assert.ok(has("Die Website kostet 1.200 €.", "Preis"));
  assert.ok(has("Bitte senden Sie uns Ihr Passwort.", "Passwort"));
  assert.ok(has("Ihr Termin am Dienstag ist bestätigt.", "Termin"));
  assert.ok(has("Wir erstatten Ihnen den Betrag.", "Erstattung"));
  assert.ok(has("Ihre Daten wurden gelöscht.", "Löschung"));
  assert.ok(has("Ihre Kündigung wird wirksam zum 31.12.", "Kündigungstermin"));
  assert.ok(has("Hier: kunde@example.test", "E-Mail"));
  // Fehlschlagender Fall: Antwort mit Preis besteht Testfall 1 nicht.
  assert.equal(autoCheck(1, { draftText: "Das kostet 499 EUR.", status: "PRUEFUNG", needsHuman: false, assignee: "" }).ok, false);
  assert.equal(autoCheck(3, { draftText: "Senden Sie uns Ihr Passwort?", status: "PRUEFUNG", needsHuman: false, assignee: "" }).ok, false);
});

// ---------------------------------------------------------------- Dateiaustausch
import { ansichtTyp, normUrl, sauberName, sauberOrdner } from "@/lib/dateien/service";

test("Dateiaustausch: Dateinamen, Ordner, Ansichtstypen und Webadressen werden sicher bereinigt", () => {
  assert.equal(sauberName("../../etc/passwd"), "passwd");
  assert.equal(sauberName("C:\\Users\\x\\Angebot.pdf"), "Angebot.pdf");
  assert.equal(sauberName(".htaccess"), "htaccess");
  assert.equal(sauberName('a<b>:"c|?*.txt'), "a_b___c___.txt");
  assert.equal(sauberName(""), "Datei");
  assert.equal(sauberName("x".repeat(300)).length, 120);
  assert.equal(sauberOrdner("  Projekt / Müller  "), "Projekt Müller");
  assert.throws(() => sauberOrdner("   "));
  assert.equal(ansichtTyp("a.PDF"), "application/pdf");
  assert.equal(ansichtTyp("seite.html"), null);
  assert.equal(ansichtTyp("bild.svg"), null, "SVG kann Skripte enthalten");
  assert.equal(normUrl("www.firma.de"), "https://www.firma.de/");
  assert.equal(normUrl("http://firma.de/shop?a=1"), "http://firma.de/shop?a=1");
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "ftp://firma.de", "https://localhost", "https://u:p@firma.de", "kein link", ""]) {
    assert.equal(normUrl(bad), null, bad);
  }
});

// ── Weiterempfehlungen & Reichweite ─────────────────────────────────────────
import { CODE_LAENGE, istGueltigerCode, neuerCode } from "@/lib/reichweite/codes";
import { enthaeltPersonendaten, pruefeZielUrl } from "@/lib/reichweite/texte";
import { teilenZiele } from "@/lib/reichweite/teilen";
import { auswerten } from "@/lib/reichweite/auswertung";
import { CTA_VORSCHLAEGE, begleittexte } from "@/lib/reichweite/vorschlaege";

test("Empfehlung: Codes sind zufällig, gültig und ohne Personenbezug", () => {
  const codes = new Set(Array.from({ length: 500 }, () => neuerCode()));
  assert.equal(codes.size, 500);
  for (const c of codes) {
    assert.equal(c.length, CODE_LAENGE);
    assert.ok(istGueltigerCode(c));
    assert.ok(!c.includes("@"));
  }
  assert.ok(!istGueltigerCode("../../etc"));
  assert.ok(!istGueltigerCode("max@test.de"));
});

test("Empfehlung: Bezeichnungen und Zielseiten ohne Personendaten", () => {
  assert.ok(enthaeltPersonendaten("an max@example.com"));
  assert.ok(enthaeltPersonendaten("Tel +49 170 1234567"));
  assert.ok(!enthaeltPersonendaten("Instagram-Bio Frühjahr 2026"));
  assert.equal(pruefeZielUrl("javascript:alert(1)").ok, false);
  assert.equal(pruefeZielUrl("https://user:pw@example.com").ok, false);
  assert.equal(pruefeZielUrl("https://example.com/?mail=max@example.com").ok, false);
  assert.deepEqual(pruefeZielUrl(""), { ok: true, url: "" });
  assert.equal(pruefeZielUrl("https://example.com/angebot").ok, true);
});

test("Empfehlung: Teilen-Adressen sind offizielle Teilen-Fenster ohne Empfängervorgabe", () => {
  const ziele = teilenZiele("https://app.test/e/abcdefghjk", "Schau mal & mehr");
  const wa = ziele.find((z) => z.key === "whatsapp")!;
  assert.ok(wa.href.startsWith("https://wa.me/?text="));
  assert.ok(wa.href.includes(encodeURIComponent("https://app.test/e/abcdefghjk")));
  assert.ok(!wa.href.includes("phone="));
  assert.ok(ziele.find((z) => z.key === "email")!.href.startsWith("mailto:?"));
  assert.ok(ziele.every((z) => !z.href.includes("Schau mal & mehr")));
});

test("Empfehlung: Auswertung erfindet keine Stufen und vermischt keine Größen", () => {
  const t = new Date("2026-10-01T10:00:00Z");
  const team = { id: "a", code: "aaaaaaaaaa", parentId: null, stufe: 1, bezeichnung: "Bio", herkunft: "TEAM", istDemo: false, widerrufenAm: null, createdAt: t };
  // Derselbe Link wird oft aufgerufen (z. B. weitergeleitet) – das ergibt keine neue Stufe.
  const leer = auswerten({
    links: [team],
    ereignisse: Array.from({ length: 7 }, () => ({ linkId: "a", art: "AUFRUF", istDemo: false, createdAt: t })),
    kennzahlen: [],
  });
  assert.equal(leer.stufen.length, 1);
  assert.equal(leer.stufen[0].kinder.length, 0);
  assert.equal(leer.eigeneMessung.AUFRUF.wert, 7);
  assert.equal(leer.herkunft.unbekannteHerkunft.wert, 7);
  assert.equal(leer.herkunft.gemesseneWeiterempfehlungen.wert, 0);
  assert.equal(leer.herkunft.plattformempfehlungen.status, "NICHT_ANGEBUNDEN");
  assert.equal(leer.eindeutigePersonen.status, "NICHT_MESSBAR");
  assert.equal(leer.eindeutigePersonen.wert, null);
  assert.equal(leer.newsletter.status, "NICHT_ANGEBUNDEN");
  assert.equal(leer.fluss.find((s) => s.key === "beitrag")!.zahl.status, "NICHT_ANGEBUNDEN");
  assert.equal(leer.enthaeltDemo, false);

  // Stufe 2 nur, weil ausdrücklich ein Besucher-Link erzeugt wurde.
  const kind = { ...team, id: "b", code: "bbbbbbbbbb", parentId: "a", stufe: 2, bezeichnung: "", herkunft: "BESUCHER" };
  const mit = auswerten({
    links: [team, kind],
    ereignisse: [
      { linkId: "a", art: "LINK_ERZEUGT", istDemo: false, createdAt: t },
      { linkId: "b", art: "AUFRUF", istDemo: false, createdAt: t },
      { linkId: "b", art: "AUFRUF", istDemo: false, createdAt: t },
    ],
    kennzahlen: [
      { id: "k1", plattform: "INSTAGRAM", metrik: "REICHWEITE", wert: 100, quelle: "MANUELL", zeitraumVon: t, zeitraumBis: t, erfasstAm: t },
      { id: "k2", plattform: "YOUTUBE", metrik: "VIDEOAUFRUFE", wert: 50, quelle: "DEMO", zeitraumVon: t, zeitraumBis: t, erfasstAm: t },
    ],
  });
  assert.equal(mit.stufen[0].kinder[0].stufe, 2);
  assert.equal(mit.herkunft.gemesseneWeiterempfehlungen.wert, 2);
  assert.equal(mit.eigeneMessung.LINK_ERZEUGT.wert, 1);
  const beitrag = mit.fluss.find((s) => s.key === "beitrag")!.zahl;
  assert.equal(beitrag.wert, 50); // nur Videoaufrufe, Reichweite wird nicht dazugerechnet
  assert.equal(beitrag.istDemo, true);
  assert.ok(mit.plattformKennzahlen.find((k) => k.metrik === "REICHWEITE")!.zahl.einheit.includes("keine eindeutigen Personen"));
  assert.equal(mit.enthaeltDemo, true);
});

test("Empfehlung: Vorschläge versprechen keine Viralität", () => {
  const alle = [...CTA_VORSCHLAEGE, ...begleittexte("Test")].join(" ").toLowerCase();
  for (const w of ["viral", "garantiert", "millionen", "alle deine kontakte"]) assert.ok(!alle.includes(w), w);
});
