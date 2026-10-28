import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { eindeutigerCode } from "@/lib/reichweite/service";

/** Individueller Kampagnenlink für die Kooperation (Auswertung über Weiterempfehlungen). */
async function handlePOST(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const k = await prisma.kooperation.findFirst({ where: { id, workspaceId: user.workspaceId }, include: { kampagne: true } });
  if (!k) throw new NotFoundError();
  if (!k.kampagne) return NextResponse.json({ error: "Bitte zuerst eine Kampagne zuordnen." }, { status: 409 });
  if (k.linkId) return NextResponse.json({ error: "Diese Kooperation hat bereits einen Link." }, { status: 409 });
  const link = await prisma.empfehlungsLink.create({
    data: { workspaceId: user.workspaceId, kampagneId: k.kampagne.id, code: await eindeutigerCode(), bezeichnung: `Kooperation · ${k.name}`.slice(0, 80), istDemo: k.istDemo },
  });
  await prisma.kooperation.update({ where: { id }, data: { linkId: link.id } });
  return NextResponse.json({ code: link.code });
}

export const POST = route(handlePOST);
