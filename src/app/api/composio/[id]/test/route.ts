import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { route, NotFoundError } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { hitRateLimit } from "@/lib/rateLimit";
import { runReadTest } from "@/lib/composio/service";
import { getComposioToolkit } from "@/lib/composio/toolkits";

/** Lesender Zugriffstest — veröffentlicht, ändert oder löscht nichts. */
async function handlePOST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSessionUser();
  const row = await prisma.composioConnection.findFirst({ where: { id, workspaceId: user.workspaceId } });
  const toolkit = row ? getComposioToolkit(row.toolkit) : undefined;
  if (!row || !toolkit) throw new NotFoundError();
  if (row.status !== "ACTIVE") return NextResponse.json({ error: "Keine aktive Verbindung." }, { status: 409 });

  if (!(await hitRateLimit(`composio-test:${user.workspaceId}`, 30, 86400))) {
    return NextResponse.json({ error: "Tagesgrenze für Lesetests erreicht." }, { status: 429 });
  }
  const result = await runReadTest({ workspaceId: user.workspaceId, connectionId: row.id, toolkit });
  await prisma.auditLog.create({
    data: {
      workspaceId: user.workspaceId,
      userId: user.userId,
      action: "composio.read_test",
      detail: `${toolkit.key}:${result.ok ? "ok" : "fehler"}`,
    },
  });
  return NextResponse.json(result);
}

export const POST = route(handlePOST);
