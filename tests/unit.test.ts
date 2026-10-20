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
import { auswerten, formatiereMetrikWert, formatiereSekunden, istSummierbar, METRIK_INFO, summeUeberEintraege } from "@/lib/reichweite/auswertung";
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

test("Empfehlung: Speicherungen und Ø Wiedergabedauer – Durchschnitte werden nie summiert", () => {
  const t1 = new Date("2026-10-01T00:00:00Z");
  const t2 = new Date("2026-10-08T00:00:00Z");
  const k = (id: string, plattform: string, metrik: string, wert: number, von = t1, bis = t2, quelle = "MANUELL") => ({
    id, plattform, metrik, wert, quelle, zeitraumVon: von, zeitraumBis: bis, erfasstAm: bis,
  });
  const a = auswerten({
    links: [],
    ereignisse: [],
    kennzahlen: [
      k("1", "INSTAGRAM", "WIEDERGABEDAUER_SEK", 14),
      k("2", "YOUTUBE", "WIEDERGABEDAUER_SEK", 83),
      k("3", "YOUTUBE", "WIEDERGABEDAUER_SEK", 65, t2, new Date("2026-10-15T00:00:00Z")),
      k("4", "INSTAGRAM", "SPEICHERUNGEN", 54),
      k("5", "YOUTUBE", "SPEICHERUNGEN", 6),
      k("6", "YOUTUBE", "GESAMTWIEDERGABEZEIT_MIN", 844),
      k("7", "YOUTUBE", "UNBEKANNT", 1),
    ],
  });
  assert.equal(METRIK_INFO.WIEDERGABEDAUER_SEK.label, "Ø Wiedergabedauer");
  assert.equal(METRIK_INFO.SPEICHERUNGEN.label, "Speicherungen");
  assert.equal(istSummierbar("WIEDERGABEDAUER_SEK"), false);
  assert.equal(istSummierbar("SPEICHERUNGEN"), true);
  // Jeder Durchschnitt bleibt ein eigener Eintrag je Plattform und Zeitraum, unverändert.
  const dauer = a.plattformKennzahlen.filter((p) => p.metrik === "WIEDERGABEDAUER_SEK");
  assert.deepEqual(dauer.map((d) => d.zahl.wert).sort((x, y) => x! - y!), [14, 65, 83]);
  assert.ok(dauer.every((d) => d.art === "DURCHSCHNITT" && d.zahl.messluecken.some((m) => m.includes("nicht über Plattformen oder Zeiträume addiert"))));
  assert.equal(dauer.find((d) => d.zahl.wert === 83)!.zahl.anzeige, "1:23 min");
  assert.equal(dauer[0].zahl.quelle, "Manuell aus Plattform-Statistik");
  // Keine Summe und kein Gesamtdurchschnitt für Durchschnittswerte.
  const s = summeUeberEintraege(a.plattformKennzahlen, "WIEDERGABEDAUER_SEK");
  assert.equal(s.wert, null);
  assert.equal(s.status, "NICHT_MESSBAR");
  for (const w of [14 + 83, 14 + 83 + 65, Math.round((14 + 83 + 65) / 3), Math.round((14 + 83) / 2)]) {
    assert.ok(!a.fluss.some((f) => f.zahl.wert === w), `kein Fluss-Schritt mit ${w}`);
  }
  // Zählwerte dürfen ausdrücklich gekennzeichnet summiert werden (keine Personen).
  const sp = summeUeberEintraege(a.plattformKennzahlen, "SPEICHERUNGEN");
  assert.equal(sp.wert, 60);
  assert.ok(sp.messluecken[0].includes("keine eindeutigen Personen"));
  assert.equal(a.plattformKennzahlen.find((p) => p.metrik === "GESAMTWIEDERGABEZEIT_MIN")!.zahl.anzeige, "844 min");
  assert.ok(!a.plattformKennzahlen.some((p) => (p.metrik as string) === "UNBEKANNT"));
  assert.ok(a.hinweise.some((h) => h.includes("nie addiert")));
  assert.equal(formatiereSekunden(65), "1:05");
  assert.equal(formatiereSekunden(5), "0:05");
  assert.equal(formatiereSekunden(3725), "1:02:05");
  assert.equal(formatiereMetrikWert("SPEICHERUNGEN", 1234), (1234).toLocaleString("de-DE"));
});

