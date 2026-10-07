import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { generateVoiceover } from "@/lib/agents/voiceAgent";
import { checkQuota } from "@/lib/quota";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const item = await prisma.contentItem.findFirst({ where: { id, workspaceId } });
  if (!item) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const quota = await checkQuota(workspaceId, "voice");
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: `Monatliches Sprachausgabe-Kontingent erreicht (${quota.used}/${quota.limit}). Enthalten im gebuchten Paket — ein Upgrade ist bei der Zentrale (secret58.com) möglich.`,
        code: "QUOTA_EXCEEDED",
      },
      { status: 429 },
    );
  }

  try {
    const result = await runAgent("voice", workspaceId, `Voiceover für "${item.title}"`, () =>
      generateVoiceover({ workspaceId, contentItemId: id, text: item.script || item.hook })
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler." },
      { status: 422 }
    );
  }
}
