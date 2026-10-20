import type { ConversationChannel, Platform, PlatformAccount } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getValidAccessToken, getValidMessagingToken } from "@/lib/publishing/tokens";
import { linkedInRestHeaders } from "@/lib/oauth/providers";
import { requestJson, tiktokBusinessRequest } from "@/lib/messaging/http";

const GRAPH_FB = "https://graph.facebook.com/v19.0";
const GRAPH_IG = "https://graph.instagram.com/v21.0";

interface ThreadMessage {
  externalId: string;
  body: string;
  createdAt: Date;
  fromUs: boolean;
}

interface Thread {
  channel: ConversationChannel;
  externalThreadId: string;
  /** Beitrag, unter dem kommentiert wurde (TikTok-Video / LinkedIn-Post). */
  externalObjectId?: string;
  participantName: string;
  participantHandle: string;
  context: string;
  messages: ThreadMessage[];
}

export interface PlatformSyncResult {
  platform: Platform;
  ok: boolean;
  newConversations: number;
  newMessages: number;
  notes: string[];
}

/**
 * Legt Konversationen/Nachrichten an, die es noch nicht gibt (Entdoppelung
 * über die Plattform-IDs). Eigene Antworten werden als SENT übernommen,
 * damit der Verlauf vollständig ist und nicht doppelt geantwortet wird.
 */
async function storeThreads(workspaceId: string, platform: Platform, threads: Thread[]) {
  let newConversations = 0;
  let newMessages = 0;

  for (const thread of threads) {
    const messages = thread.messages.filter((m) => m.body.trim());
    if (messages.length === 0) continue;

    let conversation = await prisma.conversation.findFirst({
      where: { workspaceId, platform, channel: thread.channel, externalThreadId: thread.externalThreadId },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          workspaceId,
          platform,
          channel: thread.channel,
          externalThreadId: thread.externalThreadId,
          externalObjectId: thread.externalObjectId ?? null,
          externalContext: thread.context.slice(0, 300),
          participantName: thread.participantName.slice(0, 200) || "Unbekannt",
          participantHandle: thread.participantHandle.slice(0, 200),
          lastMessageAt: new Date(0),
        },
      });
      newConversations++;
    }

    let latestInbound: Date | null = null;
    let latest = conversation.lastMessageAt;
    for (const m of messages) {
      const exists = await prisma.message.findFirst({
        where: { conversationId: conversation.id, externalId: m.externalId },
        select: { id: true },
      });
      if (exists) continue;
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: m.fromUs ? "OUTBOUND" : "INBOUND",
          status: m.fromUs ? "SENT" : "RECEIVED",
          body: m.body,
          externalId: m.externalId,
          createdAt: m.createdAt,
          sentAt: m.fromUs ? m.createdAt : null,
        },
      });
      newMessages++;
      if (m.createdAt > latest) latest = m.createdAt;
      if (!m.fromUs && (!latestInbound || m.createdAt > latestInbound)) latestInbound = m.createdAt;
    }

    if (latest.getTime() !== conversation.lastMessageAt.getTime()) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: latest, ...(latestInbound ? { status: "OPEN" } : {}) },
      });
    }
  }

  return { newConversations, newMessages };
}

// --- YouTube: Kommentare unter allen Videos des Kanals --------------------------

