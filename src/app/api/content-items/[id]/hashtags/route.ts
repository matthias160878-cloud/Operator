import { NextResponse } from "next/server";
import { revokeApprovalOnChange } from "@/lib/contentWorkflow";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getBrandDNA } from "@/lib/brand";
import { runAgent } from "@/lib/agents/runner";
import { generateHashtags } from "@/lib/agents/hashtagAgent";
import { route } from "@/lib/api";

async function handlePOST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const item = await prisma.contentItem.findFirst({ where: { id, workspaceId } });
  if (!item) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const brand = await getBrandDNA(workspaceId);
  const { result } = await runAgent("hashtag", workspaceId, `Hashtags für "${item.title}"`, () =>
    generateHashtags({ topic: item.title, platform: item.platform, brand })
  );

  const updated = await prisma.contentItem.update({
    where: { id },
    data: {
      hashtags: JSON.stringify(result.hashtags),
      keywords: JSON.stringify(result.keywords),
    },
  });

  const approvalRevoked = await revokeApprovalOnChange(id);
  return NextResponse.json({ item: updated, approvalRevoked });
}

export const POST = route(handlePOST);
