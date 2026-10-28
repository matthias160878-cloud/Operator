import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { EmailError } from "@/lib/email";
import { appOrigin } from "@/lib/composio/origin";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { istGueltigerCode } from "@/lib/reichweite/codes";
import { ipSchluessel, oeffentlicherAnbieter } from "@/lib/reichweite/service";
import { themenBereinigen, themenLesen } from "@/lib/reichweitenaufbau/newsletterKunden";
import { newsletterAnmelden } from "@/lib/reichweitenaufbau/service";
import { newsletterFreigeschaltet, nurWenn } from "@/lib/reichweitenaufbau/freischaltung";

const schema = z.object({
  email: z.string().trim().toLowerCase().max(320).email(),
  themen: z.array(z.string()).max(12).default([]),
  einwilligung: z.literal(true),
  ref: z.string().max(20).nullable().default(null),
  website: z.string().max(0).optional(),
});

const ANTWORT = "Fast geschafft: Bitte bestätigen Sie die Anmeldung über den Link in der E-Mail.";

/** Öffentlich: freiwillige Newsletter-Anmeldung (Double-Opt-in). Gleiche Antwort für jede Adresse. */
async function handlePOST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!istGueltigerCode(code)) return NextResponse.json({ error: "Seite nicht gefunden." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bitte eine gültige E-Mail-Adresse angeben und der Einwilligung zustimmen." }, { status: 400 });
  if (!(await hitRateLimit(ipSchluessel("nl-anmeldung", clientIp(request)), 5, 3600))) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte später erneut versuchen." }, { status: 429 });
  }
  const seite = await prisma.newsletterSeite.findUnique({ where: { code }, include: { workspace: { select: { name: true } } } });
  if (!seite || !seite.aktiv) return NextResponse.json({ error: "Diese Anmeldung ist nicht mehr aktiv." }, { status: 404 });
  const anbieter = await oeffentlicherAnbieter(seite.workspaceId, seite.istDemo);
  if (!anbieter.freigeschaltet) return NextResponse.json({ error: "Diese Seite ist noch nicht freigeschaltet." }, { status: 403 });
  const ref = parsed.data.ref && istGueltigerCode(parsed.data.ref) ? parsed.data.ref : null;
  try {
    const r = await newsletterAnmelden({
      seite,
      absender: anbieter.profil ? anbieter.profil.firma || anbieter.profil.anbieter : seite.workspace.name,
      email: parsed.data.email,
      themen: themenBereinigen(parsed.data.themen, themenLesen(seite.themen)),
      refCode: ref,
      origin: appOrigin(request),
    });
    if (r.modus === "DEMO") {
      return NextResponse.json({
        ok: true,
        demo: true,
        meldung: "DEMO: Es wurde keine E-Mail versendet. Zum Ausprobieren stehen Bestätigungs- und Abmeldelink unten (im echten Betrieb kommen sie per E-Mail).",
        bestaetigungsUrl: r.demoBestaetigungsUrl,
        abmeldeUrl: r.demoAbmeldeUrl,
      });
    }
    return NextResponse.json({ ok: true, meldung: ANTWORT });
  } catch (err) {
    if (!(err instanceof EmailError)) throw err;
    console.error("[nl]", err.message);
    return NextResponse.json({ error: "Die Bestätigungs-E-Mail konnte nicht versendet werden. Bitte später erneut versuchen." }, { status: 502 });
  }
}

export const POST = nurWenn(newsletterFreigeschaltet, handlePOST);