async function fetchYouTube(account: PlatformAccount): Promise<Thread[]> {
  const token = await getValidAccessToken(account);
  const channelId = account.externalAccountId;
  if (!channelId) throw new Error("YouTube-Kanal-ID fehlt — Account erneut verbinden.");

  type Comment = {
    id: string;
    snippet: {
      authorDisplayName?: string;
      authorChannelId?: { value?: string };
      textOriginal?: string;
      textDisplay?: string;
      publishedAt: string;
    };
  };
  const { data } = await requestJson<{
    items?: {
      snippet: { videoId?: string; topLevelComment: Comment };
      replies?: { comments?: Comment[] };
    }[];
  }>(
    `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&allThreadsRelatedToChannelId=${encodeURIComponent(channelId)}&maxResults=50&order=time`,
    { headers: { Authorization: `Bearer ${token}` } },
    "YouTube-Kommentarabruf"
  );

  const toMessage = (c: Comment): ThreadMessage => ({
    externalId: c.id,
    body: c.snippet.textOriginal ?? c.snippet.textDisplay ?? "",
    createdAt: new Date(c.snippet.publishedAt),
    fromUs: c.snippet.authorChannelId?.value === channelId,
  });

  return (data.items ?? [])
    .filter((t) => t.snippet.topLevelComment.snippet.authorChannelId?.value !== channelId)
    .map((t) => {
      const top = t.snippet.topLevelComment;
      return {
        channel: "COMMENT" as const,
        externalThreadId: top.id,
        participantName: top.snippet.authorDisplayName ?? "YouTube-Nutzer",
        participantHandle: "",
        context: t.snippet.videoId ? `https://youtu.be/${t.snippet.videoId}` : "",
        messages: [top, ...(t.replies?.comments ?? [])].map(toMessage),
      };
    });
}

// --- Facebook: Kommentare auf Seitenbeiträgen + Messenger ---------------------

type GraphComment = {
  id: string;
  message?: string;
  created_time: string;
  from?: { id: string; name?: string };
  comments?: { data?: GraphComment[] };
};

async function fetchFacebookComments(token: string, pageId: string): Promise<Thread[]> {
  const fields =
    "id,message,permalink_url,comments.limit(25).order(reverse_chronological){id,message,created_time,from,comments.limit(10){id,message,created_time,from}}";
  const { data } = await requestJson<{
    data?: { id: string; message?: string; permalink_url?: string; comments?: { data?: GraphComment[] } }[];
  }>(
    `${GRAPH_FB}/${pageId}/posts?fields=${encodeURIComponent(fields)}&limit=10&access_token=${encodeURIComponent(token)}`,
    {},
    "Facebook-Kommentarabruf"
  );

  const threads: Thread[] = [];
  for (const post of data.data ?? []) {
    for (const top of post.comments?.data ?? []) {
      if (top.from?.id === pageId) continue;
      threads.push({
        channel: "COMMENT",
        externalThreadId: top.id,
        participantName: top.from?.name ?? "Facebook-Nutzer",
        participantHandle: "",
        context: post.permalink_url ?? (post.message ?? "").slice(0, 120),
        messages: [top, ...(top.comments?.data ?? [])].map((c) => ({
          externalId: c.id,
          body: c.message ?? "",
          createdAt: new Date(c.created_time),
          fromUs: c.from?.id === pageId,
        })),
      });
    }
  }
  return threads;
}

type GraphConversation = {
  participants?: { data?: { id: string; name?: string; username?: string }[] };
  messages?: { data?: { id: string; message?: string; created_time: string; from?: { id: string; username?: string } }[] };
};

function dmThreads(conversations: GraphConversation[], isUs: (from?: { id: string; username?: string }) => boolean): Thread[] {
  const threads: Thread[] = [];
  for (const conv of conversations) {
    const other = conv.participants?.data?.find((p) => !isUs(p));
    if (!other) continue;
    threads.push({
      channel: "DIRECT_MESSAGE",
      externalThreadId: other.id,
      participantName: other.name ?? other.username ?? "Unbekannt",
      participantHandle: other.username ?? "",
      context: "",
      messages: (conv.messages?.data ?? []).map((m) => ({
        externalId: m.id,
        body: m.message ?? "",
        createdAt: new Date(m.created_time),
        fromUs: isUs(m.from),
      })),
    });
  }
  return threads;
}

