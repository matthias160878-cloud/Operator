import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";

/** Widerruft einen Link: die öffentliche Seite zeigt danach nur noch „nicht mehr aktiv“. */
async function handleDELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const link = await prisma.empfehlungsLink.findFirst({ where: { id, workspaceId: user.workspaceId } });
  if (!link) throw new NotFoundError();
  await prisma.empfehlungsLink.update({ where: { id }, data: { widerrufenAm: link.widerrufenAm ?? new Date() } });
  await protokoll(user.workspaceId, user.userId, "reichweite.link_widerrufen", id);
  return NextResponse.json({ ok: true });
}

export const DELETE = route(handleDELETE);
