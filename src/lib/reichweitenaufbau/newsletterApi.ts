import { z } from "zod";
import { prisma } from "@/lib/db";
import { kuerzen } from "@/lib/reichweite/texte";
import { themenBereinigen } from "@/lib/reichweitenaufbau/newsletterKunden";

export const ausgabeSchema = z.object({
  betreff: z.string().min(1).max(200),
  text: z.string().min(1).max(20000),
  bildIdee: z.string().max(500).default(""),
  themen: z.array(z.string()).max(12).default([]),
  kampagneId: z.string().nullable().default(null),
});

export async function ausgabeDaten(workspaceId: string, d: z.infer<typeof ausgabeSchema>) {
  const kampagne = d.kampagneId ? await prisma.reichweitenKampagne.findFirst({ where: { id: d.kampagneId, workspaceId } }) : null;
  if (d.kampagneId && !kampagne) return { error: "Kampagne nicht gefunden." };
  return {
    daten: {
      betreff: kuerzen(d.betreff, 200),
      text: kuerzen(d.text, 20000),
      bildIdee: kuerzen(d.bildIdee, 500),
      themen: JSON.stringify(themenBereinigen(d.themen)),
      kampagneId: kampagne?.id ?? null,
    },
    istDemo: kampagne?.istDemo ?? false,
  };
}
