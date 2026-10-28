import { NextResponse } from "next/server";
import { withKunde } from "@/lib/dateien/http";
import { freigabeWiderrufen } from "@/lib/dateien/service";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withKunde(async (u) => {
    const { id } = await params;
    await freigabeWiderrufen(u.workspaceId, u.userId, id);
    return NextResponse.json({ ok: true });
  });
}