async function fetchFacebookMessages(token: string, pageId: string): Promise<Thread[]> {
  const fields = "participants,messages.limit(10){id,message,created_time,from}";
  const { data } = await requestJson<{ data?: GraphConversation[] }>(
    `${GRAPH_FB}/${pageId}/conversations?platform=messenger&fields=${encodeURIComponent(fields)}&limit=20&access_token=${encodeURIComponent(token)}`,
    {},
    "Facebook-Messenger-Abruf"
  );
  return dmThreads(data.data ?? [], (from) => from?.id === pageId);
}

// --- Instagram: Kommentare unter eigenen Medien + Direktnachrichten ----------

async function fetchInstagramComments(token: string, igId: string, isUs: (from?: { id: string; username?: string }) => boolean): Promise<Thread[]> {
  type IgComment = { id: string; text?: string; timestamp: string; username?: string; from?: { id: string; username?: string }; replies?: { data?: IgComment[] } };
  const fields = "id,caption,permalink,comments.limit(25){id,text,timestamp,username,from,replies{id,text,timestamp,username,from}}";
  const { data } = await requestJson<{
    data?: { id: string; caption?: string; permalink?: string; comments?: { data?: IgComment[] } }[];
  }>(
    `${GRAPH_IG}/${igId}/media?fields=${encodeURIComponent(fields)}&limit=10&access_token=${encodeURIComponent(token)}`,
    {},
    "Instagram-Kommentarabruf"
  );

  const threads: Thread[] = [];
  for (const media of data.data ?? []) {
    for (const top of media.comments?.data ?? []) {
      const author = top.from ?? (top.username ? { id: "", username: top.username } : undefined);
      if (isUs(author)) continue;
      const username = top.username ?? top.from?.username ?? "";
      threads.push({
        channel: "COMMENT",
        externalThreadId: top.id,
        participantName: username ? `@${username}` : "Instagram-Nutzer",
        participantHandle: username,
        context: media.permalink ?? (media.caption ?? "").slice(0, 120),
        messages: [top, ...(top.replies?.data ?? [])].map((c) => ({
          externalId: c.id,
          body: c.text ?? "",
          createdAt: new Date(c.timestamp),
          fromUs: isUs(c.from ?? (c.username ? { id: "", username: c.username } : undefined)),
        })),
      });
    }
  }
  return threads;
}

async function fetchInstagramMessages(token: string, isUs: (from?: { id: string; username?: string }) => boolean): Promise<Thread[]> {
  const fields = "participants,messages.limit(10){id,message,created_time,from}";
  const { data } = await requestJson<{ data?: GraphConversation[] }>(
    `${GRAPH_IG}/me/conversations?platform=instagram&fields=${encodeURIComponent(fields)}&limit=20&access_token=${encodeURIComponent(token)}`,
    {},
    "Instagram-Direktnachrichten-Abruf"
  );
  return dmThreads(data.data ?? [], isUs);
}

// --- TikTok: Kommentare unter eigenen Videos (Accounts API) -----------------

async function fetchTikTok(account: PlatformAccount): Promise<Thread[]> {
  const businessId = account.messagingExternalId;
  if (!businessId) throw new Error("TikTok-Business-ID fehlt — Posteingang erneut verbinden.");
  const token = await getValidMessagingToken(account);

  const videoParams = new URLSearchParams({
    business_id: businessId,
    fields: JSON.stringify(["item_id", "create_time", "caption", "share_url"]),
    max_count: "10",
  });
  const { videos = [] } = await tiktokBusinessRequest<{
    videos?: { item_id: string; caption?: string; share_url?: string }[];
  }>(`/business/video/list/?${videoParams}`, token, {}, "TikTok-Videoabruf");

  type TikTokComment = {
    comment_id: string;
    text?: string;
    create_time: string;
    owner?: boolean;
    username?: string;
    display_name?: string;
    parent_comment_id?: string;
    reply_list?: TikTokComment[];
  };
  const toMessage = (c: TikTokComment): ThreadMessage => ({
    externalId: String(c.comment_id),
    body: c.text ?? "",
    createdAt: new Date(Number(c.create_time) * 1000),
    fromUs: Boolean(c.owner),
  });

  const threads: Thread[] = [];
  for (const video of videos) {
    const params = new URLSearchParams({
      business_id: businessId,
      video_id: video.item_id,
      include_replies: "true",
      sort_field: "create_time",
      sort_order: "desc",
      max_count: "30",
    });
    const { comments = [] } = await tiktokBusinessRequest<{ comments?: TikTokComment[] }>(
      `/business/comment/list/?${params}`,
      token,
      {},
      "TikTok-Kommentarabruf"
    );
    for (const top of comments) {
      if (top.parent_comment_id || top.owner) continue;
      threads.push({
        channel: "COMMENT",
        externalThreadId: String(top.comment_id),
        externalObjectId: video.item_id,
        participantName: top.display_name || (top.username ? `@${top.username}` : "TikTok-Nutzer"),
        participantHandle: top.username ?? "",
        context: video.share_url ?? (video.caption ?? "").slice(0, 120),
        messages: [top, ...(top.reply_list ?? [])].map(toMessage),
      });
    }
  }
  return threads;
}

