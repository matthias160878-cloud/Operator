import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";

/** Entwurf → Prüfung (zur Freigabe vorlegen). */
async function handlePOST(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const plan = await prisma.werbeplan.findFirst({ where: { id, workspaceId: user.workspaceId } });
  if (!plan) throw new NotFoundError();
  if (plan.status !== "ENTWURF") return NextResponse.json({ error: "Nur Entwürfe können zur Prüfung gegeben werden." }, { status: 409 });
  await prisma.werbeplan.update({ where: { id }, data: { status: "PRUEFUNG" } });
  return NextResponse.json({ ok: true });
}

export const POST = route(handlePOST);
