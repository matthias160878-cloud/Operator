import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { pruefeZielUrl } from "@/lib/reichweite/texte";

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

/** Angebotsseite eines Links ändern (leer = Zielseite der Kampagne). */
async function handlePATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const link = await prisma.empfehlungsLink.findFirst({ where: { id, workspaceId: user.workspaceId } });
  if (!link) throw new NotFoundError();
  const body = (await request.json().catch(() => ({}))) as { angebotUrl?: unknown };
  const angebot = pruefeZielUrl(body.angebotUrl ?? "");
  if (!angebot.ok) return NextResponse.json({ error: `Angebotsseite: ${angebot.fehler}` }, { status: 400 });
  const neu = await prisma.empfehlungsLink.update({ where: { id }, data: { angebotUrl: angebot.url } });
  await protokoll(user.workspaceId, user.userId, "reichweite.link_angebot", id);
  return NextResponse.json({ link: neu });
}

export const DELETE = route(handleDELETE);
export const PATCH = route(handlePATCH);
