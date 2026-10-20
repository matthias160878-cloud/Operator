import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { ausgabeDaten, ausgabeSchema } from "@/lib/reichweitenaufbau/newsletterApi";
import { nurWenn, newsletterFreigeschaltet } from "@/lib/reichweitenaufbau/freischaltung";

async function handlePOST(request: Request) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const parsed = ausgabeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Betreff und Text angeben." }, { status: 400 });
  const r = await ausgabeDaten(user.workspaceId, parsed.data);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 404 });
  const a = await prisma.newsletterAusgabe.create({ data: { workspaceId: user.workspaceId, ...r.daten, istDemo: r.istDemo, status: "ENTWURF" } });
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.ausgabe_angelegt", a.id);
  return NextResponse.json({ ausgabe: a });
}

export const POST = nurWenn(newsletterFreigeschaltet, route(handlePOST));
