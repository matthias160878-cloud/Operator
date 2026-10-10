/**
 * Lokale Attrappen NUR für die Tests — kein Ersatz für Stripe-Testmodus:
 *  - Stripe-API (Preise, Checkout, Portal, Guthaben, Auszahlungen, Connect)
 *  - Anthropic-Messages-API (feste Antwort, optional verzögert)
 *  - eine "Kundenwebseite" für Domainprüfung und Einbindungstest
 * Jede Anfrage wird protokolliert, damit Tests prüfen können, was gesendet wurde.
 */
import http from "node:http";

export function startFakeServices() {
  const calls = [];
  let n = 0;
  const site = { verifyText: "", homepage: "<html><body>Hallo</body></html>" };
  const accounts = new Map();
  const fakes_completed = new Set();
  // Composio-Attrappe: verbundene Konten, nächster Status, Fehlerschalter.
  const composio = { accounts: new Map(), nextStatus: "ACTIVE", failExecute: false, apiKey: "ck_test_fake", n: 0 };

  const json = (res, status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };

  const stripeServer = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", async () => {
      const url = new URL(req.url, "http://x");
      const params = Object.fromEntries(new URLSearchParams(raw));
      calls.push({ method: req.method, path: url.pathname, params, raw, stripeAccount: req.headers["stripe-account"] ?? null });
      const p = url.pathname;
      if (p.startsWith("/api/v3/")) {
        if (req.headers["x-api-key"] !== composio.apiKey) return json(res, 401, { error: { message: "invalid api key" } });
        const body = raw ? JSON.parse(raw) : {};
        calls[calls.length - 1].composioBody = body;
        if (req.method === "POST" && p === "/api/v3/connected_accounts/link") {
          composio.n += 1;
          const id = `ca_test_${composio.n}`;
          const toolkit = { ac_instagram: "instagram", ac_youtube: "youtube" }[body.auth_config_id] ?? "unknown";
          composio.accounts.set(id, { id, user_id: body.user_id, status: composio.nextStatus, toolkit: { slug: toolkit } });
          return json(res, 200, { id: `lnk_${composio.n}`, connected_account_id: id, redirect_url: `https://connect.composio.test/link/${id}` });
        }
        const m = p.match(/^\/api\/v3\/connected_accounts\/([^/]+)$/);
        if (m && req.method === "GET") {
          const acc = composio.accounts.get(m[1]);
          return acc ? json(res, 200, acc) : json(res, 404, { error: { message: "not found" } });
        }
        if (m && req.method === "DELETE") {
          const existed = composio.accounts.delete(m[1]);
          return existed ? json(res, 200, { success: true }) : json(res, 404, { error: { message: "not found" } });
        }
        if (req.method === "POST" && p.startsWith("/api/v3/tools/execute/")) {
          const acc = composio.accounts.get(body.connected_account_id);
          if (!acc || acc.user_id !== body.user_id) return json(res, 400, { error: { message: "account/user mismatch" } });
          if (composio.failExecute) return json(res, 200, { successful: false, data: null, error: "insufficient scope" });
          return json(res, 200, { successful: true, data: { username: `konto_${acc.id}` }, error: null });
        }
        if (req.method === "GET" && p === "/api/v3/auth_configs") return json(res, 200, { items: [] });
        return json(res, 404, { error: { message: `fake composio: ${req.method} ${p}` } });
      }
      if (p === "/v1/messages") {
        await new Promise((r) => setTimeout(r, 150));
        return json(res, 200, { content: [{ type: "text", text: '{"headline":"Test","concept":"Konzept","colors":[],"textOverlay":"x"}' }] });
      }
      if (req.method === "GET" && p.startsWith("/v1/prices/")) {
        const id = p.split("/").pop();
        // Bestätigt: beide Pakete monatlich; "price_once" nur für den Ablehnungstest.
        // Jahresabo: 12 × Monatspreis minus 15 %.
        const yearly = { price_pro_year: 601800 };
        const recurring = id === "price_once" ? null : { interval: id in yearly ? "year" : "month", interval_count: 1 };
        return json(res, 200, {
          id, object: "price", active: true, currency: "eur", tax_behavior: "exclusive",
          unit_amount: id in yearly ? yearly[id] : id === "price_maxi" ? 79700 : 59000, recurring,
          product: { id: "prod_x", object: "product", name: id === "price_maxi" ? "Maxi" : "Pro" },
        });
      }
      if (req.method === "POST" && p === "/v1/checkout/sessions") {
        n += 1;
        const id = `cs_test_${n}`;
        return json(res, 200, { id, object: "checkout.session", url: `https://checkout.stripe.test/${id}`, mode: params.mode });
      }
      if (req.method === "POST" && /^\/v1\/checkout\/sessions\/[^/]+\/expire$/.test(p)) {
        const id = p.split("/")[4];
        if (fakes_completed.has(id)) return json(res, 400, { error: { message: "session already complete" } });
        return json(res, 200, { id, object: "checkout.session", status: "expired" });
      }
      if (req.method === "GET" && p.startsWith("/v1/checkout/sessions/")) {
        const id = p.split("/")[4];
        return json(res, 200, { id, object: "checkout.session", status: fakes_completed.has(id) ? "complete" : "open" });
      }
      if (req.method === "POST" && p === "/v1/billing_portal/sessions") return json(res, 200, { id: "bps_1", url: "https://billing.stripe.test/p" });
      if (req.method === "GET" && p === "/v1/balance") {
        return json(res, 200, { object: "balance", available: [{ amount: 12345, currency: "eur" }], pending: [{ amount: 500, currency: "eur" }] });
      }
      if (req.method === "GET" && p === "/v1/payouts") {
        return json(res, 200, { object: "list", has_more: false, data: [{ id: "po_1", amount: 10000, currency: "eur", status: "paid", arrival_date: 1790000000 }] });
      }
      if (req.method === "POST" && p === "/v1/accounts") {
        n += 1;
        const acct = { id: `acct_test_${n}`, object: "account", charges_enabled: false, payouts_enabled: false, details_submitted: false, requirements: { currently_due: ["external_account"] }, default_currency: "eur" };
        accounts.set(acct.id, acct);
        return json(res, 200, acct);
      }
      if (req.method === "GET" && p.startsWith("/v1/accounts/")) {
        const acct = accounts.get(p.split("/").pop());
        return acct ? json(res, 200, acct) : json(res, 404, { error: { message: "no such account" } });
      }
      if (req.method === "POST" && p === "/v1/account_links") return json(res, 200, { object: "account_link", url: "https://connect.stripe.test/onboard" });
      return json(res, 404, { error: { message: `fake: ${req.method} ${p} nicht nachgebaut` } });
    });
  });

  const siteServer = http.createServer((req, res) => {
    if (req.url === "/.well-known/secret58-verify.txt") {
      res.writeHead(site.verifyText ? 200 : 404, { "content-type": "text/plain" });
      return res.end(site.verifyText);
    }
    res.writeHead(200, { "content-type": "text/html" });
    res.end(site.homepage);
  });

  return new Promise((resolve) => {
    stripeServer.listen(0, "127.0.0.1", () => {
      siteServer.listen(0, "127.0.0.1", () => {
        resolve({
          stripePort: stripeServer.address().port,
          sitePort: siteServer.address().port,
          calls,
          site,
          accounts,
          composio,
          completed: fakes_completed,
          close: () => Promise.all([new Promise((r) => stripeServer.close(r)), new Promise((r) => siteServer.close(r))]),
        });
      });
    });
  });
}
