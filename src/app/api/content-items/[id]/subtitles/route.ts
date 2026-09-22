import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { generateSubtitles } from "@/lib/agents/subtitleAgent";
import { saveMediaFile } from "@/lib/mediaStorage";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  if (!item.script.trim()) {
    return NextResponse.json({ error: "Dieses Content-Item hat noch kein Script." }, { status: 422 });
  }

  const { srt } = await runAgent("subtitle", workspaceId, `Untertitel für "${item.title}"`, async () =>
    generateSubtitles(item.script)
  );

  const filename = `subtitles-${id}-${Date.now()}.srt`;
  const url = await saveMediaFile("subtitles", filename, srt);

  const asset = await prisma.mediaAsset.create({
    data: {
      workspaceId,
      contentItemId: id,
      type: "SUBTITLE",
      url,
      provider: "local",
      format: "srt",
    },
  });

  return NextResponse.json({ asset, srt });
}
