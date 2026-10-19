import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { kuerzen } from "@/lib/reichweite/texte";
import { anfrageEntwurf, KOOP_FORMATE } from "@/lib/reichweitenaufbau/kooperation";

/** Erstellt einen persönlichen Anfrage-Entwurf. Versendet wird nichts. */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const k = await prisma.kooperation.findFirst({ where: { id, workspaceId: user.workspaceId } });
  if (!k) throw new NotFoundError();
  const body = (await request.json().catch(() => ({}))) as { absender?: string; sie?: boolean };
  const text = anfrageEntwurf({
    name: k.name,
    format: (k.format in KOOP_FORMATE ? k.format : "GEMEINSAMER_BEITRAG") as keyof typeof KOOP_FORMATE,
    idee: k.idee,
    passungNotiz: k.passungNotiz,
    absender: kuerzen(body.absender, 120),
    sie: body.sie !== false,
  });
  const neu = await prisma.kooperation.update({
    where: { id },
    data: { anfrageEntwurf: text, status: k.status === "IDEE" ? "ANFRAGE_ENTWURF" : k.status },
  });
  return NextResponse.json({ kooperation: neu });
}

export const POST = route(handlePOST);
