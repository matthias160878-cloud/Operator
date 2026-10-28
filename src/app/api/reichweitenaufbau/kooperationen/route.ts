import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { pruefeZielUrl } from "@/lib/reichweite/texte";
import { kooperationsDaten, kooperationSchema } from "@/lib/reichweitenaufbau/kooperationApi";

async function handlePOST(request: Request) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const parsed = kooperationSchema.extend({ name: z.string().min(1).max(120), art: kooperationSchema.shape.art.unwrap() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Name und Art der Kooperation angeben." }, { status: 400 });
  const url = pruefeZielUrl(parsed.data.profilUrl ?? "");
  if (!url.ok) return NextResponse.json({ error: "Profil/Webseite: " + url.fehler }, { status: 400 });
  const daten = await kooperationsDaten(user.workspaceId, parsed.data);
  if ("error" in daten) return NextResponse.json({ error: daten.error }, { status: 404 });
  const k = await prisma.kooperation.create({ data: { workspaceId: user.workspaceId, ...daten, profilUrl: url.url, name: parsed.data.name, art: parsed.data.art } });
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.kooperation_angelegt", k.id);
  return NextResponse.json({ kooperation: k });
}

export const POST = route(handlePOST);
