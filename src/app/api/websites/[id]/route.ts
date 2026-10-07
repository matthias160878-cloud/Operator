import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { NotFoundError, route } from "@/lib/api";

/** Widerruft die Einbindung sofort: Der öffentliche Schlüssel funktioniert danach nicht mehr. */
async function handleDELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const revoked = await prisma.websiteConnection.updateMany({
    where: { id, workspaceId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (revoked.count !== 1) throw new NotFoundError();
  await prisma.usageCounter.updateMany({
    where: { workspaceId, metric: "WEBSITES", period: "total", used: { gte: 1 } },
    data: { used: { decrement: 1 } },
  });
  await prisma.auditLog.create({ data: { workspaceId, action: "website.revoked", detail: id } });
  return NextResponse.json({ ok: true });
}

export const DELETE = route(handleDELETE);
