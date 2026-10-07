import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { generateVoiceover } from "@/lib/agents/voiceAgent";
import { route, isHttpError } from "@/lib/api";

async function handlePOST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const item = await prisma.contentItem.findFirst({ where: { id, workspaceId } });
  if (!item) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  try {
    const result = await runAgent("voice", workspaceId, `Voiceover für "${item.title}"`, () =>
      generateVoiceover({ workspaceId, contentItemId: id, text: item.script || item.hook })
    );
    return NextResponse.json(result);
  } catch (error) {
    if (isHttpError(error)) throw error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler." },
      { status: 422 }
    );
  }
}

export const POST = route(handlePOST);
