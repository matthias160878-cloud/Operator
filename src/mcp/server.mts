/**
 * SECRET 58 MCP-Server — stellt die Agenten des Command Centers als
 * MCP-Tools bereit (stdio-Transport), z. B. für Claude Code oder Claude
 * Desktop. Start: `npm run mcp` (siehe README-SOCIAL-MEDIA.md → MCP-Server).
 *
 * Wichtig: stdout gehört ausschließlich dem MCP-Protokoll — Logs nur über
 * console.error.
 */
import path from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Platform } from "@prisma/client";

const loadEnvFile = (process as { loadEnvFile?: (file?: string) => void }).loadEnvFile;
try {
  loadEnvFile?.(path.join(process.cwd(), ".env"));
} catch {
  // Keine .env vorhanden — Umgebungsvariablen kommen dann aus der MCP-Client-Konfiguration.
}

const [{ prisma }, { getCurrentWorkspaceId }, { runAgent }, social, seo, inbox, messages, sync] =
  await Promise.all([
    import("@/lib/db"),
    import("@/lib/workspace"),
    import("@/lib/agents/runner"),
    import("@/lib/agents/websiteSocialAgent"),
    import("@/lib/agents/seoAgent"),
    import("@/lib/agents/inboxAgent"),
    import("@/lib/agents/messageAgent"),
    import("@/lib/messaging/sync"),
  ]);

const SOCIAL_PLATFORMS = ["YOUTUBE", "TIKTOK", "INSTAGRAM", "LINKEDIN", "FACEBOOK", "BLOG", "NEWSLETTER"] as const;
const MESSAGE_PLATFORMS = ["YOUTUBE", "TIKTOK", "INSTAGRAM", "LINKEDIN", "FACEBOOK"] as const;
// Zum Filtern im Posteingang zusätzlich das Website-Widget.
const INBOX_PLATFORMS = [...MESSAGE_PLATFORMS, "WEBSITE"] as const;

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

async function safely(fn: () => Promise<unknown>): Promise<ToolResult> {
  try {
    return ok(await fn());
  } catch (error) {
    return {
      content: [{ type: "text", text: error instanceof Error ? error.message : "Unbekannter Fehler." }],
      isError: true,
    };
  }
}

async function requireConversation(workspaceId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, workspaceId } });
  if (!conversation) throw new Error(`Konversation ${conversationId} nicht gefunden.`);
  return conversation;
}

async function requireMessage(workspaceId: string, messageId: string) {
  const message = await prisma.message.findFirst({
    where: { id: messageId, conversation: { workspaceId } },
  });
  if (!message) throw new Error(`Nachricht ${messageId} nicht gefunden.`);
  return message;
}

const server = new McpServer({ name: "secret58", version: "1.0.0" });

// --- Website → Social Media ---------------------------------------------------

server.registerTool(
  "social_posts_from_website",
  {
    title: "Social-Media-Beiträge aus Website erzeugen",
    description:
      "Liest eine Website (Titel, Meta-Daten, Überschriften, Text) und erzeugt daraus plattformgerechte " +
      "Social-Media-Beiträge im Stil der Brand DNA. Mit save=true werden sie als DRAFT-Content-Items " +
      "gespeichert (nie automatisch veröffentlicht).",
    inputSchema: {
      url: z.string().url().describe("Öffentliche URL der Website/Unterseite"),
      platforms: z
        .array(z.enum(SOCIAL_PLATFORMS))
        .min(1)
        .default(["LINKEDIN", "INSTAGRAM", "FACEBOOK"])
        .describe("Zielplattformen"),
      postsPerPlatform: z.number().int().min(1).max(3).default(1),
      instructions: z.string().max(1000).optional().describe("Zusätzliche Wünsche, z. B. Fokus oder Aktion"),
      save: z.boolean().default(false).describe("Als Entwürfe im Content-Workflow speichern"),
    },
    annotations: { openWorldHint: true },
  },
  async (args) =>
    safely(async () => {
      const workspaceId = await getCurrentWorkspaceId();
      return runAgent("website-social", workspaceId, `Social-Posts aus ${args.url}`, () =>
        social.generateSocialPostsFromWebsite({ workspaceId, ...args, platforms: args.platforms as Platform[] })
      );
    })
);

// --- SEO- & Performance-Analyse ------------------------------------------------