test("Empfehlung: Vorschläge versprechen keine Viralität", () => {
  const alle = [...CTA_VORSCHLAEGE, ...begleittexte("Test")].join(" ").toLowerCase();
  for (const w of ["viral", "garantiert", "millionen", "alle deine kontakte"]) assert.ok(!alle.includes(w), w);
});

// ── Reichweitenaufbau ───────────────────────────────────────────────────────
import { erzeugeVorschlaege, hwgRisiko, pruefeBriefing, versprechenImText, type Briefing } from "@/lib/reichweitenaufbau/ideen";
import { vergleiche, zWert, type VarianteEingabe } from "@/lib/reichweitenaufbau/varianten";
import { exportCsv, laufzeitTage, planHinweise, pruefeFreigabe, bewerbungsVorschlaege, PLATTFORM_VORAUSSETZUNGEN } from "@/lib/reichweitenaufbau/werbung";
import { freigabeHash } from "@/lib/reichweitenaufbau/werbungHash";
import { darfUebergang, themenBereinigen } from "@/lib/reichweitenaufbau/newsletterRegeln";
import { naechsteSchritte, stufeAusgabe, stufeInhalt, stufeWerbeplan } from "@/lib/reichweitenaufbau/status";

const BRIEF: Briefing = {
  zielgruppe: "Handwerksbetriebe",
  problem: "keine Zeit für Social Media",
  ergebnis: "regelmäßig posten",
  plattform: "INSTAGRAM",
  format: "Reel",
  tonalitaet: "SACHLICH_SIE",
  material: "",
  aufforderung: "TEILEN",
  grundlageVorherNachher: "",
};

test("Reichweitenaufbau: Ideen – sechs Vorlagen, Vorher-nachher nur mit Grundlage, keine Versprechen", () => {
  assert.equal(pruefeBriefing({ ...BRIEF, zielgruppe: " " }), "Bitte die Zielgruppe angeben.");
  const v = erzeugeVorschlaege(BRIEF);
  assert.equal(v.length, 6);
  assert.ok(v.find((x) => x.art === "VORHER_NACHHER")!.gesperrt);
  assert.ok(v.filter((x) => x.art !== "VORHER_NACHHER").every((x) => !x.gesperrt && x.einstieg && x.text && x.bildVideoIdee && x.beschreibung && x.aufforderung));
  assert.ok(v.every((x) => versprechenImText(`${x.einstieg} ${x.text} ${x.aufforderung}`).length === 0), "keine Erfolgsversprechen erzeugt");
  assert.ok(v[0].aufforderung.includes("Sie"), "Sie-Form bei sachlicher Tonalität");
  assert.ok(erzeugeVorschlaege({ ...BRIEF, tonalitaet: "LOCKER_DU" })[0].aufforderung.includes("du"));
  const mit = erzeugeVorschlaege({ ...BRIEF, grundlageVorherNachher: "eigenes Projekt 05/2026, Fotos vorhanden" });
  assert.equal(mit.find((x) => x.art === "VORHER_NACHHER")!.gesperrt, null);
  const warn = erzeugeVorschlaege({ ...BRIEF, ergebnis: "garantiert viral werden" });
  assert.ok(warn[0].hinweise.some((h) => h.includes("Erfolgsversprechen")));
});

