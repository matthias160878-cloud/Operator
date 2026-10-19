import type { ConversationChannel, Platform, PlatformAccount } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/publishing/tokens";
import { requestJson } from "@/lib/messaging/http";

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

// --- Orchestrierung -----------------------------------------------------------

async function collectThreads(account: PlatformAccount, notes: string[]): Promise<Thread[]> {
  const threads: Thread[] = [];
  const attempt = async (label: string, fn: () => Promise<Thread[]>) => {
    try {
      threads.push(...(await fn()));
    } catch (error) {
      notes.push(`${label}: ${error instanceof Error ? error.message : "unbekannter Fehler"}`);
    }
  };

  switch (account.platform) {
    case "YOUTUBE":
      await attempt("Kommentare", () => fetchYouTube(account));
      break;
    case "FACEBOOK": {
      const pageId = account.externalAccountId;
      if (!pageId) throw new Error("Facebook-Seiten-ID fehlt — Account erneut verbinden.");
      const token = await getValidAccessToken(account);
      await attempt("Kommentare", () => fetchFacebookComments(token, pageId));
      await attempt("Messenger", () => fetchFacebookMessages(token, pageId));
      break;
    }
    case "INSTAGRAM": {
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
    case "LINKEDIN":
      notes.push(
        "LinkedIn erlaubt das Abrufen von Kommentaren/Nachrichten nur freigegebenen Partner-Apps. Kommentare können mit ihrer Kommentar-URN manuell angelegt und dann echt beantwortet werden."
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
    where: { workspaceId, status: "CONNECTED", ...(platform ? { platform } : {}) },
  });

  const results: PlatformSyncResult[] = [];
  for (const account of accounts) {
    if (account.platform === "BLOG" || account.platform === "NEWSLETTER") continue;
    const notes: string[] = [];
    try {
      const threads = await collectThreads(account, notes);
      const stored = await storeThreads(workspaceId, account.platform, threads);
      results.push({ platform: account.platform, ok: notes.length === 0, ...stored, notes });
    } catch (error) {
      notes.push(error instanceof Error ? error.message : "Unbekannter Fehler");
      results.push({ platform: account.platform, ok: false, newConversations: 0, newMessages: 0, notes });
    }
  }
  return results;
}
