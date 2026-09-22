import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { generateVoiceover } from "@/lib/agents/voiceAgent";

const bodySchema = z.object({
  text: z.string().min(1).max(500),
  voiceId: z.string().min(1),
});

export async function POST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  try {
    const result = await runAgent("voice", workspaceId, "Voice-Preview", () =>
      generateVoiceover({ workspaceId, text: parsed.data.text, voiceId: parsed.data.voiceId })
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler." },
      { status: 422 }
    );
  }
}