// --- TikTok: Direktnachrichten (Business Messaging API) ---------------------

/** Business Messaging ist freigabepflichtig — nur abrufen, wenn ausdrücklich aktiviert. */
export function isTikTokMessagingEnabled(): boolean {
  return process.env.TIKTOK_BUSINESS_MESSAGING === "true";
}

const TIKTOK_MESSAGE_PLACEHOLDER: Record<string, string> = {
  IMAGE: "[Bild]",
  VIDEO: "[Video]",
  SHARE_POST: "[Geteilter TikTok-Beitrag]",
  EMOJI: "[Emoji]",
  STICKER: "[Sticker]",
  TEMPLATE: "[Nachrichtenvorlage]",
  OTHER: "[Nicht unterstützter Nachrichtentyp]",
};

async function fetchTikTokMessages(account: PlatformAccount): Promise<Thread[]> {
  const businessId = account.messagingExternalId;
  if (!businessId) throw new Error("TikTok-Business-ID fehlt — Posteingang erneut verbinden.");
  const token = await getValidMessagingToken(account);

  type TikTokDm = {
    message_id: string;
    timestamp: number;
    message_type?: string;
    sender?: string;
    text?: { body?: string };
    from_user?: { id?: string; role?: string };
    template?: { title?: string };
  };
  type Participant = { id: string; role?: string; display_name?: string };

  const conversationIds: string[] = [];
  // STRANGER = Nachrichtenanfrage noch nicht beantwortet, SINGLE = laufende 1:1-Unterhaltung.
  for (const type of ["STRANGER", "SINGLE"]) {
    const params = new URLSearchParams({ business_id: businessId, conversation_type: type, limit: "20" });
    const { conversations = [] } = await tiktokBusinessRequest<{
      conversations?: { conversation_id: string; update_time?: number }[];
    }>(`/business/message/conversation/list/?${params}`, token, {}, "TikTok-Konversationsabruf");
    conversationIds.push(...conversations.map((c) => c.conversation_id));
  }

  const threads: Thread[] = [];
  for (const conversationId of conversationIds) {
    const params = new URLSearchParams({ business_id: businessId, conversation_id: conversationId });
    const { messages = [], participants = [] } = await tiktokBusinessRequest<{
      messages?: TikTokDm[];
      participants?: Participant[];
    }>(`/business/message/content/list/?${params}`, token, {}, "TikTok-Nachrichtenabruf");

    const person = participants.find((p) => p.role === "PERSONAL_ACCOUNT");
    const isUs = (m: TikTokDm) => m.from_user?.role === "BUSINESS_ACCOUNT";
    const username = messages.find((m) => !isUs(m))?.sender ?? "";
    threads.push({
      channel: "DIRECT_MESSAGE",
      externalThreadId: conversationId,
      participantName: person?.display_name || (username ? `@${username}` : "TikTok-Nutzer"),
      participantHandle: username,
      context: "",
      messages: messages.map((m) => ({
        externalId: m.message_id,
        body:
          m.message_type === "TEXT"
            ? m.text?.body ?? ""
            : m.message_type === "TEMPLATE" && m.template?.title
              ? `[Vorlage] ${m.template.title}`
              : TIKTOK_MESSAGE_PLACEHOLDER[m.message_type ?? "OTHER"] ?? TIKTOK_MESSAGE_PLACEHOLDER.OTHER,
        createdAt: new Date(m.timestamp),
        fromUs: isUs(m),
      })),
    });
  }
  return threads;
}

