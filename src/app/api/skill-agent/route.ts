import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai/textGenerator";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { websiteAiBudgetAvailable, websiteAiEnabled } from "@/lib/websiteAi";
import { SKILL_AGENT_PROMPT } from "@/lib/zentrale/prompts";

/** Skill-Anfrage der Startseite: ordnet eine Beschreibung den Leistungen zu (nur mit WEBSITE_KI=true). */
export async function POST(request: Request) {
  if (!(await hitRateLimit(`skillagent:${clientIp(request)}`, 10, 600))) {
    return NextResponse.json({ meldung: "Zu viele Anfragen. Bitte in ein paar Minuten erneut versuchen." }, { status: 429 });
  }
  if (!websiteAiEnabled()) {
    return NextResponse.json(
      { meldung: "Die KI-Einschätzung ist auf dieser Seite noch nicht aktiviert. Schreiben Sie uns gern über das Kontaktformular." },
      { status: 503 }
    );
  }
  const roh = await request.json().catch(() => null);
  const beschreibung = typeof roh?.beschreibung === "string" ? roh.beschreibung.trim().slice(0, 1500) : "";
  if (!beschreibung) {
    return NextResponse.json({ meldung: "Bitte kurz beschreiben, was bei Ihnen manuell läuft oder Zeit kostet." }, { status: 400 });
  }
  if (!(await websiteAiBudgetAvailable())) {
    return NextResponse.json({ meldung: "Gerade ausgelastet, bitte später erneut versuchen." }, { status: 429 });
  }
  try {
    const { text } = await generateText({ system: SKILL_AGENT_PROMPT, prompt: beschreibung, maxTokens: 600 });
    return NextResponse.json({ ergebnis: text.trim() || "Dazu kann ich gerade keine Einschätzung geben." });
  } catch (err) {
    console.error("[skill-agent]", err instanceof Error ? err.message : err);
    return NextResponse.json({ meldung: "Skill-Agent gerade nicht erreichbar." }, { status: 502 });
  }
}
