import { createHash, createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { Conversation, Message } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hitRateLimit } from "@/lib/api/rateLimit";

/**
 * Website-Widget (public/widget.js): Besucher schreiben auf der eigenen
 * Website, die Nachricht landet als WEBSITE-Konversation im Posteingang,
 * Antworten aus dem Posteingang erscheinen im Widget. Jede neue Nachricht
 * und jede gesendete Antwort geht optional als signierter Webhook raus
 * (z. B. an Zapier/Make, um den Besucher per E-Mail zu benachrichtigen).
 *
 * Konfiguration nur über Umgebungsvariablen:
 * - WEBSITE_WIDGET_KEY — öffentliche Widget-ID (steht im Einbettungs-Code,
 *   ist also kein Geheimnis; schützt nur vor versehentlicher Fremdnutzung).
 * - WEBSITE_WIDGET_ORIGINS — Websites, auf denen das Widget laufen darf
 *   (kommagetrennt, z. B. https://meine-website.de). Pflicht: Anfragen von
 *   anderen Origins werden abgelehnt.
 * - WEBSITE_WIDGET_WEBHOOK_URL / WEBSITE_WIDGET_WEBHOOK_SECRET — optional.
 */

export const WIDGET_MAX_MESSAGE = 2000;

const POST_LIMIT_PER_IP = 8;
const POST_WINDOW_MS = 10 * 60_000;
const GET_LIMIT_PER_IP = 40;
const GET_WINDOW_MS = 60_000;
const NEW_CONVERSATIONS_PER_HOUR = 100;
// Zusätzlich zu den IP-Limits (X-Forwarded-For lässt sich fälschen):
const MESSAGES_PER_CONVERSATION = 20; // je 10 Minuten
const MESSAGES_PER_HOUR = 600; // alle Besucher zusammen

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

export function widgetConfig() {
  const key = (process.env.WEBSITE_WIDGET_KEY ?? "").trim();
  const origins = (process.env.WEBSITE_WIDGET_ORIGINS ?? "")
    .split(",")
    .map(normalizeOrigin)
    .filter((o) => /^https?:\/\/[^/]+$/.test(o));
  const webhookUrl = (process.env.WEBSITE_WIDGET_WEBHOOK_URL ?? "").trim();
  return {
    key,
    origins,
    webhookUrl: /^https?:\/\//i.test(webhookUrl) ? webhookUrl : "",
    webhookSigned: Boolean((process.env.WEBSITE_WIDGET_WEBHOOK_SECRET ?? "").trim()),
    enabled: key.length > 0 && origins.length > 0,
  };
}

function allowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const normalized = normalizeOrigin(origin);
  return widgetConfig().origins.includes(normalized) ? origin : null;
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = allowedOrigin(request);
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function widgetJson(request: Request, data: unknown, status = 200, extra: Record<string, string> = {}) {
  return NextResponse.json(data, {
    status,
    headers: { ...corsHeaders(request), "Cache-Control": "no-store", ...extra },
  });
}

