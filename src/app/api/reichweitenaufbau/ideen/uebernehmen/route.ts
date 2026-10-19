import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { INHALTSARTEN, PLATTFORMEN, versprechenImText } from "@/lib/reichweitenaufbau/ideen";

const schema = z.object({
  art: z.enum(Object.keys(INHALTSARTEN) as [string, ...string[]]),
  plattform: z.enum(PLATTFORMEN),
  format: z.string().max(80).default(""),
  titel: z.string().min(1).max(160),
  einstieg: z.string().max(500),
  text: z.string().max(5000),
  bildVideoIdee: z.string().max(1000),
  beschreibung: z.string().max(2000),
  aufforderung: z.string().max(500),
  grundlage: z.string().max(500).default(""),
  kampagneId: z.string().nullable().default(null),
});

/**
 * Übernimmt einen Vorschlag als ENTWURF in die Content Factory. Die Freigabe
 * läuft dort über den bestehenden Ablauf (Prüfung → Freigabe → Planung).
 */
async function handlePOST(request: Request) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unvollständiger Vorschlag." }, { status: 400 });
  const d = parsed.data;
  if (d.art === "VORHER_NACHHER" && !d.grundlage.trim()) {
    return NextResponse.json({ error: "Vorher-nachher nur mit belegter Grundlage." }, { status: 400 });
  }
  let campaignId: string | null = null;
  if (d.kampagneId) {
    const k = await prisma.reichweitenKampagne.findFirst({ where: { id: d.kampagneId, workspaceId: user.workspaceId } });
    if (!k) return NextResponse.json({ error: "Kampagne nicht gefunden." }, { status: 404 });
    campaignId = k.campaignId;
  }
  const warnung = versprechenImText(`${d.einstieg} ${d.text} ${d.beschreibung}`);
  const item = await prisma.contentItem.create({
    data: {
      workspaceId: user.workspaceId,
      campaignId,
      title: d.titel,
      platform: d.plattform,
      format: `Reichweitenaufbau · ${INHALTSARTEN[d.art as keyof typeof INHALTSARTEN]}${d.format ? ` · ${d.format}` : ""}`,
      status: "DRAFT",
      hook: d.einstieg,
      script: d.grundlage ? `${d.text}\n\n[Grundlage: ${d.grundlage}]` : d.text,
      caption: `${d.beschreibung}\n\n${d.aufforderung}`.trim(),
      thumbnailIdea: d.bildVideoIdee,
    },
  });
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.inhalt_uebernommen", item.id);
  return NextResponse.json({ item: { id: item.id, status: item.status }, warnung });
}

export const POST = route(handlePOST);
