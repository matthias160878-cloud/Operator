import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { kuerzen } from "@/lib/reichweite/texte";
import { themenBereinigen } from "@/lib/reichweitenaufbau/newsletterKunden";
import { neuerSeitenCode } from "@/lib/reichweitenaufbau/service";

const schema = z.object({
  titel: z.string().min(1).max(160),
  themenBeschreibung: z.string().min(10).max(1000),
  themen: z.array(z.string()).max(12).default([]),
  kampagneId: z.string().nullable().default(null),
});

/** Anmeldeseite mit klarer Themenbeschreibung. */
async function handlePOST(request: Request) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Titel und eine klare Themenbeschreibung (mind. 10 Zeichen) angeben." }, { status: 400 });
  const kampagne = parsed.data.kampagneId ? await prisma.reichweitenKampagne.findFirst({ where: { id: parsed.data.kampagneId, workspaceId: user.workspaceId } }) : null;
  if (parsed.data.kampagneId && !kampagne) return NextResponse.json({ error: "Kampagne nicht gefunden." }, { status: 404 });
  const seite = await prisma.newsletterSeite.create({
    data: {
      workspaceId: user.workspaceId,
      code: await neuerSeitenCode(),
      titel: kuerzen(parsed.data.titel, 160),
      themenBeschreibung: kuerzen(parsed.data.themenBeschreibung, 1000),
      themen: JSON.stringify(themenBereinigen(parsed.data.themen)),
      kampagneId: kampagne?.id ?? null,
      istDemo: kampagne?.istDemo ?? false,
    },
  });
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.newsletterseite_angelegt", seite.id);
  return NextResponse.json({ seite });
}

export const POST = route(handlePOST);
