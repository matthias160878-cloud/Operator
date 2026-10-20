import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort, darfFreigeben } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { pruefeZielUrl } from "@/lib/reichweite/texte";
import { planSchema } from "@/lib/reichweitenaufbau/kampagnenApi";
import { eigeneReichweitenKampagne, freigeber } from "@/lib/reichweitenaufbau/kampagnenService";

const tag = (s: string) => new Date(`${s}T00:00:00Z`);

/** Planangaben einer Kampagne ändern. Budget nur durch Inhaber/Admin. */
async function handlePATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const k = await eigeneReichweitenKampagne(user.workspaceId, id);
  const parsed = planSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." }, { status: 400 });
  const d = parsed.data;
  const data: Record<string, unknown> = {};
  if (d.titel !== undefined) data.titel = d.titel.trim().slice(0, 120);
  if (d.ziel !== undefined) data.ziel = d.ziel.trim();
  if (d.hauptkennzahl !== undefined) data.hauptkennzahl = d.hauptkennzahl;
  if (d.zielgruppe !== undefined) data.zielgruppe = d.zielgruppe.trim();
  if (d.zielUrl !== undefined) {
    const u = pruefeZielUrl(d.zielUrl);
    if (!u.ok) return NextResponse.json({ error: `Zielseite: ${u.fehler}` }, { status: 400 });
    data.zielUrl = u.url;
  }
  if (d.startAm !== undefined) data.startAm = tag(d.startAm);
  if (d.endeAm !== undefined) data.endeAm = tag(d.endeAm);
  const start = (data.startAm as Date | undefined) ?? k.startAm;
  const ende = (data.endeAm as Date | undefined) ?? k.endeAm;
  if (start && ende && ende < start) return NextResponse.json({ error: "Das Ende liegt vor dem Start." }, { status: 400 });
  if (d.verantwortlichId !== undefined) {
    if (!(await freigeber(user.workspaceId)).some((u) => u.id === d.verantwortlichId)) return NextResponse.json({ error: "Verantwortlich kann nur ein Inhaber oder Admin sein." }, { status: 400 });
    data.verantwortlichId = d.verantwortlichId;
  }
  if (d.budgetCent !== undefined) {
    if (!darfFreigeben(user.role)) return NextResponse.json({ error: "Ein Budget dürfen nur Inhaber und Admins festlegen oder ändern." }, { status: 403 });
    data.budgetCent = d.budgetCent;
    data.budgetFestgelegtAm = d.budgetCent === null ? null : new Date();
  }
  const neu = await prisma.reichweitenKampagne.update({ where: { id: k.id }, data });
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.kampagne_geaendert", k.id);
  return NextResponse.json({ kampagne: neu });
}

export const PATCH = route(handlePATCH);
