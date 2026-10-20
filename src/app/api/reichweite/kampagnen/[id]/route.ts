import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { kuerzen, pruefeZielUrl } from "@/lib/reichweite/texte";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { eigeneKampagne, protokoll } from "@/lib/reichweite/service";

const schema = z.object({
  titel: z.string().min(1).max(160).optional(),
  text: z.string().max(1000).optional(),
  zielUrl: z.string().max(500).optional(),
  aktiv: z.boolean().optional(),
  campaignId: z.string().nullable().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

async function handlePATCH(request: Request, { params }: Ctx) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  await eigeneKampagne(user.workspaceId, id);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  const d = parsed.data;
  const data: Record<string, unknown> = {};
  if (d.titel !== undefined) data.titel = kuerzen(d.titel, 160);
  if (d.text !== undefined) data.text = kuerzen(d.text, 1000);
  if (d.aktiv !== undefined) data.aktiv = d.aktiv;
  if (d.zielUrl !== undefined) {
    const ziel = pruefeZielUrl(d.zielUrl);
    if (!ziel.ok) return NextResponse.json({ error: ziel.fehler }, { status: 400 });
    data.zielUrl = ziel.url;
  }
  if (d.campaignId !== undefined) {
    if (d.campaignId && !(await prisma.campaign.findFirst({ where: { id: d.campaignId, workspaceId: user.workspaceId } }))) {
      return NextResponse.json({ error: "Kampagne nicht gefunden." }, { status: 404 });
    }
    data.campaignId = d.campaignId;
  }
  const kampagne = await prisma.reichweitenKampagne.update({ where: { id }, data });
  await protokoll(user.workspaceId, user.userId, "reichweite.kampagne_geaendert", id);
  return NextResponse.json({ kampagne });
}

async function handleDELETE(_request: Request, { params }: Ctx) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  await eigeneKampagne(user.workspaceId, id);
  // Löscht Links, Ereignisse und Kennzahlen der Kampagne mit (Cascade).
  await prisma.reichweitenKampagne.delete({ where: { id } });
  await protokoll(user.workspaceId, user.userId, "reichweite.kampagne_geloescht", id);
  return NextResponse.json({ ok: true });
}

export const PATCH = route(handlePATCH);
export const DELETE = route(handleDELETE);
