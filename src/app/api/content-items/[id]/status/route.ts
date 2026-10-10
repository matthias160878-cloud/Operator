import { NextResponse } from "next/server";
import { z } from "zod";
import { setContentStatus, scheduleContentItem, publishContentItem } from "@/lib/agents/publishingAgent";
import { runAgent } from "@/lib/agents/runner";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { ownedContentItem } from "@/lib/ownership";
import { route } from "@/lib/api";
import {
  assertActionAllowed,
  cancelOpenJobs,
  claimPublishLock,
  queuePublishJob,
  releasePublishLock,
  WorkflowError,
} from "@/lib/contentWorkflow";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("review") }),
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().default("") }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("schedule"), scheduledAt: z.string() }),
  z.object({ action: z.literal("publish") }),
]);

async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const current = await ownedContentItem(id);
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  const input = parsed.data;
  try {
    assertActionAllowed(input.action, current.status);
  } catch (err) {
    if (err instanceof WorkflowError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  switch (input.action) {
    case "review":
      return NextResponse.json({ item: await setContentStatus(id, "IN_REVIEW") });
    case "approve":
      return NextResponse.json({ item: await setContentStatus(id, "APPROVED") });
    case "reject":
      await cancelOpenJobs(id, "Beitrag abgelehnt.");
      return NextResponse.json({ item: await setContentStatus(id, "REJECTED", input.reason) });
    case "archive":
      await cancelOpenJobs(id, "Beitrag archiviert.");
      return NextResponse.json({ item: await setContentStatus(id, "ARCHIVED") });
    case "schedule": {
      const when = new Date(input.scheduledAt);
      if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() - 60_000) {
        return NextResponse.json({ error: "Bitte einen gültigen Termin in der Zukunft wählen." }, { status: 400 });
      }
      const item = await scheduleContentItem(id, when);
      // Dauerhafter Versandauftrag; der Worker sendet zum Termin nach erneuter Prüfung.
      const job = await queuePublishJob(id, workspaceId, when);
      return NextResponse.json({ item, jobId: job.id });
    }
    case "publish": {
      // Nur ein Versand gleichzeitig; ein zweiter Klick oder Tab wird abgewiesen.
      if (!(await claimPublishLock(id))) {
        return NextResponse.json(
          { error: "Dieser Beitrag wird gerade veröffentlicht oder ist nicht mehr freigegeben." },
          { status: 409 }
        );
      }
      try {
        const publicOrigin = new URL(request.url).origin;
        const result = await runAgent("publishing", workspaceId, `Veröffentliche Content-Item ${id}`, () =>
          publishContentItem(id, publicOrigin)
        );
        return NextResponse.json(result);
      } finally {
        await releasePublishLock(id);
      }
    }
  }
}

export const POST = route(handlePOST);
