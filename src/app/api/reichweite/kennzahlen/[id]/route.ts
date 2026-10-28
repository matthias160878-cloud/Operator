import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";

async function handleDELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const r = await prisma.reichweitenKennzahl.deleteMany({ where: { id, workspaceId: user.workspaceId } });
  if (r.count === 0) throw new NotFoundError();
  await protokoll(user.workspaceId, user.userId, "reichweite.kennzahl_geloescht", id);
  return NextResponse.json({ ok: true });
}

export const DELETE = route(handleDELETE);
