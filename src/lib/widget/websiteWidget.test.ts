import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  checkWidgetRequest,
  receiveVisitorMessage,
  sendWidgetWebhook,
  visitorMessages,
  widgetConfig,
} from "@/lib/widget/websiteWidget";
import { mockFetch, resetInbox } from "../../../tests/helpers";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function enableWidget() {
  vi.stubEnv("WEBSITE_WIDGET_KEY", "widget-key");
  vi.stubEnv("WEBSITE_WIDGET_ORIGINS", "https://meine-website.de/, https://www.meine-website.de");
}

let ipCounter = 0;
function widgetRequest(origin: string | null, ip = `198.51.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`) {
  const headers: Record<string, string> = { "x-forwarded-for": ip };
  if (origin) headers.origin = origin;
  return new Request("http://localhost/api/v1/widget/messages", { method: "POST", headers });
}

describe("widgetConfig / checkWidgetRequest", () => {
  it("ist ohne ID oder Origins deaktiviert (503)", () => {
    vi.stubEnv("WEBSITE_WIDGET_KEY", "widget-key");
    vi.stubEnv("WEBSITE_WIDGET_ORIGINS", "");
    expect(widgetConfig().enabled).toBe(false);
    expect(checkWidgetRequest(widgetRequest("https://meine-website.de"), "widget-key", "write")?.status).toBe(503);
  });

  it("normalisiert Origins und prüft ID sowie Origin", () => {
    enableWidget();
    expect(widgetConfig().origins).toEqual(["https://meine-website.de", "https://www.meine-website.de"]);
    expect(checkWidgetRequest(widgetRequest("https://meine-website.de"), "falsch", "write")?.status).toBe(403);
    expect(checkWidgetRequest(widgetRequest("https://fremd.example"), "widget-key", "write")?.status).toBe(403);
    expect(checkWidgetRequest(widgetRequest(null), "widget-key", "write")?.status).toBe(403);
    expect(checkWidgetRequest(widgetRequest("https://MEINE-website.de"), "widget-key", "write")).toBeNull();
  });

  it("begrenzt Nachrichten pro IP", () => {
    enableWidget();
    const ip = "203.0.113.7";
    const results = Array.from({ length: 9 }, () =>
      checkWidgetRequest(widgetRequest("https://meine-website.de", ip), "widget-key", "write")
    );
    expect(results.slice(0, 8).every((r) => r === null)).toBe(true);
    expect(results[8]?.status).toBe(429);
  });
});

describe("Unterhaltungen aus dem Widget", () => {
  let workspaceId: string;
  beforeEach(async () => {
    workspaceId = await resetInbox();
  });

  it("legt beim ersten Kontakt eine WEBSITE-Konversation mit Token an und setzt sie fort", async () => {
    const first = await receiveVisitorMessage({
      workspaceId,
      name: "Anna",
      email: "anna@example.com",
      page: "https://meine-website.de/preise",
      message: "Habt ihr Samstag offen?",
    });
    if ("error" in first) throw new Error(first.error);
    expect(first.token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(first.conversation).toMatchObject({
      platform: "WEBSITE",
      channel: "DIRECT_MESSAGE",
      participantName: "Anna",
      participantHandle: "anna@example.com",
      externalContext: "https://meine-website.de/preise",
    });
    // In der DB liegt nur der Hash, nicht das Token.
    expect(first.conversation.visitorTokenHash).not.toBe(first.token);

    const second = await receiveVisitorMessage({ workspaceId, token: first.token, message: "Und Sonntag?" });
    if ("error" in second) throw new Error(second.error);
    expect(second.token).toBeUndefined();
    expect(second.conversation.id).toBe(first.conversation.id);
    expect(await prisma.conversation.count()).toBe(1);
  });

  it("zeigt dem Besucher nur gesendete Antworten, sortiert nach Sendezeit", async () => {
    const created = await receiveVisitorMessage({ workspaceId, message: "Frage 1" });
    if ("error" in created) throw new Error(created.error);
    const conversationId = created.conversation.id;
    const draft = await prisma.message.create({
      data: { conversationId, direction: "OUTBOUND", body: "Entwurf", status: "DRAFTED" },
    });
    // Kurze Pausen, damit sich die Zeitstempel sicher unterscheiden (Millisekunden-Auflösung).
    await sleep(5);
    const before = new Date();
    await sleep(5);
    await prisma.message.create({ data: { conversationId, direction: "INBOUND", body: "Frage 2" } });

    expect((await visitorMessages(conversationId)).map((m) => m.body)).toEqual(["Frage 1", "Frage 2"]);

    // Entwurf wurde vor „Frage 2“ erstellt, aber erst danach gesendet.
    await prisma.message.update({
      where: { id: draft.id },
      data: { status: "SENT", sentAt: new Date(Date.now() + 1000), body: "Antwort" },
    });
    const all = await visitorMessages(conversationId);
    expect(all.map((m) => [m.from, m.body])).toEqual([
      ["visitor", "Frage 1"],
      ["visitor", "Frage 2"],
      ["team", "Antwort"],
    ]);
    expect((await visitorMessages(conversationId, before)).map((m) => m.body)).toEqual(["Frage 2", "Antwort"]);
  });
});

describe("sendWidgetWebhook", () => {
  it("signiert den Body mit HMAC-SHA256 über Zeitstempel und Body", async () => {
    vi.stubEnv("WEBSITE_WIDGET_WEBHOOK_URL", "https://hooks.example/abc");
    vi.stubEnv("WEBSITE_WIDGET_WEBHOOK_SECRET", "geheim");
    const calls = mockFetch(() => new Response("ok"));
    const now = new Date();
    const ok = await sendWidgetWebhook(
      "widget.message.received",
      { id: "c1", participantName: "Anna", participantHandle: "", externalContext: "" } as never,
      { id: "m1", body: "Hallo", createdAt: now, sentAt: null } as never
    );
    expect(ok).toBe(true);
    const { headers, body } = calls[0];
    expect(headers["x-secret58-event"]).toBe("widget.message.received");
    const expected = createHmac("sha256", "geheim").update(`${headers["x-secret58-timestamp"]}.${body}`).digest("hex");
    expect(headers["x-secret58-signature"]).toBe(`sha256=${expected}`);
    expect(JSON.parse(body)).toMatchObject({
      event: "widget.message.received",
      conversation: { id: "c1", name: "Anna", email: null, inboxPath: "/inbox/c1" },
      message: { id: "m1", body: "Hallo" },
    });
  });

  it("schluckt Fehler des Empfängers und sendet ohne URL nichts", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("WEBSITE_WIDGET_WEBHOOK_URL", "");
    const calls = mockFetch(() => new Response("kaputt", { status: 500 }));
    expect(await sendWidgetWebhook("widget.reply.sent", {} as never, { createdAt: new Date() } as never)).toBe(false);
    expect(calls).toHaveLength(0);

    vi.stubEnv("WEBSITE_WIDGET_WEBHOOK_URL", "https://hooks.example/abc");
    const msg = { id: "m", body: "", createdAt: new Date(), sentAt: null };
    const conv = { id: "c", participantName: "", participantHandle: "", externalContext: "" };
    expect(await sendWidgetWebhook("widget.reply.sent", conv as never, msg as never)).toBe(false);
  });
});
