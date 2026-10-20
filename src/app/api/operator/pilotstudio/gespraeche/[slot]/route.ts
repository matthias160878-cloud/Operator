import { NextResponse } from "next/server";
import { withOperator, readJson } from "@/lib/pilotstudio/http";
import { saveInterview } from "@/lib/pilotstudio/demand";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ slot: string }> }) {
  return withOperator(async (u, actor) => {
    const { slot } = await params;
    await saveInterview(u.workspaceId, actor, Number(slot), await readJson(req, 100_000));
    return NextResponse.json({ ok: true });
  });
}