export function widgetPreflight(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/**
 * Prüft Konfiguration, Widget-ID, Origin und Limit. Gibt `null` zurück,
 * wenn die Anfrage weiterlaufen darf, sonst die fertige Fehlerantwort.
 */
export function checkWidgetRequest(request: Request, key: string, kind: "read" | "write"): NextResponse | null {
  const config = widgetConfig();
  if (!config.enabled) {
    return widgetJson(request, { error: "Das Website-Widget ist nicht aktiviert." }, 503);
  }
  if (key !== config.key) {
    return widgetJson(request, { error: "Unbekannte Widget-ID." }, 403);
  }
  if (!allowedOrigin(request)) {
    return widgetJson(request, { error: "Diese Website ist für das Widget nicht freigegeben." }, 403);
  }
  const [limit, windowMs] = kind === "write" ? [POST_LIMIT_PER_IP, POST_WINDOW_MS] : [GET_LIMIT_PER_IP, GET_WINDOW_MS];
  const retryAfter = hitRateLimit(`widget:${kind}:${clientIp(request)}`, limit, windowMs);
  if (retryAfter !== null) {
    return widgetJson(request, { error: "Zu viele Nachrichten — bitte kurz warten." }, 429, {
      "Retry-After": String(retryAfter),
    });
  }
  return null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function findVisitorConversation(token: string | undefined) {
  if (!token || token.length > 100) return null;
  return prisma.conversation.findFirst({ where: { platform: "WEBSITE", visitorTokenHash: hashToken(token) } });
}

export interface WidgetMessage {
  id: string;
  from: "visitor" | "team";
  body: string;
  at: string;
}

/** Was der Besucher sehen darf: seine Nachrichten und gesendete Antworten (keine Entwürfe). */
export async function visitorMessages(conversationId: string, after?: Date): Promise<WidgetMessage[]> {
  // Antworten zählen ab dem Senden (sentAt), nicht ab dem Entwurf — sonst
  // würde ein früh erstellter, später gesendeter Entwurf beim Abruf fehlen.
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      OR: [
        { direction: "INBOUND", ...(after ? { createdAt: { gt: after } } : {}) },
        { direction: "OUTBOUND", status: "SENT", ...(after ? { sentAt: { gt: after } } : {}) },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  messages.sort((a, b) => (a.sentAt ?? a.createdAt).getTime() - (b.sentAt ?? b.createdAt).getTime());
  return messages.map((m) => ({
    id: m.id,
    from: m.direction === "INBOUND" ? "visitor" : "team",
    body: m.body,
    at: (m.sentAt ?? m.createdAt).toISOString(),
  }));
}

/**
 * Speichert eine Besuchernachricht. Ohne gültiges Token wird eine neue
 * Konversation angelegt und ein neues Token zurückgegeben.
 */
export async function receiveVisitorMessage(input: {
  workspaceId: string;
  token?: string;
  name?: string;
  email?: string;
  page?: string;
  message: string;
}): Promise<{ token?: string; conversation: Conversation; message: Message } | { error: string; status: number }> {
  let conversation = await findVisitorConversation(input.token);
  if (conversation && conversation.workspaceId !== input.workspaceId) conversation = null;
  let newToken: string | undefined;

  if (hitRateLimit("widget:all-messages", MESSAGES_PER_HOUR, 60 * 60_000) !== null) {
    return { error: "Gerade sind sehr viele Anfragen eingegangen — bitte später erneut versuchen.", status: 429 };
  }
  if (conversation && hitRateLimit(`widget:conversation:${conversation.id}`, MESSAGES_PER_CONVERSATION, POST_WINDOW_MS) !== null) {
    return { error: "Zu viele Nachrichten — bitte kurz warten.", status: 429 };
  }

  if (!conversation) {
    if (hitRateLimit("widget:new-conversations", NEW_CONVERSATIONS_PER_HOUR, 60 * 60_000) !== null) {
      return { error: "Gerade sind sehr viele Anfragen eingegangen — bitte später erneut versuchen.", status: 429 };
    }
    newToken = randomBytes(24).toString("base64url");
    conversation = await prisma.conversation.create({
      data: {
        workspaceId: input.workspaceId,
        platform: "WEBSITE",
        channel: "DIRECT_MESSAGE",
        participantName: input.name || "Website-Besucher",
        participantHandle: input.email ?? "",
        externalContext: input.page ?? "",
        visitorTokenHash: hashToken(newToken),
      },
    });
  }

  const now = new Date();
  const message = await prisma.message.create({
    data: { conversationId: conversation.id, direction: "INBOUND", body: input.message, status: "RECEIVED" },
  });
  conversation = await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: now,
      status: "OPEN",
      // Name/E-Mail darf der Besucher später nachtragen, aber nicht leeren.
      ...(input.name && conversation.participantName === "Website-Besucher" ? { participantName: input.name } : {}),
      ...(input.email && !conversation.participantHandle ? { participantHandle: input.email } : {}),
    },
  });

  return { token: newToken, conversation, message };
}

export type WidgetWebhookEvent = "widget.message.received" | "widget.reply.sent";

/**
 * Schickt ein Ereignis an WEBSITE_WIDGET_WEBHOOK_URL. Signatur (falls
 * WEBSITE_WIDGET_WEBHOOK_SECRET gesetzt): Header `X-Secret58-Signature:
 * sha256=<HMAC-SHA256 über "<timestamp>.<body>">` mit `X-Secret58-Timestamp`.
 * Wirft nie — ein nicht erreichbarer Webhook darf die Nachricht nicht verlieren.
 */
export async function sendWidgetWebhook(
  event: WidgetWebhookEvent,
  conversation: Conversation,
  message: Message
): Promise<boolean> {
  const { webhookUrl } = widgetConfig();
  if (!webhookUrl) return false;
  const body = JSON.stringify({
    event,
    createdAt: (message.sentAt ?? message.createdAt).toISOString(),
    conversation: {
      id: conversation.id,
      name: conversation.participantName,
      email: conversation.participantHandle || null,
      page: conversation.externalContext || null,
      inboxPath: `/inbox/${conversation.id}`,
    },
    message: { id: message.id, body: message.body },
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "SECRET58-Widget-Webhook/1.0",
    "X-Secret58-Event": event,
    "X-Secret58-Timestamp": timestamp,
  };
  const secret = (process.env.WEBSITE_WIDGET_WEBHOOK_SECRET ?? "").trim();
  if (secret) {
    headers["X-Secret58-Signature"] = `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.warn(`[widget] Webhook ${event} antwortete mit HTTP ${res.status}`);
    return res.ok;
  } catch (error) {
    console.warn(`[widget] Webhook ${event} nicht erreichbar:`, error instanceof Error ? error.message : error);
    return false;
  }
}
