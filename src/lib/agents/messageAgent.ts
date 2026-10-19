import { prisma } from "@/lib/db";
import { getBrandDNA, brandContextPrompt } from "@/lib/brand";
import { generateText } from "@/lib/ai/textGenerator";
import { sendPlatformReply } from "@/lib/messaging/send";

function templateReply(): string {
  return (
    `Danke für deine Nachricht! Wir melden uns so schnell wie möglich bei dir zurück. ` +
    `(Automatischer Platzhalter-Entwurf — bitte vor dem Senden prüfen und anpassen.)`
  );
}

/**
 * MessageAgent — erzeugt einen KI-Antwortentwurf für eine Konversation
 * (nutzt Brand DNA + Verlauf), sendet aber NIE automatisch. Jeder Entwurf
 * muss über `approveAndSend` freigegeben werden, das dann über die native
 * Plattform-API sendet.
 */
export async function generateReplyDraft(input: {
  workspaceId: string;
  conversationId: string;
}) {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: input.conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  const brand = await getBrandDNA(input.workspaceId);
  const lastInbound = [...conversation.messages].reverse().find((m) => m.direction === "INBOUND");

  const history = conversation.messages
    .slice(-6)
    .map((m) => `${m.direction === "INBOUND" ? conversation.participantName : "Wir"}: ${m.body}`)
    .join("\n");

  const { text, provider } = await generateText({
    system:
      "Du bist der MessageAgent von SECRET 58. Du entwirfst freundliche, markenkonforme " +
      "Antworten auf Social-Media-Nachrichten/Kommentare. Kurz, konkret, keine falschen " +
      "Versprechen. Antworte NUR mit dem Antworttext, ohne Anführungszeichen oder Präfix.",
    prompt: [
      brandContextPrompt(brand),
      `Plattform: ${conversation.platform}`,
      `Konversationsverlauf:\n${history}`,
      lastInbound ? `Zu beantwortende Nachricht: "${lastInbound.body}"` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    maxTokens: 300,
  });

  const draftText = provider === "template" ? templateReply() : text.trim();

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "OUTBOUND",
      body: draftText,
      status: "DRAFTED",
    },
  });

  return { message, provider };
}

/**
 * Gibt einen Entwurf frei und sendet ihn über die native Plattform-API
 * (Kommentar-Antwort oder Direktnachricht, siehe `lib/messaging/send.ts`).
 * Jeder Fehler der Plattform landet ehrlich als FAILED mit Fehlertext.
 */
export async function approveAndSend(messageId: string) {
  const message = await prisma.message.findUniqueOrThrow({
    where: { id: messageId },
    include: { conversation: true },
  });

  if (message.direction !== "OUTBOUND" || (message.status !== "DRAFTED" && message.status !== "FAILED")) {
    return { sent: false, message: "Nur Entwürfe oder fehlgeschlagene Antworten können gesendet werden." };
  }

  const account = await prisma.platformAccount.findUnique({
    where: {
      workspaceId_platform: {
        workspaceId: message.conversation.workspaceId,
        platform: message.conversation.platform,
      },
    },
  });

  const fail = async (errorText: string) => {
    await prisma.message.update({
      where: { id: messageId },
      data: { status: "FAILED", error: errorText },
    });
    return { sent: false, message: errorText };
  };

  if (!account || account.status !== "CONNECTED") {
    return fail(
      `${message.conversation.platform} ist nicht verbunden. Verbinde den Account unter Social Media, bevor Nachrichten gesendet werden können.`
    );
  }

  await prisma.message.update({ where: { id: messageId }, data: { status: "APPROVED", error: null } });

  try {
    const result = await sendPlatformReply(account, message.conversation, message.body);
    const sentAt = new Date();
    await prisma.message.update({
      where: { id: messageId },
      data: { status: "SENT", sentAt, externalId: result.externalId ?? null, error: null },
    });
    await prisma.conversation.update({
      where: { id: message.conversationId },
      data: { lastMessageAt: sentAt },
    });
    return { sent: true, message: `Antwort auf ${message.conversation.platform} gesendet.`, externalId: result.externalId };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Senden fehlgeschlagen.");
  }
}
