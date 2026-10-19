import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { METRIKEN } from "@/lib/reichweite/auswertung";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { eigeneKampagne, protokoll } from "@/lib/reichweite/service";

const schema = z.object({
  plattform: z.enum(["YOUTUBE", "INSTAGRAM", "FACEBOOK", "LINKEDIN", "TIKTOK", "SONSTIGE"]),
  metrik: z.enum(METRIKEN as [string, ...string[]]),
  wert: z.number().int().min(0).max(1_000_000_000),
  zeitraumVon: z.string().min(8),
  zeitraumBis: z.string().min(8),
});

/** Manuell aus der Plattform-Statistik übertragene Zahl (Quelle MANUELL). */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const kampagne = await eigeneKampagne(user.workspaceId, id);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Plattform, Kennzahl, Wert und Zeitraum angeben." }, { status: 400 });
  const von = new Date(parsed.data.zeitraumVon);
  const bis = new Date(parsed.data.zeitraumBis);
  if (Number.isNaN(von.getTime()) || Number.isNaN(bis.getTime()) || von > bis) {
    return NextResponse.json({ error: "Ungültiger Zeitraum." }, { status: 400 });
  }
  const kennzahl = await prisma.reichweitenKennzahl.create({
    data: {
      workspaceId: user.workspaceId,
      kampagneId: kampagne.id,
      plattform: parsed.data.plattform,
      metrik: parsed.data.metrik,
      wert: parsed.data.wert,
      quelle: kampagne.istDemo ? "DEMO" : "MANUELL",
      zeitraumVon: von,
      zeitraumBis: bis,
    },
  });
  await protokoll(user.workspaceId, user.userId, "reichweite.kennzahl_erfasst", kennzahl.id);
  return NextResponse.json({ kennzahl });
}

export const POST = route(handlePOST);
