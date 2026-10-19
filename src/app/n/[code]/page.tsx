import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { istGueltigerCode } from "@/lib/reichweite/codes";
import { istZaehlbarerAufruf, oeffentlicherAnbieter } from "@/lib/reichweite/service";
import { newsletterFreigeschaltet } from "@/lib/reichweitenaufbau/freischaltung";
import { AnbieterFuss, NichtFreigeschaltet } from "@/components/reichweite/AnbieterFuss";
import { einwilligungsText, themenLesen, versandModus } from "@/lib/reichweitenaufbau/newsletterKunden";
import { NewsletterFormular } from "@/components/reichweitenaufbau/NewsletterFormular";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Newsletter", robots: { index: false, follow: false }, referrer: "no-referrer" };

/** Öffentliche Newsletter-Landingpage eines Kunden. Zeigt nur Titel, Themen und Absendernamen. */
export default async function NewsletterSeite({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ ref?: string }> }) {
  const { code } = await params;
  const { ref } = await searchParams;
  if (!newsletterFreigeschaltet() || !istGueltigerCode(code)) notFound();
  const seite = await prisma.newsletterSeite.findUnique({ where: { code }, include: { workspace: { select: { name: true } } } });
  if (!seite) notFound();
  if (!seite.aktiv) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card w-full max-w-md p-6 text-center text-foreground">Diese Anmeldung ist nicht mehr aktiv.</div>
      </div>
    );
  }
  const { profil, freigeschaltet } = await oeffentlicherAnbieter(seite.workspaceId, seite.istDemo);
  if (!freigeschaltet) return <NichtFreigeschaltet />;
  const absender = profil ? profil.firma || profil.anbieter : seite.workspace.name;
  const demo = seite.istDemo || versandModus() === "DEMO";
  if (istZaehlbarerAufruf(await headers())) {
    await prisma.newsletterEreignis.create({ data: { workspaceId: seite.workspaceId, seiteId: seite.id, art: "AUFRUF", istDemo: demo } });
  }
  const themen = themenLesen(seite.themen);
  return (
    <div className="min-h-screen bg-grid px-4 py-8">
      <div className="mx-auto w-full max-w-lg space-y-4">
        {demo && (
          <div className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning" data-testid="nl-demo">
            DEMO – Versanddienst nicht freigeschaltet. Es wird keine E-Mail versendet.
          </div>
        )}
        <div className="card space-y-3 p-5">
          <div className="text-xs text-muted">Newsletter von {absender}</div>
          <h1 className="text-xl font-semibold text-foreground">{seite.titel}</h1>
          <p className="whitespace-pre-line text-sm text-muted">{seite.themenBeschreibung}</p>
          <NewsletterFormular code={seite.code} themen={themen} einwilligung={einwilligungsText(absender, themen)} datenschutzUrl={profil?.datenschutzUrl ?? null} refCode={ref && istGueltigerCode(ref) ? ref : null} />
        </div>
        <AnbieterFuss profil={profil} impressumHref={`/n/${seite.code}/impressum`}>
          Diese Seite setzt keine Cookies. Gezählt wird nur, dass sie geöffnet wurde – ohne Personenbezug.
        </AnbieterFuss>
      </div>
    </div>
  );
}
