import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const source = await prisma.contentItem.findFirst({ where: { id, workspaceId } });
  if (!source) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const copy = await prisma.contentItem.create({
    data: {
      workspaceId,
      campaignId: source.campaignId,
      ideaId: source.ideaId,
      title: `${source.title} (Kopie)`,
      platform: source.platform,
      format: source.format,
      status: "DRAFT",
      hook: source.hook,
      script: source.script,
      caption: source.caption,
      hashtags: source.hashtags,
      keywords: source.keywords,
      language: source.language,
      thumbnailIdea: source.thumbnailIdea,
    },
  });

  return NextResponse.json({ item: copy });
}
