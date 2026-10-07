import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { requestVideoRender } from "@/lib/agents/videoAgent";
import { checkQuota } from "@/lib/quota";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const item = await prisma.contentItem.findFirst({ where: { id, workspaceId } });
  if (!item) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const quota = await checkQuota(workspaceId, "video");
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: `Monatliches Video-Kontingent erreicht (${quota.used}/${quota.limit}). Enthalten im gebuchten Paket — ein Upgrade ist bei der Zentrale (secret58.com) möglich.`,
        code: "QUOTA_EXCEEDED",
      },
      { status: 429 },
    );
  }

  const result = await runAgent("video", workspaceId, `Video-Render für "${item.title}"`, () =>
    requestVideoRender({ script: item.script, platform: item.platform })
  );

  return NextResponse.json(result);
}
