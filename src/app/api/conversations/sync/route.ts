import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { syncInbox } from "@/lib/messaging/sync";

const bodySchema = z.object({
  platform: z.enum(["YOUTUBE", "TIKTOK", "INSTAGRAM", "LINKEDIN", "FACEBOOK"]).optional(),
});

/** Ruft Kommentare und Direktnachrichten aller verbundenen Plattformen ab. */
export async function POST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  try {
    const results = await runAgent("inbox", workspaceId, "Nachrichten von Plattformen abrufen", () =>
      syncInbox(workspaceId, parsed.data.platform)
    );
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler." },
      { status: 500 }
    );
  }
}
