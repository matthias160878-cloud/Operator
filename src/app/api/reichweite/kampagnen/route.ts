import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { kuerzen, pruefeZielUrl } from "@/lib/reichweite/texte";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";

const schema = z.object({
  titel: z.string().min(1).max(160),
  text: z.string().max(1000).default(""),
  zielUrl: z.string().max(500).default(""),
  campaignId: z.string().nullable().default(null),
});

async function handleGET() {
  const workspaceId = await getCurrentWorkspaceId();
  const kampagnen = await prisma.reichweitenKampagne.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: { campaign: { select: { title: true } }, _count: { select: { links: true, ereignisse: true } } },
  });
  return NextResponse.json({ kampagnen });
}

async function handlePOST(request: Request) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte einen Titel angeben." }, { status: 400 });
  const ziel = pruefeZielUrl(parsed.data.zielUrl);
  if (!ziel.ok) return NextResponse.json({ error: ziel.fehler }, { status: 400 });
  const { workspaceId } = user;
  // Zuordnung nur zu eigenen internen Kampagnen.
  if (parsed.data.campaignId && !(await prisma.campaign.findFirst({ where: { id: parsed.data.campaignId, workspaceId } }))) {
    return NextResponse.json({ error: "Kampagne nicht gefunden." }, { status: 404 });
  }
  const kampagne = await prisma.reichweitenKampagne.create({
    data: {
      workspaceId,
      campaignId: parsed.data.campaignId,
      titel: kuerzen(parsed.data.titel, 160),
      text: kuerzen(parsed.data.text, 1000),
      zielUrl: ziel.url,
    },
  });
  await protokoll(workspaceId, user.userId, "reichweite.kampagne_angelegt", kampagne.id);
  return NextResponse.json({ kampagne });
}

export const GET = route(handleGET);
export const POST = route(handlePOST);
