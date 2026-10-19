import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { protokoll } from "@/lib/reichweite/service";
import { werbeplanDaten, werbeplanSchema } from "@/lib/reichweitenaufbau/werbungApi";

async function handlePOST(request: Request) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const parsed = werbeplanSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Titel, Plattform, Ziel, Laufzeit sowie Tages- und Gesamtbudget angeben." }, { status: 400 });
  const r = await werbeplanDaten(user.workspaceId, parsed.data);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const plan = await prisma.werbeplan.create({ data: { workspaceId: user.workspaceId, ...r.daten, istDemo: r.istDemo, status: "ENTWURF" } });
  await protokoll(user.workspaceId, user.userId, "reichweitenaufbau.werbeplan_angelegt", plan.id);
  return NextResponse.json({ plan });
}

export const POST = route(handlePOST);
