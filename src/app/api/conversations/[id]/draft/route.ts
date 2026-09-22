import { NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { generateReplyDraft } from "@/lib/agents/messageAgent";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();

  try {
    const result = await runAgent("message", workspaceId, `Antwortentwurf für Konversation ${id}`, () =>
      generateReplyDraft({ workspaceId, conversationId: id })
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler." },
      { status: 500 }
    );
  }
}
