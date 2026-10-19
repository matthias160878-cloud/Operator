import type { Conversation, PlatformAccount } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getValidAccessToken, getValidMessagingToken } from "@/lib/publishing/tokens";
import { linkedInRestHeaders } from "@/lib/oauth/providers";
import { requestJson, tiktokBusinessRequest } from "@/lib/messaging/http";

const GRAPH_FB = "https://graph.facebook.com/v19.0";
const GRAPH_IG = "https://graph.instagram.com/v21.0";

/** Maximale Textlänge je Plattform und Kanal (laut jeweiliger API). */
const MAX_LENGTH: Record<string, number> = {
  "YOUTUBE:COMMENT": 10000,
  "FACEBOOK:COMMENT": 8000,
  "FACEBOOK:DIRECT_MESSAGE": 2000,
  "INSTAGRAM:COMMENT": 2200,
  "INSTAGRAM:DIRECT_MESSAGE": 1000,
  "LINKEDIN:COMMENT": 1250,
  "TIKTOK:COMMENT": 1200,
  "TIKTOK:DIRECT_MESSAGE": 6000,
};

/** TikTok Business Messaging: max. 10 Nachrichten innerhalb von 48 h nach der letzten Kundennachricht. */
const TIKTOK_DM_WINDOW_MS = 48 * 60 * 60 * 1000;
const TIKTOK_DM_MAX_PER_WINDOW = 10;

async function assertTikTokDmWindow(conversationId: string) {
  const lastInbound = await prisma.message.findFirst({
    where: { conversationId, direction: "INBOUND" },
    orderBy: { createdAt: "desc" },
  });
  if (!lastInbound || Date.now() - lastInbound.createdAt.getTime() > TIKTOK_DM_WINDOW_MS) {
    throw new Error(
      "TikTok erlaubt Direktnachrichten nur innerhalb von 48 Stunden nach der letzten Nachricht des Kunden — dieses Fenster ist abgelaufen."
    );
  }
  const sentSince = await prisma.message.count({
    where: { conversationId, direction: "OUTBOUND", status: "SENT", sentAt: { gte: lastInbound.createdAt } },
  });
  if (sentSince >= TIKTOK_DM_MAX_PER_WINDOW) {
    throw new Error(
      `TikTok erlaubt höchstens ${TIKTOK_DM_MAX_PER_WINDOW} Nachrichten pro 48-Stunden-Fenster — warte auf eine neue Nachricht des Kunden.`
    );
  }
}

export interface SendReplyResult {
  externalId?: string;
}

/** `urn:li:comment:(urn:li:activity:123,456)` → Beitrags-URN + Kommentar-URN. */
export function parseLinkedInCommentUrn(urn: string): { objectUrn: string; commentUrn: string } | null {
  const match = urn.trim().match(/^urn:li:comment:\((urn:li:[a-zA-Z]+:[^,()]+),\s*([^)]+)\)$/);
  return match ? { objectUrn: match[1], commentUrn: urn.trim() } : null;
}

/**
 * Sendet eine Antwort über die native Plattform-API — als Kommentar-Antwort
 * (COMMENT) oder als Direktnachricht (DIRECT_MESSAGE). Wirft bei jedem
 * Fehler mit der Meldung der Plattform, damit der Status ehrlich auf
 * FAILED gesetzt werden kann.
 */
