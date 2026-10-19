import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { EIGENE_METRIKEN, VARIANTEN_METRIK_KEYS } from "@/lib/reichweitenaufbau/varianten";

const schema = z.object({
  varianteId: z.string().min(1),
  metrik: z.enum(VARIANTEN_METRIK_KEYS as [string, ...string[]]),
  wert: z.number().min(0).max(1_000_000_000),
});

/** Manuell aus der Plattform-Statistik übertragener Wert (Quelle MANUELL; in Demo-Tests DEMO). */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Variante, Kennzahl und Wert angeben." }, { status: 400 });
  const v = await prisma.testVariante.findFirst({ where: { id: parsed.data.varianteId, testId: id, workspaceId: user.workspaceId }, include: { test: true } });
  if (!v) throw new NotFoundError();
  if (parsed.data.metrik === "ABSCHLUSSRATE_PROZENT" && parsed.data.wert > 100) return NextResponse.json({ error: "Abschlussrate höchstens 100 %." }, { status: 400 });
  if (v.linkId && EIGENE_METRIKEN.includes(parsed.data.metrik as (typeof EIGENE_METRIKEN)[number])) {
    return NextResponse.json({ error: "Dieser Wert wird über den Variantenlink selbst gemessen und nicht eingetragen." }, { status: 409 });
  }
  const m = await prisma.variantenMesswert.create({
    data: { workspaceId: user.workspaceId, varianteId: v.id, metrik: parsed.data.metrik, wert: parsed.data.wert, quelle: v.test.istDemo ? "DEMO" : "MANUELL" },
  });
  return NextResponse.json({ messwert: m });
}

export const POST = route(handlePOST);
