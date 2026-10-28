import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { bearbeiterOderAntwort } from "@/lib/reichweite/zugriff";
import { eindeutigerCode, protokoll } from "@/lib/reichweite/service";
import { kuerzen } from "@/lib/reichweite/texte";
import { EIGENSCHAFTEN, VARIANTEN_METRIK_KEYS } from "@/lib/reichweitenaufbau/varianten";

const schema = z.object({
  titel: z.string().min(1).max(160),
  ziel: z.string().min(1).max(300),
  hauptkennzahl: z.enum(VARIANTEN_METRIK_KEYS as [string, ...string[]]),
  eigenschaft: z.enum(Object.keys(EIGENSCHAFTEN) as [string, ...string[]]),
  datenquelle: z.string().min(1).max(300),
  laufzeitVon: z.string().min(8),
  laufzeitBis: z.string().min(8),
  zufallsverteilt: z.boolean().default(false),
  kampagneId: z.string().nullable().default(null),
  varianten: z
    .array(z.object({ label: z.string().min(1).max(40), beschreibung: z.string().max(300).default(""), plattform: z.string().max(20), contentItemId: z.string().nullable().default(null) }))
    .min(2)
    .max(5),
});

/** Legt einen Variantenvergleich an. Alle Festlegungen (Ziel, Hauptkennzahl, Laufzeit, Eigenschaft, Datenquelle) vor dem Start. */
async function handlePOST(request: Request) {
  const user = await bearbeiterOderAntwort();
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte Ziel, Hauptkennzahl, Laufzeit, Eigenschaft, Datenquelle und mindestens zwei Varianten angeben." }, { status: 400 });
  const d = parsed.data;
  const von = new Date(d.laufzeitVon);
  const bis = new Date(d.laufzeitBis);
  if (Number.isNaN(von.getTime()) || Number.isNaN(bis.getTime()) || bis < von) return NextResponse.json({ error: "Ungültige Laufzeit." }, { status: 400 });
  const { workspaceId } = user;
  const kampagne = d.kampagneId ? await prisma.reichweitenKampagne.findFirst({ where: { id: d.kampagneId, workspaceId } }) : null;
  if (d.kampagneId && !kampagne) return NextResponse.json({ error: "Kampagne nicht gefunden." }, { status: 404 });
  for (const v of d.varianten) {
    if (v.contentItemId && !(await prisma.contentItem.findFirst({ where: { id: v.contentItemId, workspaceId } }))) {
      return NextResponse.json({ error: "Inhalt nicht gefunden." }, { status: 404 });
    }
  }
  const test = await prisma.variantenTest.create({
    data: {
      workspaceId,
      kampagneId: kampagne?.id ?? null,
      titel: kuerzen(d.titel, 160),
      ziel: kuerzen(d.ziel, 300),
      hauptkennzahl: d.hauptkennzahl,
      eigenschaft: d.eigenschaft,
      datenquelle: kuerzen(d.datenquelle, 300),
      laufzeitVon: von,
      laufzeitBis: bis,
      zufallsverteilt: d.zufallsverteilt,
      istDemo: kampagne?.istDemo ?? false,
    },
  });
  for (const v of d.varianten) {
    // Mit Kampagne bekommt jede Variante einen eigenen Empfehlungslink → Klicks, Anfragen, Newsletter selbst gemessen.
    const link = kampagne
      ? await prisma.empfehlungsLink.create({
          data: { workspaceId, kampagneId: kampagne.id, code: await eindeutigerCode(), bezeichnung: kuerzen(`${d.titel} · ${v.label}`, 80), istDemo: kampagne.istDemo },
        })
      : null;
    await prisma.testVariante.create({
      data: { workspaceId, testId: test.id, label: kuerzen(v.label, 40), beschreibung: kuerzen(v.beschreibung, 300), plattform: v.plattform, contentItemId: v.contentItemId, linkId: link?.id ?? null },
    });
  }
  await protokoll(workspaceId, user.userId, "reichweitenaufbau.variantentest_angelegt", test.id);
  return NextResponse.json({ test: { id: test.id } });
}

export const POST = route(handlePOST);