export async function sendPlatformReply(
  account: PlatformAccount,
  conversation: Conversation,
  text: string
): Promise<SendReplyResult> {
  const target = conversation.externalThreadId?.trim();
  if (!target) {
    throw new Error(
      "Diese Konversation wurde manuell angelegt und hat keine Plattform-ID. Rufe Nachrichten über „Nachrichten abrufen“ ab oder trage die Kommentar-/Empfänger-ID ein, um echt antworten zu können."
    );
  }

  const key = `${conversation.platform}:${conversation.channel}`;
  const max = MAX_LENGTH[key];
  if (max && text.length > max) {
    throw new Error(`Antwort ist zu lang für ${conversation.platform} (${text.length}/${max} Zeichen).`);
  }

  switch (key) {
    case "YOUTUBE:COMMENT": {
      const token = await getValidAccessToken(account);
      const { data } = await requestJson<{ id?: string }>(
        "https://www.googleapis.com/youtube/v3/comments?part=snippet",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ snippet: { parentId: target, textOriginal: text } }),
        },
        "YouTube-Kommentarantwort"
      );
      return { externalId: data.id };
    }

    case "FACEBOOK:COMMENT": {
      const token = await getValidAccessToken(account);
      const { data } = await requestJson<{ id?: string }>(
        `${GRAPH_FB}/${encodeURIComponent(target)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ message: text, access_token: token }),
        },
        "Facebook-Kommentarantwort"
      );
      return { externalId: data.id };
    }

    case "FACEBOOK:DIRECT_MESSAGE": {
      if (!account.externalAccountId) throw new Error("Facebook-Seiten-ID fehlt — Account erneut verbinden.");
      const token = await getValidAccessToken(account);
      const { data } = await requestJson<{ message_id?: string }>(
        `${GRAPH_FB}/${account.externalAccountId}/messages?access_token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipient: { id: target }, messaging_type: "RESPONSE", message: { text } }),
        },
        "Facebook-Messenger-Antwort"
      );
      return { externalId: data.message_id };
    }

    case "INSTAGRAM:COMMENT": {
      const token = await getValidAccessToken(account);
      const { data } = await requestJson<{ id?: string }>(
        `${GRAPH_IG}/${encodeURIComponent(target)}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ message: text, access_token: token }),
        },
        "Instagram-Kommentarantwort"
      );
      return { externalId: data.id };
    }

    case "INSTAGRAM:DIRECT_MESSAGE": {
      if (!account.externalAccountId) throw new Error("Instagram-Konto-ID fehlt — Account erneut verbinden.");
      const token = await getValidAccessToken(account);
      const { data } = await requestJson<{ message_id?: string }>(
        `${GRAPH_IG}/${account.externalAccountId}/messages`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ recipient: { id: target }, message: { text } }),
        },
        "Instagram-Direktnachricht"
      );
      return { externalId: data.message_id };
    }

    case "TIKTOK:COMMENT": {
      if (!account.messagingExternalId) {
        throw new Error(
          "TikTok-Antworten laufen über die TikTok API for Business — verbinde unter Social Media „Posteingang verbinden“."
        );
      }
      if (!conversation.externalObjectId) {
        throw new Error("TikTok verlangt die Video-ID zum Antworten — rufe den Kommentar über „Nachrichten abrufen“ ab.");
      }
      const token = await getValidMessagingToken(account);
      const data = await tiktokBusinessRequest<{ comment_id?: string }>(
        "/business/comment/reply/create/",
        token,
        {
          method: "POST",
          body: JSON.stringify({
            business_id: account.messagingExternalId,
            video_id: conversation.externalObjectId,
            comment_id: target,
            text,
          }),
        },
        "TikTok-Kommentarantwort"
      );
      return { externalId: data.comment_id };
    }

    case "LINKEDIN:COMMENT": {
      const parsedUrn = parseLinkedInCommentUrn(target);
      if (account.messagingAccessTokenEnc && account.messagingExternalId && parsedUrn) {
        // Antwort als Unternehmensseite über die Community Management API.
        const token = await getValidMessagingToken(account);
        const objectUrn = conversation.externalObjectId ?? parsedUrn.objectUrn;
        const { data, res } = await requestJson<{ id?: string; commentUrn?: string }>(
          `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(objectUrn)}/comments`,
          {
            method: "POST",
            headers: linkedInRestHeaders(token),
            body: JSON.stringify({
              actor: account.messagingExternalId,
              object: objectUrn,
              parentComment: parsedUrn.commentUrn,
              message: { text },
            }),
          },
          "LinkedIn-Kommentarantwort (Unternehmensseite)"
        );
        return { externalId: data.commentUrn ?? res.headers.get("x-restli-id") ?? data.id };
      }
      if (!account.externalAccountId) throw new Error("LinkedIn-Mitglieds-ID fehlt — Account erneut verbinden.");
      const parsed = parseLinkedInCommentUrn(target);
      if (!parsed) {
        throw new Error(
          "Ungültige LinkedIn-Kommentar-ID — erwartet wird eine URN wie urn:li:comment:(urn:li:activity:123,456)."
        );
      }
      const token = await getValidAccessToken(account);
      const { data, res } = await requestJson<{ id?: string }>(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(parsed.objectUrn)}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify({
            actor: `urn:li:person:${account.externalAccountId}`,
            object: parsed.objectUrn,
            parentComment: parsed.commentUrn,
            message: { text },
          }),
        },
        "LinkedIn-Kommentarantwort"
      );
      return { externalId: res.headers.get("x-restli-id") ?? data.id };
    }

    case "LINKEDIN:DIRECT_MESSAGE":
      throw new Error("LinkedIn erlaubt Drittanbieter-Apps keine Direktnachrichten — bitte direkt in LinkedIn antworten.");
    case "YOUTUBE:DIRECT_MESSAGE":
      throw new Error("YouTube hat keine Direktnachrichten — Antworten sind nur auf Kommentare möglich.");
    case "TIKTOK:DIRECT_MESSAGE": {
      if (!account.messagingExternalId) {
        throw new Error(
          "TikTok-Direktnachrichten laufen über die TikTok API for Business — verbinde unter Social Media „Posteingang verbinden“."
        );
      }
      if (process.env.TIKTOK_BUSINESS_MESSAGING !== "true") {
        throw new Error(
          "TikTok Business Messaging ist deaktiviert — nach TikToks Zugangsprüfung mit TIKTOK_BUSINESS_MESSAGING=true einschalten."
        );
      }
      await assertTikTokDmWindow(conversation.id);
      const token = await getValidMessagingToken(account);
      const data = await tiktokBusinessRequest<{ message?: { message_id?: string } }>(
        "/business/message/send/",
        token,
        {
          method: "POST",
          body: JSON.stringify({
            business_id: account.messagingExternalId,
            recipient_type: "CONVERSATION",
            recipient: target,
            message_type: "TEXT",
            text: { body: text },
          }),
        },
        "TikTok-Direktnachricht"
      );
      return { externalId: data.message?.message_id || undefined };
    }
    default:
      throw new Error(
        `${conversation.platform} bietet für Drittanbieter-Apps keine API zum Beantworten von Kommentaren oder Nachrichten — bitte direkt in der App antworten.`
      );
  }
}
