import { z } from "zod";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import {
  WIDGET_MAX_MESSAGE,
  checkWidgetRequest,
  findVisitorConversation,
  receiveVisitorMessage,
  sendWidgetWebhook,
  visitorMessages,
  widgetJson,
  widgetPreflight,
} from "@/lib/widget/websiteWidget";

// Öffentliche Route für public/widget.js — Schutz über Widget-ID,
// Origin-Freigabe und Limits (src/lib/widget/websiteWidget.ts).

const postSchema = z.object({
  key: z.string().max(200),
  token: z.string().max(100).optional(),
  name: z.string().trim().max(80).optional(),
  email: z.union([z.literal(""), z.string().trim().email().max(200)]).optional(),
  page: z.union([z.literal(""), z.string().trim().url().max(500).regex(/^https?:\/\//)]).optional(),
  message: z.string().trim().min(1).max(WIDGET_MAX_MESSAGE),
  // Honeypot: für Menschen unsichtbares Feld, Bots füllen es aus.
  website: z.string().optional(),
});

export function OPTIONS(request: Request) {
  return widgetPreflight(request);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const denied = checkWidgetRequest(request, params.get("key") ?? "", "read");
  if (denied) return denied;

  const conversation = await findVisitorConversation(params.get("token") ?? undefined);
  if (!conversation) return widgetJson(request, { error: "Unterhaltung nicht gefunden." }, 404);

  const afterParam = params.get("after");
  const after = afterParam ? new Date(afterParam) : undefined;
  const messages = await visitorMessages(conversation.id, after && !isNaN(after.getTime()) ? after : undefined);
  return widgetJson(request, { messages });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const key = body && typeof body === "object" && typeof (body as { key?: unknown }).key === "string"
    ? (body as { key: string }).key
    : "";
  const denied = checkWidgetRequest(request, key, "write");
  if (denied) return denied;

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const error =
      field === "email" ? "Bitte eine gültige E-Mail-Adresse angeben."
        : field === "message" ? `Bitte eine Nachricht mit höchstens ${WIDGET_MAX_MESSAGE} Zeichen eingeben.`
          : "Ungültige Eingabe.";
    return widgetJson(request, { error }, 400);
  }
  const input = parsed.data;
  if (input.website) {
    // Bot: so tun, als ob alles geklappt hätte, aber nichts speichern.
    return widgetJson(request, { ok: true, messages: [] });
  }

  const workspaceId = await getCurrentWorkspaceId();
  const result = await receiveVisitorMessage({
    workspaceId,
    token: input.token,
    name: input.name || undefined,
    email: input.email || undefined,
    page: input.page || undefined,
    message: input.message,
  });
  if ("error" in result) return widgetJson(request, { error: result.error }, result.status);

  void sendWidgetWebhook("widget.message.received", result.conversation, result.message);
  const messages = await visitorMessages(result.conversation.id);
  return widgetJson(request, { ok: true, token: result.token, messages }, result.token ? 201 : 200);
}
