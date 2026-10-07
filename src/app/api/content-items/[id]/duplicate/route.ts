import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ownedContentItem } from "@/lib/ownership";
import { route } from "@/lib/api";

async function handlePOST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const source = await ownedContentItem(id);

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

export const POST = route(handlePOST);
