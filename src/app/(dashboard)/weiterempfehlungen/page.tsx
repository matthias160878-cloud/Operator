import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { aufbewahrungTage, plattformStatus } from "@/lib/reichweite/service";
import { darfBearbeiten } from "@/lib/reichweite/zugriff";
import { seitenOrigin } from "@/lib/reichweite/origin";
import { CTA_VORSCHLAEGE, KEINE_GARANTIE } from "@/lib/reichweite/vorschlaege";
import { WeiterempfehlungenBoard } from "@/components/reichweite/WeiterempfehlungenBoard";

export const dynamic = "force-dynamic";

export default async function WeiterempfehlungenPage() {
  const user = await requireSessionUser();
  const { workspaceId } = user;
  const [kampagnen, interneKampagnen, plattformen, origin] = await Promise.all([
    prisma.reichweitenKampagne.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        campaign: { select: { title: true } },
        links: { orderBy: { createdAt: "asc" } },
        kennzahlen: { orderBy: { erfasstAm: "desc" } },
      },
    }),
    prisma.campaign.findMany({ where: { workspaceId }, select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
    plattformStatus(workspaceId),
    seitenOrigin(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Weiterempfehlungen &amp; Reichweite</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Freiwilliges Teilen, Kampagnen- und Empfehlungslinks und eine ehrliche Übersicht, was gemessen ist und was nicht. {KEINE_GARANTIE}
        </p>
      </div>
      <WeiterempfehlungenBoard
        origin={origin}
        darfBearbeiten={darfBearbeiten(user.role)}
        aufbewahrungTage={aufbewahrungTage()}
        plattformen={plattformen}
        interneKampagnen={interneKampagnen}
        ctaVorschlaege={CTA_VORSCHLAEGE}
        kampagnen={kampagnen.map((k) => ({
          id: k.id,
          titel: k.titel,
          text: k.text,
          zielUrl: k.zielUrl,
          aktiv: k.aktiv,
          istDemo: k.istDemo,
          interneKampagne: k.campaign?.title ?? null,
          links: k.links.map((l) => ({
            id: l.id,
            code: l.code,
            stufe: l.stufe,
            bezeichnung: l.bezeichnung,
            herkunft: l.herkunft,
            istDemo: l.istDemo,
            widerrufen: !!l.widerrufenAm,
          })),
          kennzahlen: k.kennzahlen.map((z) => ({
            id: z.id,
            plattform: z.plattform,
            metrik: z.metrik,
            wert: z.wert,
            quelle: z.quelle,
            zeitraumVon: z.zeitraumVon.toISOString(),
            zeitraumBis: z.zeitraumBis.toISOString(),
          })),
        }))}
      />
    </div>
  );
}