test("Reichweitenaufbau: Ideen – HWG-Sperre für Vorher-nachher bei Schönheitseingriffen", () => {
  assert.equal(hwgRisiko(BRIEF), null);
  assert.equal(hwgRisiko({ ...BRIEF, zielgruppe: "Frauen, die über eine Brustvergrößerung nachdenken" }), "EINGRIFF");
  assert.equal(hwgRisiko({ ...BRIEF, problem: "Faltenbehandlung mit Hyaluron" }), "EINGRIFF");
  assert.equal(hwgRisiko({ ...BRIEF, zielgruppe: "Patienten einer Zahnarztpraxis" }), "HEILBEREICH");
  assert.equal(hwgRisiko({ ...BRIEF, problem: "Bubble-Tea-Bar" }), null, "kein Treffer in fremden Wörtern");
  const op = erzeugeVorschlaege({ ...BRIEF, zielgruppe: "Interessierte an Schönheits-OPs", grundlageVorherNachher: "eigene Patientenfotos mit Einverständnis" });
  const vn = op.find((x) => x.art === "VORHER_NACHHER")!;
  assert.match(vn.gesperrt ?? "", /§ 11 Abs\. 1 S\. 3 Nr\. 1 HWG/, "auch mit Grundlage gesperrt");
  assert.ok(vn.hinweise.some((h) => h.includes("HWG")));
  assert.ok(op.filter((x) => x.art !== "VORHER_NACHHER").every((x) => x.hinweise.some((h) => h.includes("Heilmittelwerbegesetz"))));
  const zahn = erzeugeVorschlaege({ ...BRIEF, zielgruppe: "Zahnarztpraxis", grundlageVorherNachher: "Fall 03/2026 mit Einverständnis" });
  assert.equal(zahn.find((x) => x.art === "VORHER_NACHHER")!.gesperrt, null, "Heilbereich: Hinweis, keine Sperre");
});

function variante(id: string, plattform: string, aufrufe: number | null, klicks: number | null, extra: VarianteEingabe["werte"] = {}): VarianteEingabe {
  return {
    id,
    label: `Variante ${id}`,
    plattform,
    veroeffentlichtAm: null,
    werte: {
      ...(aufrufe !== null ? { AUFRUFE: { wert: aufrufe, quelle: "MANUELL" } } : {}),
      ...(klicks !== null ? { LINKKLICKS: { wert: klicks, quelle: "Eigene Messung" } } : {}),
      ...extra,
    },
  };
}
const ENDE = new Date("2026-10-01");
const JETZT = new Date("2026-10-19");

test("Reichweitenaufbau: Varianten – kein Sieger bei zu wenig Daten oder ohne Unterschied", () => {
  const wenig = vergleiche({ hauptkennzahl: "LINKKLICKS", zufallsverteilt: false, laufzeitBis: ENDE, jetzt: JETZT, varianten: [variante("A", "INSTAGRAM", 80, 9), variante("B", "INSTAGRAM", 90, 2)] });
  assert.equal(wenig.status, "KEINE_AUSSAGE");
  assert.match(wenig.aussage, /Zu wenige Daten/);
  assert.equal(wenig.bezeichnung, "Variantenvergleich");
  const gleich = vergleiche({ hauptkennzahl: "LINKKLICKS", zufallsverteilt: true, laufzeitBis: ENDE, jetzt: JETZT, varianten: [variante("A", "INSTAGRAM", 1000, 50), variante("B", "INSTAGRAM", 1000, 52)] });
  assert.equal(gleich.status, "KEINE_AUSSAGE");
  assert.match(gleich.aussage, /Kein belastbarer Unterschied/);
  const fehlt = vergleiche({ hauptkennzahl: "LINKKLICKS", zufallsverteilt: false, laufzeitBis: ENDE, jetzt: JETZT, varianten: [variante("A", "INSTAGRAM", null, 40), variante("B", "INSTAGRAM", 900, 20)] });
  assert.equal(fehlt.status, "KEINE_AUSSAGE");
});

