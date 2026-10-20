import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { GET, OPTIONS, POST } from "@/app/api/v1/widget/messages/route";
import { mockFetch, resetInbox } from "../../../../../../tests/helpers";

const ORIGIN = "https://meine-website.de";
const URL_BASE = "http://localhost/api/v1/widget/messages";

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request(URL_BASE, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN, "x-forwarded-for": randomIp(), ...headers },
      body: JSON.stringify(body),
    })
  );
}

// Eindeutige IP pro Anfrage, damit das IP-Limit (8 / 10 min) diese Tests nicht stört.
let ipCounter = 0;
function randomIp() {
  ipCounter++;
  return `10.${Math.floor(ipCounter / 250)}.${ipCounter % 250}.1`;
}

describe("/api/v1/widget/messages", () => {
  beforeEach(async () => {
    await resetInbox();
    vi.stubEnv("WEBSITE_WIDGET_KEY", "widget-key");
    vi.stubEnv("WEBSITE_WIDGET_ORIGINS", ORIGIN);
    vi.stubEnv("WEBSITE_WIDGET_WEBHOOK_URL", "https://hooks.example/abc");
  });

  it("beantwortet den CORS-Preflight nur für die freigegebene Website", () => {
    const ok = OPTIONS(new Request(URL_BASE, { method: "OPTIONS", headers: { origin: ORIGIN } }));
    expect(ok.status).toBe(204);
    expect(ok.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    const other = OPTIONS(new Request(URL_BASE, { method: "OPTIONS", headers: { origin: "https://fremd.example" } }));
    expect(other.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("legt eine Unterhaltung an, löst den Webhook aus und liefert sie per GET", async () => {
    const calls = mockFetch(() => new Response("ok"));
    const res = await post({ key: "widget-key", name: "Ben", email: "ben@example.com", message: "Was kostet das?" });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.token).toBeTruthy();
    expect(data.messages).toHaveLength(1);
    await vi.waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].headers["x-secret58-event"]).toBe("widget.message.received");

    const get = await GET(
      new Request(`${URL_BASE}?key=widget-key&token=${data.token}`, { headers: { origin: ORIGIN } })
    );
    expect(get.status).toBe(200);
    expect((await get.json()).messages[0]).toMatchObject({ from: "visitor", body: "Was kostet das?" });
  });

  it("validiert Eingaben und lehnt fremde Origins ab", async () => {
    mockFetch(() => new Response("ok"));
    expect((await post({ key: "widget-key", message: "Hi", email: "kaputt" })).status).toBe(400);
    expect((await post({ key: "widget-key", message: "" })).status).toBe(400);
    expect((await post({ key: "widget-key", message: "Hi" }, { origin: "https://fremd.example" })).status).toBe(403);
    expect((await post({ key: "falsch", message: "Hi" })).status).toBe(403);
    expect(await prisma.conversation.count()).toBe(0);
  });

  it("speichert nichts, wenn das Honeypot-Feld ausgefüllt ist", async () => {
    const calls = mockFetch(() => new Response("ok"));
    const res = await post({ key: "widget-key", message: "Spam", website: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(await prisma.conversation.count()).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it("antwortet mit 404 für unbekannte Tokens", async () => {
    const res = await GET(new Request(`${URL_BASE}?key=widget-key&token=gibtsnicht`, { headers: { origin: ORIGIN } }));
    expect(res.status).toBe(404);
  });

  it("begrenzt Nachrichten pro Unterhaltung auch bei wechselnden IPs", async () => {
    mockFetch(() => new Response("ok"));
    const first = await (await post({ key: "widget-key", message: "Start" })).json();
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) {
      statuses.push((await post({ key: "widget-key", token: first.token, message: `Nachricht ${i}` })).status);
    }
    expect(statuses.slice(0, 20).every((s) => s === 200)).toBe(true);
    expect(statuses[20]).toBe(429);
  });
});
