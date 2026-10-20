import { NextResponse } from "next/server";
import { z } from "zod";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { formatEingabeSchema } from "@/lib/reichweitenaufbau/kampagnenApi";
import { FORMAT_PLATTFORMEN, plattformVarianten, pruefeFormatEingabe } from "@/lib/reichweitenaufbau/plattformformate";
import { eigeneReichweitenKampagne, varianteUebernehmen } from "@/lib/reichweitenaufbau/kampagnenService";

const plattform = z.enum(Object.keys(FORMAT_PLATTFORMEN) as [keyof typeof FORMAT_PLATTFORMEN, ...(keyof typeof FORMAT_PLATTFORMEN)[]]);
const varianteSchema = z.object({
  plattform,
  format: z.string().max(120),
  titel: z.string().min(1).max(200),
  einstieg: z.string().max(600),
  text: z.string().min(1).max(6000),
  videoablauf: z.array(z.string().max(600)).max(20),
  fakten: z.array(z.object({ text: z.string().max(500), quelle: z.string().max(300), geprueft: z.boolean() })).max(10),
  ungeprueft: z.number().int().min(0),
  zeichen: z.number().int().min(0),
  limit: z.number().int().min(0),
  hinweise: z.array(z.string().max(400)).max(20),
});
const schema = z.discriminatedUnion("aktion", [
  z.object({ aktion: z.literal("vorschau"), eingabe: formatEingabeSchema }),
  z.object({ aktion: z.literal("uebernehmen"), variante: varianteSchema }),
]);

/**
 * Plattformformate aus einem Thema: Vorschau (regelbasiert, ohne Kosten) und
 * Übernahme einzelner Varianten als Entwurf. Dieselbe Variante wird nur einmal übernommen.
 */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const k = await eigeneReichweitenKampagne(user.workspaceId, id);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  if (parsed.data.aktion === "vorschau") {
    const e = { ...parsed.data.eingabe, zielgruppe: parsed.data.eingabe.zielgruppe || k.zielgruppe };
    const fehler = pruefeFormatEingabe(e);
    if (fehler) return NextResponse.json({ error: fehler }, { status: 400 });
    return NextResponse.json({ varianten: plattformVarianten(e) });
  }
  const r = await varianteUebernehmen(user.workspaceId, k.id, parsed.data.variante);
  if (r.neu) await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.variante_uebernommen", r.item.id);
  return NextResponse.json({ item: { id: r.item.id, status: r.item.status }, neu: r.neu });
}

export const POST = route(handlePOST);
