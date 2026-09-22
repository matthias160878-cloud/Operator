import { NextResponse } from "next/server";
import { z } from "zod";
import { setContentStatus, scheduleContentItem, publishContentItem } from "@/lib/agents/publishingAgent";
import { runAgent } from "@/lib/agents/runner";
import { getCurrentWorkspaceId } from "@/lib/workspace";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("review") }),
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().default("") }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("schedule"), scheduledAt: z.string() }),
  z.object({ action: z.literal("publish") }),
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  const input = parsed.data;

  switch (input.action) {
    case "review":
      return NextResponse.json({ item: await setContentStatus(id, "IN_REVIEW") });
    case "approve":
      return NextResponse.json({ item: await setContentStatus(id, "APPROVED") });
    case "reject":
      return NextResponse.json({ item: await setContentStatus(id, "REJECTED", input.reason) });
    case "archive":
      return NextResponse.json({ item: await setContentStatus(id, "ARCHIVED") });
    case "schedule":
      return NextResponse.json({
        item: await scheduleContentItem(id, new Date(input.scheduledAt)),
      });
    case "publish": {
      const result = await runAgent("publishing", workspaceId, `Veröffentliche Content-Item ${id}`, () =>
        publishContentItem(id)
      );
      return NextResponse.json(result);
    }
  }
}
