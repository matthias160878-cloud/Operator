import { NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { approveAndSend } from "@/lib/agents/messageAgent";
import { ownedMessage } from "@/lib/ownership";
import { route } from "@/lib/api";

async function handlePOST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  await ownedMessage(id);

  const result = await runAgent("message", workspaceId, `Sende Nachricht ${id}`, () => approveAndSend(id));
  return NextResponse.json(result);
}

export const POST = route(handlePOST);
