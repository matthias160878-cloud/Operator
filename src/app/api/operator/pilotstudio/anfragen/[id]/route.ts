import { NextResponse } from "next/server";
import { z } from "zod";
import { withOperator, readJson } from "@/lib/pilotstudio/http";
import { approve, closeInquiry, createDraft, deleteInquiry, editDraft, handover, PilotError, runAutoCheck, saveEvaluation, send } from "@/lib/pilotstudio/service";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["entwurf-demo", "entwurf-ki", "bearbeiten", "freigeben", "uebergeben", "versenden", "auswertung", "autopruefung", "abschliessen"]),
}).passthrough();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withOperator(async (u, actor) => {
    const { id } = await params;
    const body = await readJson(req, 100_000);
    const p = schema.safeParse(body);
    if (!p.success) throw new PilotError(400, "Unbekannte Aktion.");
    const b = body as Record<string, unknown>;
    const ws = u.workspaceId;
    let inquiry;
    switch (p.data.action) {
      case "entwurf-demo": inquiry = await createDraft(ws, actor, id, "demo"); break;
      case "entwurf-ki": inquiry = await createDraft(ws, actor, id, "ki"); break;
      case "bearbeiten": inquiry = await editDraft(ws, actor, id, b.text, b.kind); break;
      case "freigeben": inquiry = await approve(ws, actor, id, b); break;
      case "uebergeben": inquiry = await handover(ws, actor, id, b); break;
      case "versenden": inquiry = await send(ws, actor, id); break;
      case "auswertung": inquiry = await saveEvaluation(ws, actor, id, b.data); break;
      case "autopruefung": inquiry = await runAutoCheck(ws, actor, id); break;
      case "abschliessen": inquiry = await closeInquiry(ws, actor, id); break;
    }
    return NextResponse.json({ inquiry });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withOperator(async (u, actor) => {
    const { id } = await params;
    await deleteInquiry(u.workspaceId, actor, id);
    return NextResponse.json({ ok: true });
  });
}
