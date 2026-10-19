import { z } from "zod";
import { prisma } from "@/lib/db";
import { kuerzen, pruefeZielUrl } from "@/lib/reichweite/texte";
import { WERBE_PLATTFORMEN, WERBE_ZIELE, ZIELGRUPPEN_ARTEN, pruefePlan } from "@/lib/reichweitenaufbau/werbung";

export const werbeplanSchema = z.object({
  titel: z.string().min(1).max(160),
  contentItemId: z.string().nullable().default(null),
  kampagneId: z.string().nullable().default(null),
  plattform: z.enum(WERBE_PLATTFORMEN),
  ziel: z.enum(Object.keys(WERBE_ZIELE) as [string, ...string[]]),
  zielgruppe: z.string().max(500).default(""),
  zielgruppenArt: z.enum(Object.keys(ZIELGRUPPEN_ARTEN) as [string, ...string[]]).default("NEU"),
  region: z.string().max(200).default(""),
  sprache: z.string().max(60).default("Deutsch"),
  startAm: z.string().min(8),
  endeAm: z.string().min(8),
  tagesbudgetCent: z.number().int().min(1).max(100_000_00),
  gesamtbudgetCent: z.number().int().min(1).max(1_000_000_00),
  zielUrl: z.string().max(500).default(""),
  erfolgsmessung: z.string().max(500).default(""),
});

export async function werbeplanDaten(workspaceId: string, d: z.infer<typeof werbeplanSchema>) {
  const startAm = new Date(d.startAm);
  const endeAm = new Date(d.endeAm);
  const fehler = pruefePlan({ plattform: d.plattform, ziel: d.ziel, startAm, endeAm, tagesbudgetCent: d.tagesbudgetCent, gesamtbudgetCent: d.gesamtbudgetCent });
  if (fehler) return { error: fehler, status: 400 };
  const ziel = pruefeZielUrl(d.zielUrl);
  if (!ziel.ok) return { error: ziel.fehler, status: 400 };
  if (d.contentItemId && !(await prisma.contentItem.findFirst({ where: { id: d.contentItemId, workspaceId } }))) return { error: "Inhalt nicht gefunden.", status: 404 };
  const kampagne = d.kampagneId ? await prisma.reichweitenKampagne.findFirst({ where: { id: d.kampagneId, workspaceId } }) : null;
  if (d.kampagneId && !kampagne) return { error: "Kampagne nicht gefunden.", status: 404 };
  return {
    daten: {
      titel: kuerzen(d.titel, 160),
      contentItemId: d.contentItemId,
      kampagneId: d.kampagneId,
      plattform: d.plattform,
      ziel: d.ziel,
      zielgruppe: kuerzen(d.zielgruppe, 500),
      zielgruppenArt: d.zielgruppenArt,
      region: kuerzen(d.region, 200),
      sprache: kuerzen(d.sprache, 60),
      startAm,
      endeAm,
      tagesbudgetCent: d.tagesbudgetCent,
      gesamtbudgetCent: d.gesamtbudgetCent,
      zielUrl: ziel.url,
      erfolgsmessung: kuerzen(d.erfolgsmessung, 500),
    },
    istDemo: kampagne?.istDemo ?? false,
  };
}
