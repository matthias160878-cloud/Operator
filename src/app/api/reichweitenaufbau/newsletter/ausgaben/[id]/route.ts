import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { ausgabeDaten, ausgabeSchema } from "@/lib/reichweitenaufbau/newsletterApi";

type Ctx = { params: Promise<{ id: string }> };

/** Textänderung setzt die Ausgabe auf ENTWURF zurück – die Freigabe gilt nur für den freigegebenen Text. */
async function handlePATCH(request: Request, { params }: Ctx) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const a = await prisma.newsletterAusgabe.findFirst({ where: { id, workspaceId: user.workspaceId } });
  if (!a) throw new NotFoundError();
  if (a.status === "VERSENDET" || a.status === "VERSENDET_DEMO") return NextResponse.json({ error: "Versendete Ausgaben können nicht mehr geändert werden." }, { status: 409 });
  const parsed = ausgabeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Betreff und Text angeben." }, { status: 400 });
  const r = await ausgabeDaten(user.workspaceId, parsed.data);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 404 });
  const neu = await prisma.newsletterAusgabe.update({
    where: { id },
    data: { ...r.daten, status: "ENTWURF", freigabeHash: null, freigegebenAm: null, freigegebenVonId: null, geplantAm: null },
  });
  return NextResponse.json({ ausgabe: neu });
}

async function handleDELETE(_r: Request, { params }: Ctx) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const r = await prisma.newsletterAusgabe.deleteMany({ where: { id, workspaceId: user.workspaceId } });
  if (!r.count) throw new NotFoundError();
  return NextResponse.json({ ok: true });
}

export const PATCH = route(handlePATCH);
export const DELETE = route(handleDELETE);
