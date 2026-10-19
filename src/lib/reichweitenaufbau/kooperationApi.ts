import { z } from "zod";
import { prisma } from "@/lib/db";
import { kuerzen } from "@/lib/reichweite/texte";
import { KOOP_ARTEN, KOOP_FORMATE, KOOP_KENNZEICHNUNG, KOOP_STATUS, PASSUNG } from "@/lib/reichweitenaufbau/kooperation";

const keys = (o: object) => Object.keys(o) as [string, ...string[]];

export const kooperationSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  profilUrl: z.string().max(500).optional(),
  art: z.enum(keys(KOOP_ARTEN)).optional(),
  zielgruppenpassung: z.enum(keys(PASSUNG)).optional(),
  passungNotiz: z.string().max(500).optional(),
  idee: z.string().max(1000).optional(),
  format: z.enum(keys(KOOP_FORMATE)).optional(),
  status: z.enum(keys(KOOP_STATUS)).optional(),
  naechsterSchritt: z.string().max(300).optional(),
  termin: z.string().nullable().optional(),
  kampagneId: z.string().nullable().optional(),
  anfrageEntwurf: z.string().max(5000).optional(),
  kennzeichnung: z.enum(keys(KOOP_KENNZEICHNUNG)).optional(),
});

/** Bereinigte Felder; Kampagnen nur aus dem eigenen Workspace. */
export async function kooperationsDaten(workspaceId: string, d: z.infer<typeof kooperationSchema>) {
  const out: Record<string, unknown> = {};
  if (d.zielgruppenpassung !== undefined) out.zielgruppenpassung = d.zielgruppenpassung;
  if (d.passungNotiz !== undefined) out.passungNotiz = kuerzen(d.passungNotiz, 500);
  if (d.idee !== undefined) out.idee = kuerzen(d.idee, 1000);
  if (d.format !== undefined) out.format = d.format;
  if (d.status !== undefined) out.status = d.status;
  if (d.kennzeichnung !== undefined) out.kennzeichnung = d.kennzeichnung;
  if (d.naechsterSchritt !== undefined) out.naechsterSchritt = kuerzen(d.naechsterSchritt, 300);
  if (d.anfrageEntwurf !== undefined) out.anfrageEntwurf = kuerzen(d.anfrageEntwurf, 5000);
  if (d.termin !== undefined) {
    const t = d.termin ? new Date(d.termin) : null;
    if (t && Number.isNaN(t.getTime())) return { error: "Ungültiger Termin." };
    out.termin = t;
  }
  if (d.kampagneId !== undefined) {
    if (d.kampagneId && !(await prisma.reichweitenKampagne.findFirst({ where: { id: d.kampagneId, workspaceId } }))) return { error: "Kampagne nicht gefunden." };
    out.kampagneId = d.kampagneId;
  }
  return out;
}