test("Reichweitenaufbau: Varianten – organisch nur Hinweis, A/B auffällig, Plattformen nicht vermischt", () => {
  const vs = [variante("A", "INSTAGRAM", 1840, 120), variante("B", "INSTAGRAM", 1210, 30)];
  const organisch = vergleiche({ hauptkennzahl: "LINKKLICKS", zufallsverteilt: false, laufzeitBis: ENDE, jetzt: JETZT, varianten: vs });
  assert.equal(organisch.status, "HINWEIS");
  assert.match(organisch.aussage, /kein Beweis/);
  assert.ok(organisch.hinweise.some((h) => h.includes("kein A/B-Test")));
  assert.ok(organisch.einschaetzung.every((e) => e.startsWith("Einschätzung")));
  const ab = vergleiche({ hauptkennzahl: "LINKKLICKS", zufallsverteilt: true, laufzeitBis: ENDE, jetzt: JETZT, varianten: vs });
  assert.equal(ab.status, "AUFFAELLIG");
  assert.equal(ab.bezeichnung, "A/B-Test");
  assert.ok(Math.abs(ab.tabelle[0].zellen.LINKKLICKS.quoteProzent! - (120 / 1840) * 100) < 1e-9, "Quote = Klicks ÷ Aufrufe × 100");
  const gemischt = vergleiche({ hauptkennzahl: "LINKKLICKS", zufallsverteilt: true, laufzeitBis: ENDE, jetzt: JETZT, varianten: [vs[0], { ...vs[1], plattform: "TIKTOK" }] });
  assert.equal(gemischt.status, "KEINE_AUSSAGE");
  assert.match(gemischt.aussage, /verschiedenen Plattformen/);
  const dauer = vergleiche({
    hauptkennzahl: "WIEDERGABEDAUER_SEK",
    zufallsverteilt: true,
    laufzeitBis: ENDE,
    jetzt: JETZT,
    varianten: [variante("A", "INSTAGRAM", 2000, null, { WIEDERGABEDAUER_SEK: { wert: 9, quelle: "M" } }), variante("B", "INSTAGRAM", 2000, null, { WIEDERGABEDAUER_SEK: { wert: 12, quelle: "M" } })],
  });
  assert.equal(dauer.status, "KEINE_AUSSAGE", "Durchschnittswerte ohne Einzeldaten: kein Test");
  assert.ok(dauer.einschaetzung[0].includes("Variante B"));
  const laeuft = vergleiche({ hauptkennzahl: "LINKKLICKS", zufallsverteilt: true, laufzeitBis: new Date("2026-12-01"), jetzt: JETZT, varianten: vs });
  assert.ok(laeuft.hinweise.some((h) => h.includes("Zwischenstand")));
  assert.equal(zWert(0, 0, 1, 10), null);
  assert.ok(Math.abs(zWert(50, 1000, 50, 1000)!) < 1e-12);
});

test("Reichweitenaufbau: Werbung – Freigabe nur bei exakt bestätigtem Betrag, Laufzeit und Ziel", () => {
  const p = { plattform: "META", ziel: "TRAFFIC", startAm: new Date("2026-11-01"), endeAm: new Date("2026-11-07"), tagesbudgetCent: 1000, gesamtbudgetCent: 7000 };
  const ok = { gesamtbudgetCent: 7000, startAm: "2026-11-01", endeAm: "2026-11-07", ziel: "TRAFFIC", bestaetigt: true };
  assert.equal(pruefeFreigabe(p, ok), null);
  assert.match(pruefeFreigabe(p, { ...ok, bestaetigt: false })!, /ausdrücklich/);
  assert.match(pruefeFreigabe(p, { ...ok, gesamtbudgetCent: 70000 })!, /Betrag/);
  assert.match(pruefeFreigabe(p, { ...ok, endeAm: "2026-11-30" })!, /Laufzeit/);
  assert.match(pruefeFreigabe(p, { ...ok, ziel: "LEADS" })!, /Ziel/);
  assert.notEqual(freigabeHash(p), freigabeHash({ ...p, gesamtbudgetCent: 7001 }), "Änderung macht Freigabe ungültig");
  assert.equal(laufzeitTage(p), 7);
  assert.ok(planHinweise(p).some((h) => h.includes("garantiert keine")));
  assert.match(PLATTFORM_VORAUSSETZUNGEN.LINKEDIN.zielgruppen.AEHNLICH, /eingestellt/);
});

