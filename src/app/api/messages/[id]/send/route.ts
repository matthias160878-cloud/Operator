import { NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { approveAndSend } from "@/lib/agents/messageAgent";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();

  const result = await runAgent("message", workspaceId, `Sende Nachricht ${id}`, () => approveAndSend(id));
  return NextResponse.json(result);
}
