import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { kuerzen, pruefeZielUrl } from "@/lib/reichweite/texte";
import { kooperationsDaten, kooperationSchema } from "@/lib/reichweitenaufbau/kooperationApi";

type Ctx = { params: Promise<{ id: string }> };

async function handlePATCH(request: Request, { params }: Ctx) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  if (!(await prisma.kooperation.findFirst({ where: { id, workspaceId: user.workspaceId } }))) throw new NotFoundError();
  const parsed = kooperationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  const daten = await kooperationsDaten(user.workspaceId, parsed.data);
  if ("error" in daten) return NextResponse.json({ error: daten.error }, { status: 400 });
  if (parsed.data.name !== undefined) daten.name = kuerzen(parsed.data.name, 120);
  if (parsed.data.art !== undefined) daten.art = parsed.data.art;
  if (parsed.data.profilUrl !== undefined) {
    const url = pruefeZielUrl(parsed.data.profilUrl);
    if (!url.ok) return NextResponse.json({ error: "Profil/Webseite: " + url.fehler }, { status: 400 });
    daten.profilUrl = url.url;
  }
  const k = await prisma.kooperation.update({ where: { id }, data: daten });
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.kooperation_geaendert", id);
  return NextResponse.json({ kooperation: k });
}

async function handleDELETE(_r: Request, { params }: Ctx) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const r = await prisma.kooperation.deleteMany({ where: { id, workspaceId: user.workspaceId } });
  if (!r.count) throw new NotFoundError();
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.kooperation_geloescht", id);
  return NextResponse.json({ ok: true });
}

export const PATCH = route(handlePATCH);
export const DELETE = route(handleDELETE);