test("Reichweitenaufbau: Werbung – Export ohne Formel-Injektion, Vorschläge nur mit Belegen", () => {
  const csv = exportCsv({
    plattform: "META", ziel: "TRAFFIC", startAm: new Date("2026-11-01"), endeAm: new Date("2026-11-07"), tagesbudgetCent: 1000, gesamtbudgetCent: 7000,
    titel: "=HYPERLINK(\"x\")", zielgruppe: "", zielgruppenArt: "NEU", region: "", sprache: "Deutsch", zielUrl: "", erfolgsmessung: "", status: "ENTWURF", freigegebenAm: null, istDemo: false, inhalt: "",
  });
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
  assert.ok(csv.includes("nicht freigegeben"));
  assert.ok(csv.includes("geplant"));
  const v = bewerbungsVorschlaege([
    { kampagneId: "a", titel: "A", aufrufe: 5, zielKlicks: 3, anfragen: 1, newsletterBestaetigt: 0, istDemo: false },
    { kampagneId: "b", titel: "B", aufrufe: 100, zielKlicks: 10, anfragen: 0, newsletterBestaetigt: 0, istDemo: false },
    { kampagneId: "c", titel: "C", aufrufe: 100, zielKlicks: 0, anfragen: 0, newsletterBestaetigt: 0, istDemo: false },
    { kampagneId: "d", titel: "D", aufrufe: 50, zielKlicks: 2, anfragen: 3, newsletterBestaetigt: 0, istDemo: true },
  ]);
  assert.deepEqual(v.map((x) => x.kampagneId), ["d", "b"]);
  assert.ok(v[0].begruendung.includes("DEMO"));
  assert.ok(v[0].begruendung.includes("kein Beleg"));
});

test("Reichweitenaufbau: Newsletter-Übergänge und Statusleiste", () => {
  assert.ok(darfUebergang("freigeben", "PRUEFUNG"));
  assert.ok(darfUebergang("versenden", "FREIGEGEBEN"), "Versand per Klick nach Freigabe");
  assert.ok(!darfUebergang("versenden", "VERSAND_LAEUFT"), "kein Doppelversand");
  assert.ok(!darfUebergang("versenden", "ENTWURF"));
  assert.ok(!darfUebergang("planen", "ENTWURF"), "Planen erst nach Freigabe");
  assert.deepEqual(themenBereinigen(["A", "A", " B ", 3, "C"], ["A", "B"]), ["A", "B"]);
  assert.equal(stufeAusgabe("VERSENDET_DEMO"), null, "Demo-Versand zählt nicht als versendet");
  assert.equal(stufeAusgabe("VERSENDET"), "UMGESETZT");
  assert.equal(stufeWerbeplan("FREIGEGEBEN", null), "FREIGEGEBEN", "Freigabe ist kein Start");
  assert.equal(stufeInhalt("PUBLISHED", false), "UMGESETZT");
  assert.equal(stufeInhalt("PUBLISHED", true), "AUSGEWERTET");
  const s = naechsteSchritte({
    inhalteInPruefung: 0, inhalteFreigegebenOhneVeroeffentlichung: 0, variantenOhneAussage: 0, kooperationenOhneNaechstenSchritt: 0, kooperationenTerminBald: 0,
    werbeplaeneFreigegeben: 1, werbeplaeneInPruefung: 0, ausgabenGeplant: 1, ausgabenInPruefung: 0, newsletterModus: "DEMO", newsletterSeiten: 1, plattformStatistikAngebunden: false,
  });
  assert.ok(s.some((x) => x.text.includes("exportieren")));
  assert.ok(s.some((x) => x.art === "FEHLT" && x.text.includes("Resend-Zugang")));
});

test("Empfehlung: Newsletter in der Auswertung nur mit Anmeldeseite, nur bestätigte Anmeldungen", () => {
  const ohne = auswerten({ links: [], ereignisse: [], kennzahlen: [] });
  assert.equal(ohne.newsletter.status, "NICHT_ANGEBUNDEN");
  const mit = auswerten({ links: [], ereignisse: [], kennzahlen: [], newsletter: { bestaetigt: [{ confirmedAt: new Date("2026-10-10"), istDemo: true }] } });
  assert.equal(mit.newsletter.wert, 1);
  assert.equal(mit.newsletter.status, "GEMESSEN");
  assert.equal(mit.enthaeltDemo, true);
});

