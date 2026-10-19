import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";

const schema = z.object({ ausgabenCent: z.number().int().min(0).max(1_000_000_00).nullable() });

/** Tatsächlich im Werbekonto gemeldete Ausgaben, manuell übertragen – getrennt vom geplanten Budget. */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const plan = await prisma.werbeplan.findFirst({ where: { id, workspaceId: user.workspaceId } });
  if (!plan) throw new NotFoundError();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültiger Betrag." }, { status: 400 });
  if (parsed.data.ausgabenCent !== null && plan.status !== "FREIGEGEBEN") {
    return NextResponse.json({ error: "Ausgaben können nur zu freigegebenen Plänen eingetragen werden." }, { status: 409 });
  }
  await prisma.werbeplan.update({
    where: { id },
    data: {
      gemeldeteAusgabenCent: parsed.data.ausgabenCent,
      gemeldetQuelle: parsed.data.ausgabenCent === null ? "" : plan.istDemo ? "DEMO" : "MANUELL (Werbekonto)",
      gemeldetAm: parsed.data.ausgabenCent === null ? null : new Date(),
    },
  });
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.werbeausgaben_eingetragen", id);
  return NextResponse.json({ ok: true });
}

export const POST = route(handlePOST);
