import { NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { generateReplyDraft } from "@/lib/agents/messageAgent";
import { ownedConversation } from "@/lib/ownership";
import { route, isHttpError } from "@/lib/api";

async function handlePOST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  await ownedConversation(id);

  try {
    const result = await runAgent("message", workspaceId, `Antwortentwurf für Konversation ${id}`, () =>
      generateReplyDraft({ workspaceId, conversationId: id }),
      "AI_TEXT"
    );
    return NextResponse.json(result);
  } catch (error) {
    if (isHttpError(error)) throw error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler." },
      { status: 500 }
    );
  }
}

export const POST = route(handlePOST);
