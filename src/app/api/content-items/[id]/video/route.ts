import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { requestVideoRender } from "@/lib/agents/videoAgent";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const result = await runAgent("video", workspaceId, `Video-Render für "${item.title}"`, () =>
    requestVideoRender({ script: item.script, platform: item.platform })
  );

  return NextResponse.json(result);
}
