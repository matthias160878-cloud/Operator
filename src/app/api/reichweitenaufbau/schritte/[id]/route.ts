import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { schrittSchema } from "@/lib/reichweitenaufbau/kampagnenApi";

async function eigenerSchritt(workspaceId: string, id: string) {
  const s = await prisma.kampagnenSchritt.findFirst({ where: { id, workspaceId } });
  if (!s) throw new NotFoundError();
  return s;
}

/** Schritt bearbeiten, abhaken oder verschieben. */
async function handlePATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const s = await eigenerSchritt(user.workspaceId, id);
  const parsed = schrittSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  const d = parsed.data;
  if (d.verschieben) {
    const nachbar = await prisma.kampagnenSchritt.findFirst({
      where: { kampagneId: s.kampagneId, reihenfolge: d.verschieben === "hoch" ? { lt: s.reihenfolge } : { gt: s.reihenfolge } },
      orderBy: { reihenfolge: d.verschieben === "hoch" ? "desc" : "asc" },
    });
    if (nachbar) {
      await prisma.$transaction([
        prisma.kampagnenSchritt.update({ where: { id: s.id }, data: { reihenfolge: nachbar.reihenfolge } }),
        prisma.kampagnenSchritt.update({ where: { id: nachbar.id }, data: { reihenfolge: s.reihenfolge } }),
      ]);
    }
    return NextResponse.json({ ok: true });
  }
  const schritt = await prisma.kampagnenSchritt.update({
    where: { id: s.id },
    data: {
      ...(d.titel !== undefined ? { titel: d.titel } : {}),
      ...(d.notiz !== undefined ? { notiz: d.notiz } : {}),
      ...(d.art !== undefined ? { art: d.art } : {}),
      ...(d.faelligAm !== undefined ? { faelligAm: d.faelligAm ? new Date(`${d.faelligAm}T00:00:00Z`) : null } : {}),
      ...(d.erledigt !== undefined ? { erledigtAm: d.erledigt ? new Date() : null } : {}),
    },
  });
  return NextResponse.json({ schritt });
}

async function handleDELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  await eigenerSchritt(user.workspaceId, id);
  await prisma.kampagnenSchritt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const PATCH = route(handlePATCH);
export const DELETE = route(handleDELETE);
