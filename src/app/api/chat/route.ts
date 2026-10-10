import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateText, type ChatMessage } from "@/lib/ai/textGenerator";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { websiteAiBudgetAvailable, websiteAiEnabled } from "@/lib/websiteAi";
import { SYSTEMPROMPT } from "@/lib/zentrale/prompts";
// Unverändert aus der Zentrale übernommen (src/lib/zentrale/README.md).
import { pruefe as gatePruefe, zustaendig } from "@/lib/zentrale/agenten/gate.js";

/**
 * Chat der Startseite (Zentrale). Regeln vor jedem Modellaufruf:
 * gesperrte Themen (Banking, Behörden, Zahlungen) und „bitte ein Mensch“
 * werden ohne KI beantwortet; Terminwünsche verweisen auf die Terminbuchung.
 * Die KI antwortet nur mit WEBSITE_KI=true (Kosten) und im Tageslimit —
 * sonst 503, und die Seite antwortet aus ihrer hinterlegten Liste.
 */
function verlaufPruefen(roh: unknown): ChatMessage[] | null {
  if (!Array.isArray(roh)) return null;
  const erlaubt = roh
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role as ChatMessage["role"], content: String(m.content).slice(0, 2000) }))
    .slice(-12);
  while (erlaubt.length && erlaubt[0].role !== "user") erlaubt.shift();
  return erlaubt.length ? erlaubt : null;
}

export async function POST(request: Request) {
  if (!(await hitRateLimit(`webchat:${clientIp(request)}`, 20, 600))) {
    return NextResponse.json({ error: "zu_viele_anfragen" }, { status: 429 });
  }
  const roh = await request.json().catch(() => null);
  const verlauf = verlaufPruefen(roh?.messages);
  if (!verlauf) return NextResponse.json({ error: "ungueltige_anfrage" }, { status: 400 });
  const nachricht = [...verlauf].reverse().find((m) => m.role === "user")?.content ?? "";

  const wer = zustaendig(nachricht);
  if (wer === "gesperrt") {
    return NextResponse.json({ reply: gatePruefe({ stufe: 0, nachricht }).grund, entscheidung: "abgelehnt", stufe: 0 });
  }
  if (wer === "mensch") {
    return NextResponse.json({
      reply:
        "Das gebe ich an einen Menschen weiter — dazu sollte Ihnen niemand automatisch antworten. Schreiben Sie uns " +
        "über das Kontaktformular oder an info@secret58.com; Sie hören in der Regel am selben Werktag von uns.",
      entscheidung: "eskaliert",
      stufe: 0,
    });
  }
  if (wer === "terminplaner") {
    return NextResponse.json({
      reply:
        "Einen Termin für ein Erstgespräch wählen Sie direkt hier auf der Seite unter „Termin anfragen“ im " +
        "Kontaktbereich. Wir bestätigen ihn in der Regel am selben Werktag.",
      entscheidung: "verwiesen",
      stufe: 0,
    });
  }
  if (!websiteAiEnabled()) return NextResponse.json({ error: "kein_schluessel" }, { status: 503 });
  if (!(await websiteAiBudgetAvailable())) return NextResponse.json({ error: "ausgelastet" }, { status: 429 });

  try {
    const { text } = await generateText({ system: SYSTEMPROMPT, messages: verlauf, maxTokens: 1024 });
    const reply = text.trim() || "Dazu habe ich gerade keine Antwort.";
    await prisma.websiteChatEntry
      .create({ data: { frage: nachricht.slice(0, 2000), antwort: reply.slice(0, 2000) } })
      .catch(() => undefined);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[webchat]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "agent_nicht_erreichbar" }, { status: 502 });
  }
}
