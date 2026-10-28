import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { werbeplanDaten, werbeplanSchema } from "@/lib/reichweitenaufbau/werbungApi";
import { nurWenn, werbungFreigeschaltet } from "@/lib/reichweitenaufbau/freischaltung";

type Ctx = { params: Promise<{ id: string }> };

/** Jede Änderung setzt den Plan auf ENTWURF zurück und hebt eine Freigabe auf. */
async function handlePATCH(request: Request, { params }: Ctx) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  if (!(await prisma.werbeplan.findFirst({ where: { id, workspaceId: user.workspaceId } }))) throw new NotFoundError();
  const parsed = werbeplanSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  const r = await werbeplanDaten(user.workspaceId, parsed.data, id);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const plan = await prisma.werbeplan.update({
    where: { id },
    data: { ...r.daten, status: "ENTWURF", freigabeHash: null, freigegebenAm: null, freigegebenVonId: null },
  });
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.werbeplan_geaendert", id);
  return NextResponse.json({ plan });
}

async function handleDELETE(_r: Request, { params }: Ctx) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const r = await prisma.werbeplan.deleteMany({ where: { id, workspaceId: user.workspaceId } });
  if (!r.count) throw new NotFoundError();
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.werbeplan_geloescht", id);
  return NextResponse.json({ ok: true });
}

export const PATCH = nurWenn(werbungFreigeschaltet, route(handlePATCH));
export const DELETE = nurWenn(werbungFreigeschaltet, route(handleDELETE));
