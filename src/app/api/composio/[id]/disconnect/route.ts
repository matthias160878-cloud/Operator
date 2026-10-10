import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { route, NotFoundError } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { ComposioError } from "@/lib/composio/client";
import { disconnect } from "@/lib/composio/service";

/** Trennt die Verbindung bei Composio und entfernt die Zuordnung zum Arbeitsbereich. */
async function handlePOST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSessionUser();
  try {
    const done = await disconnect({ workspaceId: user.workspaceId, connectionId: id });
    if (!done) throw new NotFoundError();
  } catch (err) {
    if (err instanceof ComposioError) {
      return NextResponse.json({ error: `Trennen bei Composio fehlgeschlagen: ${err.message}` }, { status: 502 });
    }
    throw err;
  }
  await prisma.auditLog.create({
    data: { workspaceId: user.workspaceId, userId: user.userId, action: "composio.disconnected", detail: id },
  });
  return NextResponse.json({ ok: true });
}

export const POST = route(handlePOST);