test("Reichweitenaufbau: Freischaltung – Newsletter und Werbung standardmäßig aus, Kennzeichnung offen gemeldet", async () => {
  const { newsletterFreigeschaltet, werbungFreigeschaltet, nurWenn } = await import("@/lib/reichweitenaufbau/freischaltung");
  const { kennzeichnungWarnung, anfrageEntwurf } = await import("@/lib/reichweitenaufbau/kooperation");
  const vorher = { nl: process.env.REICHWEITE_NEWSLETTER, wb: process.env.REICHWEITE_WERBUNG };
  delete process.env.REICHWEITE_NEWSLETTER;
  delete process.env.REICHWEITE_WERBUNG;
  try {
    assert.equal(newsletterFreigeschaltet(), false);
    assert.equal(werbungFreigeschaltet(), false);
    const h = nurWenn(newsletterFreigeschaltet, async () => new Response("ok"));
    assert.equal((await h()).status, 404);
    process.env.REICHWEITE_NEWSLETTER = "1";
    assert.equal((await h()).status, 200);
  } finally {
    if (vorher.nl === undefined) delete process.env.REICHWEITE_NEWSLETTER; else process.env.REICHWEITE_NEWSLETTER = vorher.nl;
    if (vorher.wb === undefined) delete process.env.REICHWEITE_WERBUNG; else process.env.REICHWEITE_WERBUNG = vorher.wb;
  }
  const lage = {
    inhalteInPruefung: 0, inhalteFreigegebenOhneVeroeffentlichung: 0, variantenOhneAussage: 0, kooperationenOhneNaechstenSchritt: 0, kooperationenTerminBald: 0,
    werbeplaeneFreigegeben: 1, werbeplaeneInPruefung: 1, ausgabenGeplant: 1, ausgabenInPruefung: 1, newsletterModus: "DEMO" as const, newsletterSeiten: 0, plattformStatistikAngebunden: false,
  };
  const aus = naechsteSchritte({ ...lage, newsletterAktiv: false, werbungAktiv: false, kooperationenOhneKennzeichnung: 2 });
  assert.ok(aus.every((x) => x.tab !== "newsletter" && x.tab !== "werbung"), "abgeschaltete Bereiche ohne Hinweise");
  assert.ok(aus.some((x) => x.text.includes("Werbekennzeichnung")));
  assert.equal(kennzeichnungWarnung({ status: "VEREINBART", kennzeichnung: "OFFEN" }), "Werbekennzeichnung noch nicht geklärt.");
  assert.equal(kennzeichnungWarnung({ status: "IDEE", kennzeichnung: "OFFEN" }), null);
  assert.equal(kennzeichnungWarnung({ status: "UMGESETZT", kennzeichnung: "WERBUNG" }), null);
  assert.match(anfrageEntwurf({ name: "X", format: "AKTION", idee: "", passungNotiz: "", absender: "Y", sie: true }), /Werbung bzw\. Anzeige/);
});

