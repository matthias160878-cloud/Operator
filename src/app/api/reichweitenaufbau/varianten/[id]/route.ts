import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { variantenAuswertung } from "@/lib/reichweitenaufbau/service";

type Ctx = { params: Promise<{ id: string }> };

async function handleGET(_r: Request, { params }: Ctx) {
  const { id } = await params;
  const { ergebnis } = await variantenAuswertung(await getCurrentWorkspaceId(), id);
  return NextResponse.json({ ergebnis });
}

async function handleDELETE(_r: Request, { params }: Ctx) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const r = await prisma.variantenTest.deleteMany({ where: { id, workspaceId: user.workspaceId } });
  if (!r.count) throw new NotFoundError();
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.variantentest_geloescht", id);
  return NextResponse.json({ ok: true });
}

export const GET = route(handleGET);
export const DELETE = route(handleDELETE);
