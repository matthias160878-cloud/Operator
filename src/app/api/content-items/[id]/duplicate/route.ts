import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const source = await prisma.contentItem.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const copy = await prisma.contentItem.create({
    data: {
      workspaceId: source.workspaceId,
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