test("Ratenbegrenzung pseudonymisiert Schlüssel, DMARC-Prüfung erbt von der Hauptdomain", async () => {
  const { gespeicherterSchluessel } = await import("@/lib/rateLimit");
  const k = gespeicherterSchluessel("widget-ip:abc:203.0.113.7");
  assert.match(k, /^widget-ip:[0-9a-f]{32}$/);
  assert.ok(!k.includes("203.0.113.7"));
  assert.equal(gespeicherterSchluessel("widget-ip:abc:203.0.113.7"), k, "stabil");
  assert.notEqual(gespeicherterSchluessel("widget-ip:abc:203.0.113.8"), k);
  assert.equal(gespeicherterSchluessel("hermespub:global"), gespeicherterSchluessel("hermespub:global"));
  const { dmarcPruefen } = await import("@/lib/zugaenge/service");
  const vorher = process.env.DMARC_TEST_EINTRAEGE;
  process.env.DMARC_TEST_EINTRAEGE = JSON.stringify({ "_dmarc.firma.de": "v=DMARC1; p=none" });
  try {
    assert.deepEqual(await dmarcPruefen("news.firma.de"), { status: "OK", wo: "_dmarc.firma.de", basis: "firma.de" });
    assert.equal((await dmarcPruefen("andere.de")).status, "FEHLT");
  } finally {
    if (vorher === undefined) delete process.env.DMARC_TEST_EINTRAEGE; else process.env.DMARC_TEST_EINTRAEGE = vorher;
  }
});

test("Kampagnenassistent: Pflichtangaben, Zeitraum, Budget und bearbeitbarer Ablauf", async () => {
  const { pruefeKampagne, ablaufVorschlag, kampagneFehlt } = await import("@/lib/reichweitenaufbau/kampagnenplan");
  const e = { titel: "Herbst", ziel: "20 Anfragen bis Ende November", hauptkennzahl: "ANFRAGEN", zielgruppe: "Handwerk", zielUrl: "https://example.com/a", startAm: "2026-11-01", endeAm: "2026-11-30", verantwortlichId: "u1", verantwortlichName: "Mia", budgetCent: null };
  assert.equal(pruefeKampagne(e), null);
  assert.match(pruefeKampagne({ ...e, ziel: "" }) ?? "", /Ziel/);
  assert.match(pruefeKampagne({ ...e, endeAm: "2026-10-01" }) ?? "", /vor dem Start/);
  assert.match(pruefeKampagne({ ...e, endeAm: "2028-01-01" }) ?? "", /länger als ein Jahr/);
  assert.match(pruefeKampagne({ ...e, verantwortlichId: "" }) ?? "", /Verantwortlichen/);
  assert.match(pruefeKampagne({ ...e, budgetCent: 0 }) ?? "", /Budget/);
  const ohne = ablaufVorschlag(e);
  assert.ok(!ohne.some((s) => s.art === "WERBUNG"), "ohne Budget kein Werbeschritt");
  assert.ok(ohne.some((s) => s.art === "FREIGABE" && s.titel.includes("Mia")));
  assert.equal(ohne.at(-1)?.art, "AUSWERTUNG");
  assert.ok(ablaufVorschlag({ ...e, budgetCent: 50_000 }).some((s) => s.art === "WERBUNG" && s.titel.includes("500,00")));
  assert.deepEqual(kampagneFehlt({ ziel: "", hauptkennzahl: "", zielgruppe: "x", zielUrl: "", startAm: null, endeAm: null, verantwortlichId: null }), ["Ziel", "Hauptkennzahl", "Zielseite", "Zeitraum", "Verantwortlicher für Freigaben"]);
});

test("Plattformformate: Fakten wortgleich mit Quelle, ungeprüfte markiert, Grenzen gemeldet", async () => {
  const { plattformVarianten, faktZeile, UNGEPRUEFT } = await import("@/lib/reichweitenaufbau/plattformformate");
  const fakten = [
    { text: "Der Kurs hat 6 Termine.", quelle: "Kursbeschreibung", geprueft: true },
    { text: "Über 90 % sind zufrieden.", quelle: "", geprueft: false },
  ];
  const v = plattformVarianten({ thema: "Herbstkurs", kernaussage: "Sicherer werden", zielgruppe: "Handwerk", aufforderung: "Jetzt anfragen", zielUrl: "https://example.com/k", fakten, plattformen: ["INSTAGRAM", "LINKEDIN", "LINKEDIN"] });
  assert.equal(v.length, 2, "jede Plattform nur einmal");
  for (const x of v) {
    for (const [i, f] of fakten.entries()) assert.ok(x.text.includes(faktZeile(f, i + 1)), "Fakt unverändert enthalten");
    assert.ok(x.text.includes("[1] Kursbeschreibung"));
    assert.ok(x.text.includes(`${UNGEPRUEFT} Über 90 %`));
    assert.equal(x.ungeprueft, 1);
    assert.ok(x.hinweise.some((h) => h.includes("ohne") || h.includes("keine Quelle")));
    assert.ok(x.text.includes("https://example.com/k"));
  }
  const lang = plattformVarianten({ thema: "T", kernaussage: "x".repeat(2300), zielgruppe: "", aufforderung: "", zielUrl: "", fakten: [], plattformen: ["TIKTOK"] });
  assert.ok(lang[0].hinweise.some((h) => h.includes("erlaubt 2200")));
});

