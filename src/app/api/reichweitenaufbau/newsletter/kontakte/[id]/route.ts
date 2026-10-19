import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { freigeberOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { nurWenn, newsletterFreigeschaltet } from "@/lib/reichweitenaufbau/freischaltung";

/** Löschen eines Kontakts (z. B. auf Wunsch der Person). */
async function handleDELETE(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await freigeberOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const r = await prisma.newsletterKontakt.deleteMany({ where: { id, workspaceId: user.workspaceId } });
  if (!r.count) throw new NotFoundError();
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.kontakt_geloescht", id);
  return NextResponse.json({ ok: true });
}

export const DELETE = nurWenn(newsletterFreigeschaltet, route(handleDELETE));
