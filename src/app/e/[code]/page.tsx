import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { istGueltigerCode } from "@/lib/reichweite/codes";
import { MAX_STUFE, ereignisSpeichern, istZaehlbarerAufruf, oeffentlicherLink } from "@/lib/reichweite/service";
import { empfehlungsUrl } from "@/lib/reichweite/teilen";
import { begleittexte } from "@/lib/reichweite/vorschlaege";
import { seitenOrigin } from "@/lib/reichweite/origin";
import { TeilenBereich } from "@/components/reichweite/TeilenBereich";
import { AnfrageFormular, EigenerLink } from "@/components/reichweite/EmpfehlungAktionen";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Empfehlung", robots: { index: false, follow: false }, referrer: "no-referrer" };

/**
 * Öffentliche Empfehlungsseite. Zeigt ausschließlich die öffentlichen Felder
 * der Kampagne (Titel, Text, Zielseite) — nie Workspace-, Kampagnen- oder
 * Inhaltsdaten. Ein Aufruf wird ohne Cookie und ohne Personenbezug gezählt.
 */
export default async function EmpfehlungSeite({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!istGueltigerCode(code)) notFound();
  const link = await oeffentlicherLink(code);
  if (!link) notFound();

  if (!link.aktiv) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid px-4 py-12">
        <div className="card w-full max-w-md p-6 text-center">
          <h1 className="text-lg font-semibold text-foreground">Dieser Link ist nicht mehr aktiv.</h1>
          <p className="mt-2 text-sm text-muted">Die Empfehlung wurde beendet.</p>
        </div>
      </div>
    );
  }

  if (istZaehlbarerAufruf(await headers())) await ereignisSpeichern(link, "AUFRUF");
  const url = empfehlungsUrl(await seitenOrigin(), link.code);
  const texte = begleittexte(link.kampagne.titel);
  const newsletter = await prisma.newsletterSeite.findFirst({ where: { kampagneId: link.kampagneId, aktiv: true }, select: { code: true, titel: true } });

  return (
    <div className="min-h-screen bg-grid px-4 py-8">
      <div className="mx-auto w-full max-w-lg space-y-4">
        {link.istDemo && (
          <div className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning" data-testid="demo-hinweis">
            DEMO – Beispielseite mit erfundenen Inhalten. Nichts davon ist veröffentlicht.
          </div>
        )}
        <div className="card p-5">
          <div className="text-xs text-muted">Empfehlung</div>
          <h1 className="mt-1 text-xl font-semibold text-foreground">{link.kampagne.titel}</h1>
          {link.kampagne.text && <p className="mt-2 whitespace-pre-line text-sm text-muted">{link.kampagne.text}</p>}
          {link.kampagne.zielUrl && (
            <a
              href={`/e/${link.code}/weiter`}
              rel="nofollow noreferrer"
              className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              Weiter zur Seite
            </a>
          )}
        </div>

        <div className="card space-y-3 p-5">
          <h2 className="text-sm font-semibold text-foreground">Weiterempfehlen – nur wenn du magst</h2>
          <TeilenBereich url={url} titel={link.kampagne.titel} texte={texte} />
          <EigenerLink code={link.code} titel={link.kampagne.titel} texte={texte} darfErzeugen={link.stufe < MAX_STUFE} />
        </div>

        {newsletter && (
          <div className="card space-y-2 p-5">
            <h2 className="text-sm font-semibold text-foreground">Newsletter (freiwillig)</h2>
            <p className="text-sm text-muted">{newsletter.titel}</p>
            <a href={`/n/${newsletter.code}?ref=${link.code}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm text-foreground">
              Zur Anmeldung
            </a>
          </div>
        )}

        <div className="card space-y-3 p-5">
          <h2 className="text-sm font-semibold text-foreground">Frage stellen</h2>
          <AnfrageFormular code={link.code} />
        </div>

        <p className="px-1 text-[11px] text-muted">
          Diese Seite setzt keine Cookies und speichert keine Angaben zu dir. Gezählt wird nur, dass der Link geöffnet wurde – ohne Personenbezug.
          {" "}<a href="/impressum" className="underline">Impressum</a>
        </p>
      </div>
    </div>
  );
}