test("Ergebnis-Zuordnung: unbekannte Herkunft bleibt unbekannt, Angebotsseite wird vererbt", async () => {
  const { ergebnisZuordnung } = await import("@/lib/reichweite/zuordnung");
  const links = [
    { id: "a", bezeichnung: "LinkedIn", herkunft: "TEAM", stufe: 1, parentId: null, angebotUrl: "https://example.com/firmen", istDemo: false },
    { id: "b", bezeichnung: "", herkunft: "BESUCHER", stufe: 2, parentId: "a", angebotUrl: "", istDemo: false },
    { id: "c", bezeichnung: "Instagram", herkunft: "TEAM", stufe: 1, parentId: null, angebotUrl: "", istDemo: false },
  ];
  const r = ergebnisZuordnung(links, [
    { linkId: "a", art: "ANFRAGE" },
    { linkId: "b", art: "ANFRAGE" },
    { linkId: "c", art: "AUFRUF" },
    { linkId: null, art: "ANFRAGE" },
    { linkId: "geloescht", art: "ZIEL_KLICK" },
  ], "https://example.com/kampagne");
  const z = Object.fromEntries(r.zeilen.map((x) => [x.schluessel, x]));
  assert.equal(z.b.angebotsseite, "https://example.com/firmen");
  assert.equal(z.c.angebotsseite, "https://example.com/kampagne");
  assert.equal(z.unbekannt.anfragen, 1);
  assert.equal(z.unbekannt.zielKlicks, 1);
  assert.equal(z.unbekannt.angebotsseite, "—");
  const firmen = r.jeAngebotsseite.find((s) => s.angebotsseite === "https://example.com/firmen");
  assert.equal(firmen?.anfragen, 2);
  assert.ok(!r.jeAngebotsseite.some((s) => s.angebotsseite === "—"), "Unbekanntes wird keiner Seite zugeordnet");
});

test("KI-Kosten: Schätzung für bekannte Modelle, unbekannte offen gekennzeichnet", async () => {
  const { kostenSchaetzen } = await import("@/lib/ai/kosten");
  const alt = process.env.ANTHROPIC_MODEL;
  try {
    delete process.env.ANTHROPIC_MODEL;
    const s = kostenSchaetzen("anthropic", 3000, 900);
    assert.equal(s.berechenbar, true);
    assert.equal(s.eingabeToken, 1000);
    assert.ok(Math.abs((s.usdMax ?? 0) - (1000 * 1 + 900 * 5) / 1e6) < 1e-12);
    process.env.ANTHROPIC_MODEL = "ein-unbekanntes-modell";
    const u = kostenSchaetzen("anthropic", 3000, 900);
    assert.equal(u.berechenbar, false);
    assert.equal(u.usdMax, null);
    assert.match(u.hinweis, /nicht berechenbar/);
  } finally {
    if (alt === undefined) delete process.env.ANTHROPIC_MODEL;
    else process.env.ANTHROPIC_MODEL = alt;
  }
});

test("Plattform-Richtlinien: KI-Kennzeichnung nur für Videos aus KI-Diensten", async () => {
  const { istKiVideo } = await import("@/lib/publishing/adapters");
  assert.equal(istKiVideo({ provider: "local" }), false);
  assert.equal(istKiVideo({ provider: "upload" }), false);
  assert.equal(istKiVideo({ provider: "capcut" }), true);
});
