import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { encryptToken } from "@/lib/crypto";
import { approveAndSend, generateReplyDraft } from "@/lib/agents/messageAgent";
import { mockFetch, resetInbox } from "../../../tests/helpers";

describe("approveAndSend", () => {
  let workspaceId: string;
  beforeEach(async () => {
    workspaceId = await resetInbox();
  });

  async function conversationWithDraft(data: Record<string, unknown>, body = "Danke für deine Nachricht!") {
    const conversation = await prisma.conversation.create({
      data: { workspaceId, participantName: "Kunde", ...data } as never,
    });
    const draft = await prisma.message.create({
      data: { conversationId: conversation.id, direction: "OUTBOUND", body, status: "DRAFTED" },
    });
    return { conversation, draft };
  }

  it("stellt Website-Antworten ohne Plattform-Account zu", async () => {
    const calls = mockFetch(() => new Response("ok"));
    const { draft } = await conversationWithDraft({ platform: "WEBSITE", channel: "DIRECT_MESSAGE" });
    const result = await approveAndSend(draft.id);
    expect(result.sent).toBe(true);
    const sent = await prisma.message.findUniqueOrThrow({ where: { id: draft.id } });
    expect(sent.status).toBe("SENT");
    expect(sent.sentAt).not.toBeNull();
    expect(calls).toHaveLength(0); // ohne WEBSITE_WIDGET_WEBHOOK_URL kein Webhook
  });

  it("markiert das Senden ohne verbundenen Account als FAILED", async () => {
    const { draft } = await conversationWithDraft({ platform: "INSTAGRAM", externalThreadId: "c1" });
    const result = await approveAndSend(draft.id);
    expect(result).toMatchObject({ sent: false });
    const failed = await prisma.message.findUniqueOrThrow({ where: { id: draft.id } });
    expect(failed.status).toBe("FAILED");
    expect(failed.error).toMatch(/nicht verbunden/);
  });

  it("sendet nur Entwürfe oder fehlgeschlagene Antworten", async () => {
    const { conversation } = await conversationWithDraft({ platform: "WEBSITE" });
    const inbound = await prisma.message.create({
      data: { conversationId: conversation.id, direction: "INBOUND", body: "Frage" },
    });
    expect((await approveAndSend(inbound.id)).sent).toBe(false);
  });

  it("speichert nach der ersten LinkedIn-Direktnachricht die Thread-URN", async () => {
    vi.stubEnv("LINKEDIN_PARTNER_MESSAGING", "true");
    await prisma.platformAccount.create({
      data: { workspaceId, platform: "LINKEDIN", status: "CONNECTED", accessTokenEnc: encryptToken("tok") },
    });
    mockFetch(
      () => new Response(null, { status: 201, headers: { "x-linkedin-id": "{thread=urn:li:messagingThread:T9, id=7}" } })
    );
    const { conversation, draft } = await conversationWithDraft({
      platform: "LINKEDIN",
      channel: "DIRECT_MESSAGE",
      externalThreadId: "urn:li:person:abc",
    });
    expect((await approveAndSend(draft.id)).sent).toBe(true);
    const updated = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(updated.externalThreadId).toBe("urn:li:messagingThread:T9");
    expect((await prisma.message.findUniqueOrThrow({ where: { id: draft.id } })).externalId).toBe("7");
  });
});

describe("generateReplyDraft", () => {
  it("erstellt ohne KI-Schlüssel einen Vorlagen-Entwurf", async () => {
    const workspaceId = await resetInbox();
    const conversation = await prisma.conversation.create({
      data: { workspaceId, platform: "WEBSITE", participantName: "Anna" },
    });
    await prisma.message.create({ data: { conversationId: conversation.id, direction: "INBOUND", body: "Hallo?" } });
    const result = await generateReplyDraft({ workspaceId, conversationId: conversation.id });
    expect(result.provider).toBe("template");
    expect(result.message).toMatchObject({ direction: "OUTBOUND", status: "DRAFTED" });
  });
});
