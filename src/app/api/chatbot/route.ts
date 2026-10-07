import { NextResponse } from "next/server";
import { currentTextProvider, generateText } from "@/lib/ai/textGenerator";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { reserveQuota } from "@/lib/entitlements";
import { buildChatbotSystemPrompt } from "@/lib/chatbot/systemPrompt";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { route, isHttpError } from "@/lib/api";

const MAX_MESSAGES = 20;

async function handlePOST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawMessages = body?.messages;
  const localeRaw = body?.locale;
  const locale = typeof localeRaw === "string" && isLocale(localeRaw) ? localeRaw : DEFAULT_LOCALE;

  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return NextResponse.json({ error: "Keine Nachrichten übergeben." }, { status: 400 });
  }

  const messages = rawMessages
    .slice(-MAX_MESSAGES)
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    );

  if (messages.length === 0) {
    return NextResponse.json({ error: "Keine gültigen Nachrichten übergeben." }, { status: 400 });
  }

  // Der Hilfe-Chat läuft über die Betreiber-Zugänge und zählt gegen das Paket-Kontingent.
  const workspaceId = await getCurrentWorkspaceId();
  const release = await reserveQuota(workspaceId, "AI_TEXT", currentTextProvider() === "template" ? 0 : 1);

  try {
    const { text, provider } = await generateText({
      system: buildChatbotSystemPrompt(locale),
      messages,
      maxTokens: 600,
    });

    if (provider === "template") {
      return NextResponse.json({ notConfigured: true });
    }

    return NextResponse.json({ reply: text, provider });
  } catch (err) {
    await release();
    if (isHttpError(err)) throw err;
    return NextResponse.json(
      { error: "Der KI-Anbieter ist gerade nicht erreichbar. Es wurde kein Kontingent verbraucht." },
      { status: 502 }
    );
  }
}

export const POST = route(handlePOST);