server.registerTool(
  "seo_analyze_website",
  {
    title: "Website-SEO & Performance analysieren",
    description:
      "SeoAgent: prüft eine URL auf SEO (Titel, Description, Überschriften, Alt-Texte, Canonical, " +
      "Indexierbarkeit, JSON-LD, robots.txt, Sitemap), Technik (HTTPS, Status, Viewport), Performance " +
      "(Antwortzeit, HTML-Größe, Kompression, render-blockierende Skripte, Caching) und Social-Vorschau " +
      "(Open Graph). Liefert Score 0–100 und priorisierte Maßnahmen. Optional mit Google PageSpeed " +
      "Insights (Lighthouse, Core Web Vitals).",
    inputSchema: {
      url: z.string().url(),
      focusKeyword: z.string().max(100).optional().describe("Keyword, für das die Seite ranken soll"),
      includePageSpeed: z.boolean().default(false).describe("Zusätzlich Lighthouse über PageSpeed Insights (dauert 20–60 s)"),
      strategy: z.enum(["mobile", "desktop"]).default("mobile"),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async (args) =>
    safely(async () => {
      const workspaceId = await getCurrentWorkspaceId();
      return runAgent("seo", workspaceId, `SEO-Analyse ${args.url}`, () => seo.analyzeWebsite(args));
    })
);

// --- Kundeninteraktion (Inbox) -------------------------------------------------

server.registerTool(
  "inbox_sync",
  {
    title: "Nachrichten von Plattformen abrufen",
    description:
      "Ruft Kommentare und Direktnachrichten der verbundenen Plattformen ab (YouTube-Kommentare, Facebook-" +
      "Kommentare + Messenger, Instagram-Kommentare + DMs) und übernimmt neue in den Posteingang.",
    inputSchema: { platform: z.enum(MESSAGE_PLATFORMS).optional() },
    annotations: { openWorldHint: true },
  },
  async ({ platform }) =>
    safely(async () => {
      const workspaceId = await getCurrentWorkspaceId();
      return runAgent("inbox", workspaceId, "Nachrichten von Plattformen abrufen", () =>
        sync.syncInbox(workspaceId, platform)
      );
    })
);

server.registerTool(
  "inbox_list_conversations",
  {
    title: "Konversationen auflisten",
    description: "Listet Kundenkonversationen aller Plattformen mit letzter Nachricht und Entwurfsstatus.",
    inputSchema: {
      status: z.enum(["OPEN", "CLOSED"]).optional(),
      platform: z.enum(INBOX_PLATFORMS).optional(),
      limit: z.number().int().min(1).max(100).default(20),
    },
    annotations: { readOnlyHint: true },
  },
  async (args) =>
    safely(async () => {
      const workspaceId = await getCurrentWorkspaceId();
      const conversations = await prisma.conversation.findMany({
        where: { workspaceId, ...(args.status ? { status: args.status } : {}), ...(args.platform ? { platform: args.platform } : {}) },
        include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { lastMessageAt: "desc" },
        take: args.limit,
      });
      return conversations.map((c) => ({
        id: c.id,
        platform: c.platform,
        channel: c.channel,
        canReply: Boolean(c.externalThreadId),
        participant: c.participantName,
        handle: c.participantHandle,
        status: c.status,
        lastMessageAt: c.lastMessageAt,
        lastMessage: c.messages[0]
          ? { id: c.messages[0].id, direction: c.messages[0].direction, status: c.messages[0].status, body: c.messages[0].body }
          : null,
      }));
    })
);

server.registerTool(
  "inbox_get_conversation",
  {
    title: "Konversation lesen",
    description: "Liefert den vollständigen Verlauf einer Konversation inkl. Entwürfen und Sendestatus.",
    inputSchema: { conversationId: z.string() },
    annotations: { readOnlyHint: true },
  },
  async ({ conversationId }) =>
    safely(async () => {
      const workspaceId = await getCurrentWorkspaceId();
      await requireConversation(workspaceId, conversationId);
      return prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    })
);

server.registerTool(
  "inbox_triage",
  {
    title: "Inbox priorisieren",
    description:
      "InboxAgent: klassifiziert alle unbeantworteten Nachrichten (Frage, Beschwerde, Kaufinteresse, Lob, " +
      "Spam) nach Stimmung und Priorität und schlägt je Nachricht eine Aktion vor. Ändert keine Daten.",
    inputSchema: {
      platform: z.enum(INBOX_PLATFORMS).optional(),
      limit: z.number().int().min(1).max(100).default(30),
    },
    annotations: { readOnlyHint: true },
  },
  async (args) =>
    safely(async () => {
      const workspaceId = await getCurrentWorkspaceId();
      return runAgent("inbox", workspaceId, "Inbox-Triage", () => inbox.triageInbox({ workspaceId, ...args }));
    })
);

server.registerTool(
  "inbox_record_message",
  {
    title: "Eingehende Nachricht erfassen",
    description:
      "Erfasst eine eingehende Kundennachricht/einen Kommentar von einer Plattform (z. B. aus Webhook, " +
      "Zapier oder manuell). Ordnet sie per Plattform-ID bzw. Handle einer bestehenden Konversation zu oder legt " +
      "eine neue an. Mit externalThreadId kann später echt auf der Plattform geantwortet werden.",
    inputSchema: {
      platform: z.enum(MESSAGE_PLATFORMS),
      participantName: z.string().min(1).max(200),
      participantHandle: z.string().max(200).optional(),
      body: z.string().min(1).max(10000),
      channel: z.enum(["COMMENT", "DIRECT_MESSAGE"]).default("COMMENT"),
      externalThreadId: z
        .string()
        .max(500)
        .optional()
        .describe("Kommentar-ID (LinkedIn: Kommentar-URN) bzw. Empfänger-ID (PSID/IGSID) — nötig für echtes Antworten"),
      externalMessageId: z.string().max(500).optional().describe("Plattform-ID der Nachricht, verhindert Duplikate"),
    },
  },
  async (args) =>
    safely(async () => {
      const workspaceId = await getCurrentWorkspaceId();
      return inbox.recordInboundMessage({ workspaceId, ...args });
    })
);

server.registerTool(
  "inbox_draft_reply",
  {
    title: "Antwortentwurf erstellen",
    description:
      "MessageAgent: erstellt einen markenkonformen Antwortentwurf für eine Konversation. Wird NICHT gesendet.",
    inputSchema: { conversationId: z.string() },
  },
  async ({ conversationId }) =>
    safely(async () => {
      const workspaceId = await getCurrentWorkspaceId();
      await requireConversation(workspaceId, conversationId);
      return runAgent("message", workspaceId, `Antwortentwurf für Konversation ${conversationId}`, () =>
        messages.generateReplyDraft({ workspaceId, conversationId })
      );
    })
);

server.registerTool(
  "inbox_draft_pending_replies",
  {
    title: "Entwürfe für alle offenen Nachrichten",
    description:
      "Erstellt Antwortentwürfe für alle Konversationen, die auf eine Antwort warten und noch keinen " +
      "aktuellen Entwurf haben (Spam wird übersprungen). Nichts wird gesendet.",
    inputSchema: {
      platform: z.enum(INBOX_PLATFORMS).optional(),
      limit: z.number().int().min(1).max(25).default(10),
    },
  },
  async (args) =>
    safely(async () => {
      const workspaceId = await getCurrentWorkspaceId();
      return runAgent("inbox", workspaceId, "Antwortentwürfe für offene Nachrichten", () =>
        inbox.draftPendingReplies({ workspaceId, ...args })
      );
    })
);

server.registerTool(
  "inbox_update_draft",
  {
    title: "Entwurf bearbeiten",
    description: "Ändert den Text eines Antwortentwurfs vor der Freigabe.",
    inputSchema: { messageId: z.string(), body: z.string().min(1).max(10000) },
  },
  async ({ messageId, body }) =>
    safely(async () => {
      const workspaceId = await getCurrentWorkspaceId();
      const message = await requireMessage(workspaceId, messageId);
      if (message.status !== "DRAFTED") throw new Error("Nur Entwürfe (Status DRAFTED) können bearbeitet werden.");
      return prisma.message.update({ where: { id: messageId }, data: { body } });
    })
);

server.registerTool(
  "inbox_send_reply",
  {
    title: "Entwurf freigeben & senden",
    description:
      "Gibt einen Antwortentwurf frei und sendet ihn über die native Plattform-API (Kommentar-Antwort bzw. " +
      "Direktnachricht). Nur nach ausdrücklicher Freigabe durch einen Menschen aufrufen. Fehler der Plattform " +
      "(nicht verbunden, fehlende Berechtigung, 24-h-Fenster abgelaufen) werden ehrlich zurückgegeben.",
    inputSchema: { messageId: z.string() },
    annotations: { destructiveHint: true, openWorldHint: true },
  },
  async ({ messageId }) =>
    safely(async () => {
      const workspaceId = await getCurrentWorkspaceId();
      const message = await requireMessage(workspaceId, messageId);
      if (message.direction !== "OUTBOUND" || (message.status !== "DRAFTED" && message.status !== "FAILED")) {
        throw new Error("Nur ausgehende Entwürfe oder fehlgeschlagene Antworten können gesendet werden.");
      }
      return runAgent("message", workspaceId, `Sende Nachricht ${messageId}`, () => messages.approveAndSend(messageId));
    })
);

await server.connect(new StdioServerTransport());
console.error("SECRET 58 MCP-Server läuft (stdio).");
