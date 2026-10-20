import { describe, expect, it, vi } from "vitest";
import type { Conversation, PlatformAccount } from "@prisma/client";
import { encryptToken } from "@/lib/crypto";
import { parseLinkedInCommentUrn, parseLinkedInMessageId, sendPlatformReply } from "@/lib/messaging/send";
import { jsonResponse, mockFetch } from "../../../tests/helpers";

function account(patch: Partial<PlatformAccount> = {}): PlatformAccount {
  return {
    id: "acc",
    workspaceId: "ws",
    platform: "YOUTUBE",
    status: "CONNECTED",
    accessTokenEnc: encryptToken("member-token"),
    refreshTokenEnc: null,
    tokenExpiresAt: null,
    externalAccountId: null,
    messagingAccessTokenEnc: null,
    messagingRefreshTokenEnc: null,
    messagingTokenExpiresAt: null,
    messagingExternalId: null,
    ...patch,
  } as PlatformAccount;
}

function conversation(patch: Partial<Conversation>): Conversation {
  return {
    id: "conv",
    workspaceId: "ws",
    platform: "YOUTUBE",
    channel: "COMMENT",
    participantName: "Test",
    participantHandle: "",
    externalThreadId: null,
    externalObjectId: null,
    externalContext: "",
    visitorTokenHash: null,
    status: "OPEN",
    lastMessageAt: new Date(),
    createdAt: new Date(),
    ...patch,
  } as Conversation;
}

describe("LinkedIn-URNs", () => {
  it("zerlegt Kommentar-URNs", () => {
    expect(parseLinkedInCommentUrn("urn:li:comment:(urn:li:activity:123,456)")).toEqual({
      objectUrn: "urn:li:activity:123",
      commentUrn: "urn:li:comment:(urn:li:activity:123,456)",
    });
    expect(parseLinkedInCommentUrn("456")).toBeNull();
  });

  it("liest x-linkedin-id roh und URL-kodiert", () => {
    expect(parseLinkedInMessageId("{thread=urn:li:messagingThread:123ABC, id=123456789}")).toEqual({
      thread: "urn:li:messagingThread:123ABC",
      id: "123456789",
    });
    expect(
      parseLinkedInMessageId("%7Bid%3D1-MTU%3D%3D%2C+thread%3Durn%3Ali%3AmessagingThread%3A2-ABC%3D%3D%7D")
    ).toEqual({ thread: "urn:li:messagingThread:2-ABC==", id: "1-MTU==" });
    expect(parseLinkedInMessageId(null)).toEqual({});
  });
});

describe("sendPlatformReply", () => {
  it("verweigert Konversationen ohne Plattform-ID ohne API-Aufruf", async () => {
    const calls = mockFetch(() => jsonResponse({}));
    await expect(sendPlatformReply(account(), conversation({}), "Hi")).rejects.toThrow(/keine Plattform-ID/);
    expect(calls).toHaveLength(0);
  });

  it("prüft die Längengrenze der Plattform", async () => {
    const calls = mockFetch(() => jsonResponse({}));
    const conv = conversation({ platform: "INSTAGRAM", channel: "DIRECT_MESSAGE", externalThreadId: "igsid" });
    await expect(sendPlatformReply(account({ platform: "INSTAGRAM" }), conv, "x".repeat(1001))).rejects.toThrow(
      /zu lang/
    );
    expect(calls).toHaveLength(0);
  });

  it("antwortet auf YouTube-Kommentare über die Data API", async () => {
    const calls = mockFetch(() => jsonResponse({ id: "reply-1" }));
    const result = await sendPlatformReply(
      account(),
      conversation({ externalThreadId: "comment-1" }),
      "Danke!"
    );
    expect(result.externalId).toBe("reply-1");
    expect(calls[0].url).toBe("https://www.googleapis.com/youtube/v3/comments?part=snippet");
    expect(calls[0].headers.authorization).toBe("Bearer member-token");
    expect(JSON.parse(calls[0].body)).toEqual({ snippet: { parentId: "comment-1", textOriginal: "Danke!" } });
  });

  it("gibt Fehler der Plattform mit Meldung weiter", async () => {
    mockFetch(() => jsonResponse({ error: { message: "insufficientPermissions" } }, { status: 403 }));
    await expect(
      sendPlatformReply(account(), conversation({ externalThreadId: "comment-1" }), "Danke!")
    ).rejects.toThrow(/403.*insufficientPermissions/);
  });

  describe("LinkedIn-Direktnachrichten (Partner)", () => {
    const linkedIn = account({ platform: "LINKEDIN" });
    const dm = (target: string) =>
      conversation({ platform: "LINKEDIN", channel: "DIRECT_MESSAGE", externalThreadId: target });

    it("ist ohne LINKEDIN_PARTNER_MESSAGING gesperrt", async () => {
      const calls = mockFetch(() => new Response(null, { status: 201 }));
      await expect(sendPlatformReply(linkedIn, dm("urn:li:person:abc"), "Hallo")).rejects.toThrow(/Partner/);
      expect(calls).toHaveLength(0);
    });

    it("startet eine Unterhaltung mit einer Person und liefert die Thread-URN", async () => {
      vi.stubEnv("LINKEDIN_PARTNER_MESSAGING", "true");
      const calls = mockFetch(
        () =>
          new Response(null, {
            status: 201,
            headers: { "x-linkedin-id": "{thread=urn:li:messagingThread:T1, id=42}" },
          })
      );
      const result = await sendPlatformReply(linkedIn, dm("urn:li:person:abc"), "Hallo");
      expect(calls[0].url).toBe("https://api.linkedin.com/v2/messages");
      expect(JSON.parse(calls[0].body)).toEqual({
        body: "Hallo",
        messageType: "MEMBER_TO_MEMBER",
        recipients: ["urn:li:person:abc"],
      });
      expect(result).toEqual({ externalId: "42", externalThreadId: "urn:li:messagingThread:T1" });
    });

    it("antwortet in einen bestehenden Thread", async () => {
      vi.stubEnv("LINKEDIN_PARTNER_MESSAGING", "true");
      const calls = mockFetch(
        () => new Response(null, { status: 201, headers: { "x-linkedin-id": "{thread=urn:li:messagingThread:T1, id=43}" } })
      );
      const result = await sendPlatformReply(linkedIn, dm("urn:li:messagingThread:T1"), "Bis bald");
      expect(JSON.parse(calls[0].body).thread).toBe("urn:li:messagingThread:T1");
      expect(result.externalThreadId).toBeUndefined();
    });

    it("lehnt HTML und ungültige IDs ab", async () => {
      vi.stubEnv("LINKEDIN_PARTNER_MESSAGING", "true");
      const calls = mockFetch(() => new Response(null, { status: 201 }));
      await expect(sendPlatformReply(linkedIn, dm("urn:li:person:abc"), "<b>Hi</b>")).rejects.toThrow(/HTML/);
      await expect(sendPlatformReply(linkedIn, dm("max-muster"), "Hi")).rejects.toThrow(/Ungültige/);
      expect(calls).toHaveLength(0);
    });
  });

  it("meldet Plattformen ohne Antwort-API klar", async () => {
    await expect(
      sendPlatformReply(
        account({ platform: "YOUTUBE" }),
        conversation({ channel: "DIRECT_MESSAGE", externalThreadId: "x" }),
        "Hi"
      )
    ).rejects.toThrow(/keine Direktnachrichten/);
  });
});
