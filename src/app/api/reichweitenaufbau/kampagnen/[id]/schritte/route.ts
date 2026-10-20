import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { schrittSchema } from "@/lib/reichweitenaufbau/kampagnenApi";
import { eigeneReichweitenKampagne } from "@/lib/reichweitenaufbau/kampagnenService";

/** Neuen Schritt am Ende des Ablaufs anfügen. */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const k = await eigeneReichweitenKampagne(user.workspaceId, id);
  const parsed = schrittSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !parsed.data.titel) return NextResponse.json({ error: "Bitte einen Titel angeben." }, { status: 400 });
  const letzter = await prisma.kampagnenSchritt.findFirst({ where: { kampagneId: k.id }, orderBy: { reihenfolge: "desc" } });
  const schritt = await prisma.kampagnenSchritt.create({
    data: {
      workspaceId: user.workspaceId,
      kampagneId: k.id,
      reihenfolge: (letzter?.reihenfolge ?? 0) + 1,
      titel: parsed.data.titel,
      notiz: parsed.data.notiz ?? "",
      art: parsed.data.art ?? "SONSTIGES",
      faelligAm: parsed.data.faelligAm ? new Date(`${parsed.data.faelligAm}T00:00:00Z`) : null,
    },
  });
  return NextResponse.json({ schritt });
}

export const POST = route(handlePOST);