// --- LinkedIn: Kommentare unter Beiträgen der Unternehmensseite --------------

async function fetchLinkedInPage(account: PlatformAccount): Promise<Thread[]> {
  const orgUrn = account.messagingExternalId;
  if (!orgUrn) throw new Error("LinkedIn-Unternehmensseite fehlt — Posteingang erneut verbinden.");
  const token = await getValidMessagingToken(account);
  const headers = linkedInRestHeaders(token);
  const base = "https://api.linkedin.com/rest";

  type LiComment = {
    id: string;
    commentUrn?: string;
    actor?: string;
    message?: { text?: string };
    created?: { time?: number };
    parentComment?: string;
    commentsSummary?: { aggregatedTotalComments?: number; totalFirstLevelComments?: number };
  };
  const toMessage = (c: LiComment): ThreadMessage => ({
    externalId: c.commentUrn ?? c.id,
    body: c.message?.text ?? "",
    createdAt: new Date(c.created?.time ?? Date.now()),
    fromUs: c.actor === orgUrn,
  });

  const { data: posts } = await requestJson<{ elements?: { id: string; commentary?: string }[] }>(
    `${base}/posts?author=${encodeURIComponent(orgUrn)}&q=author&count=10&sortBy=LAST_MODIFIED`,
    { headers },
    "LinkedIn-Beitragsabruf"
  );

  const threads: Thread[] = [];
  for (const post of posts.elements ?? []) {
    const { data: comments } = await requestJson<{ elements?: LiComment[] }>(
      `${base}/socialActions/${encodeURIComponent(post.id)}/comments?count=20`,
      { headers },
      "LinkedIn-Kommentarabruf"
    );
    for (const top of comments.elements ?? []) {
      if (top.parentComment || top.actor === orgUrn || !top.commentUrn) continue;
      let replies: LiComment[] = [];
      const replyCount = top.commentsSummary?.aggregatedTotalComments ?? top.commentsSummary?.totalFirstLevelComments ?? 0;
      if (replyCount > 0) {
        const { data } = await requestJson<{ elements?: LiComment[] }>(
          `${base}/socialActions/${encodeURIComponent(top.commentUrn)}/comments?count=20`,
          { headers },
          "LinkedIn-Antwortabruf"
        );
        replies = data.elements ?? [];
      }
      threads.push({
        channel: "COMMENT",
        externalThreadId: top.commentUrn,
        externalObjectId: post.id,
        participantName: "LinkedIn-Mitglied",
        participantHandle: top.actor ?? "",
        context: (post.commentary ?? "").slice(0, 120) || post.id,
        messages: [top, ...replies].map(toMessage),
      });
    }
  }
  return threads;
}

// --- Orchestrierung -----------------------------------------------------------

