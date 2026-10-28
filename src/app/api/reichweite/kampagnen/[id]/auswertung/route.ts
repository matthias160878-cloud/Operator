import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { kampagnenAuswertung } from "@/lib/reichweite/service";

async function handleGET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const workspaceId = await getCurrentWorkspaceId();
  const { id } = await params;
  return NextResponse.json({ auswertung: await kampagnenAuswertung(workspaceId, id) });
}

export const GET = route(handleGET);
