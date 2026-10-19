import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { nurWenn, newsletterFreigeschaltet } from "@/lib/reichweitenaufbau/freischaltung";

type Ctx = { params: Promise<{ id: string }> };

async function handlePATCH(request: Request, { params }: Ctx) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const parsed = z.object({ aktiv: z.boolean() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  const r = await prisma.newsletterSeite.updateMany({ where: { id, workspaceId: user.workspaceId }, data: { aktiv: parsed.data.aktiv } });
  if (!r.count) throw new NotFoundError();
  return NextResponse.json({ ok: true });
}

async function handleDELETE(_r: Request, { params }: Ctx) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const r = await prisma.newsletterSeite.deleteMany({ where: { id, workspaceId: user.workspaceId } });
  if (!r.count) throw new NotFoundError();
  return NextResponse.json({ ok: true });
}

export const PATCH = nurWenn(newsletterFreigeschaltet, route(handlePATCH));
export const DELETE = nurWenn(newsletterFreigeschaltet, route(handleDELETE));