async function collectThreads(account: PlatformAccount, notes: string[], failures: string[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  const attempt = async (label: string, fn: () => Promise<Thread[]>) => {
    try {
      threads.push(...(await fn()));
    } catch (error) {
      failures.push(`${label}: ${error instanceof Error ? error.message : "unbekannter Fehler"}`);
    }
  };

  switch (account.platform) {
    case "YOUTUBE":
      if (account.status !== "CONNECTED") break;
      await attempt("Kommentare", () => fetchYouTube(account));
      break;
    case "FACEBOOK": {
      if (account.status !== "CONNECTED") break;
      const pageId = account.externalAccountId;
      if (!pageId) throw new Error("Facebook-Seiten-ID fehlt — Account erneut verbinden.");
      const token = await getValidAccessToken(account);
      await attempt("Kommentare", () => fetchFacebookComments(token, pageId));
      await attempt("Messenger", () => fetchFacebookMessages(token, pageId));
      break;
    }
    case "INSTAGRAM": {
      if (account.status !== "CONNECTED") break;
      const igId = account.externalAccountId;
      if (!igId) throw new Error("Instagram-Konto-ID fehlt — Account erneut verbinden.");
      const token = await getValidAccessToken(account);
      const ownUsername = account.accountName.replace(/^@/, "").toLowerCase();
      const isUs = (from?: { id: string; username?: string }) =>
        Boolean(from && ((from.id && from.id === igId) || (ownUsername && from.username?.toLowerCase() === ownUsername)));
      await attempt("Kommentare", () => fetchInstagramComments(token, igId, isUs));
      await attempt("Direktnachrichten", () => fetchInstagramMessages(token, isUs));
      break;
    }
    case "TIKTOK":
      if (!account.messagingAccessTokenEnc) {
        notes.push(
          "TikTok: Kommentare werden über die TikTok API for Business abgerufen — verbinde dafür unter Social Media „Posteingang verbinden“."
        );
        break;
      }
      await attempt("Kommentare", () => fetchTikTok(account));
      if (isTikTokMessagingEnabled()) {
        await attempt("Direktnachrichten", () => fetchTikTokMessages(account));
      } else {
        notes.push(
          "Direktnachrichten: TikTok Business Messaging API ist deaktiviert — nach TikToks Zugangsprüfung mit TIKTOK_BUSINESS_MESSAGING=true einschalten."
        );
      }
      break;
    case "LINKEDIN":
      if (!account.messagingAccessTokenEnc) {
        notes.push(
          "LinkedIn: Kommentare gibt es nur für Unternehmensseiten über die Community Management API — verbinde dafür unter Social Media „Posteingang verbinden“."
        );
        break;
      }
      await attempt("Kommentare", () => fetchLinkedInPage(account));
      notes.push(
        "Direktnachrichten: LinkedIn erlaubt keinen Abruf. Zugelassene Partner können Antworten senden (LINKEDIN_PARTNER_MESSAGING) — Unterhaltung dafür manuell mit Thread- oder Personen-URN anlegen."
      );
      break;
    default:
      notes.push(`${account.platform} bietet keine API zum Abrufen von Kommentaren oder Nachrichten.`);
  }
  return threads;
}

/**
 * Ruft Kommentare und Direktnachrichten aller verbundenen Plattformen ab und
 * übernimmt sie in den Posteingang. Teilfehler (z. B. fehlende Messenger-
 * Freigabe) stoppen die übrigen Abrufe nicht, sondern landen in `notes`.
 */
export async function syncInbox(workspaceId: string, platform?: Platform): Promise<PlatformSyncResult[]> {
  const accounts = await prisma.platformAccount.findMany({
    where: {
      workspaceId,
      OR: [{ status: "CONNECTED" }, { messagingAccessTokenEnc: { not: null } }],
      ...(platform ? { platform } : {}),
    },
  });

  const results: PlatformSyncResult[] = [];
  for (const account of accounts) {
    if (account.platform === "BLOG" || account.platform === "NEWSLETTER") continue;
    const notes: string[] = [];
    const failures: string[] = [];
    try {
      const threads = await collectThreads(account, notes, failures);
      const stored = await storeThreads(workspaceId, account.platform, threads);
      results.push({ platform: account.platform, ok: failures.length === 0, ...stored, notes: [...failures, ...notes] });
    } catch (error) {
      notes.push(error instanceof Error ? error.message : "Unbekannter Fehler");
      results.push({ platform: account.platform, ok: false, newConversations: 0, newMessages: 0, notes });
    }
  }
  return results;
}
