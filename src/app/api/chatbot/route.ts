import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/textGenerator";
import { buildChatbotSystemPrompt } from "@/lib/chatbot/systemPrompt";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";

const MAX_MESSAGES = 20;

export async function POST(request: Request) {
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unbekannter Fehler." },
      { status: 502 }
    );
  }
}
