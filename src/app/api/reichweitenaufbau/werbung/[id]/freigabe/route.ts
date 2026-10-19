import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { freigeberOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { euro, pruefeFreigabe } from "@/lib/reichweitenaufbau/werbung";
import { freigabeHash } from "@/lib/reichweitenaufbau/werbungHash";

const schema = z.object({
  gesamtbudgetCent: z.number().int(),
  startAm: z.string(),
  endeAm: z.string(),
  ziel: z.string(),
  bestaetigt: z.boolean(),
});

/**
 * Freigabe eines Werbeplans durch Inhaber/Admin. Betrag, Laufzeit und Ziel
 * müssen ausdrücklich so bestätigt werden, wie sie im Plan stehen. Die
 * Freigabe startet nichts: Es gibt keine Werbe-Schnittstelle.
 */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await freigeberOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const plan = await prisma.werbeplan.findFirst({ where: { id, workspaceId: user.workspaceId } });
  if (!plan) throw new NotFoundError();
  if (plan.status !== "PRUEFUNG") return NextResponse.json({ error: "Freigeben geht nur aus der Prüfung." }, { status: 409 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Betrag, Laufzeit und Ziel bestätigen." }, { status: 400 });
  const fehler = pruefeFreigabe(plan, parsed.data);
  if (fehler) return NextResponse.json({ error: fehler }, { status: 400 });
  await prisma.werbeplan.update({
    where: { id },
    data: { status: "FREIGEGEBEN", freigabeHash: freigabeHash(plan), freigegebenAm: new Date(), freigegebenVonId: user.userId },
  });
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.werbeplan_freigegeben", `${id} ${euro(plan.gesamtbudgetCent)}`);
  return NextResponse.json({ ok: true, hinweis: "Freigegeben – es wurde nichts gestartet. Keine Werbeanbindung vorhanden: bitte als Entwurf exportieren." });
}

export const POST = route(handlePOST);
