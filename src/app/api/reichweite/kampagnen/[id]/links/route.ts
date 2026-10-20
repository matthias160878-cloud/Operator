import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { enthaeltPersonendaten, kuerzen, pruefeZielUrl } from "@/lib/reichweite/texte";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { eigeneKampagne, eindeutigerCode, protokoll } from "@/lib/reichweite/service";

const schema = z.object({ bezeichnung: z.string().max(80).default(""), angebotUrl: z.string().max(500).default("") });

/** Team-Link (Stufe 1) für eine Kampagne, z. B. „Instagram-Bio“. */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  const kampagne = await eigeneKampagne(user.workspaceId, id);
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Bezeichnung." }, { status: 400 });
  const bezeichnung = kuerzen(parsed.data.bezeichnung, 80);
  if (enthaeltPersonendaten(bezeichnung)) {
    return NextResponse.json({ error: "Bitte keine E-Mail-Adressen oder Telefonnummern in die Bezeichnung schreiben." }, { status: 400 });
  }
  const angebot = pruefeZielUrl(parsed.data.angebotUrl);
  if (!angebot.ok) return NextResponse.json({ error: `Angebotsseite: ${angebot.fehler}` }, { status: 400 });
  const link = await prisma.empfehlungsLink.create({
    data: {
      workspaceId: user.workspaceId,
      kampagneId: kampagne.id,
      code: await eindeutigerCode(),
      stufe: 1,
      herkunft: "TEAM",
      bezeichnung,
      angebotUrl: angebot.url,
      istDemo: kampagne.istDemo,
    },
  });
  await protokoll(user.workspaceId, user.userId, "reichweite.link_angelegt", link.id);
  return NextResponse.json({ link });
}

export const POST = route(handlePOST);
