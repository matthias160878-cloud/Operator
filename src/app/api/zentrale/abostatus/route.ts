import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isPackageId } from "@/lib/packages";
import { pruefeAboStatusPush, ABOSTATUS_FRISCHE_STUNDEN } from "@/lib/abostatus";

/**
 * POST /api/zentrale/abostatus --- laufender Abostatus-Push von der
 * Zentrale (secret58-web), siehe src/lib/abostatus.ts für Format und
 * Signaturprüfung. Diese Route ist NICHT in proxy.ts's öffentlichen
 * Pfaden gelistet, prüft Authentizität aber selbst (Signatur statt
 * Session-Cookie, wie der Stripe-Webhook) --- sie liegt daher unter
 * /api/zentrale, nicht unter einem der ALWAYS_PUBLIC_PREFIXES.
 */
export async function POST(request: Request) {
  const rohKoerper = await request.text();
  const signatur = request.headers.get("x-zentrale-signatur");
  const gepruefft = pruefeAboStatusPush(rohKoerper, signatur, process.env.ENTITLEMENT_SECRET ?? "");
  if (!gepruefft.ok) {
    return NextResponse.json({ error: gepruefft.grund }, { status: 401 });
  }
  const { ereignis } = gepruefft;

  // Replay-Schutz: dieser Eintrag muss NEU sein.
  try {
    await prisma.aboStatusEreignis.create({
      data: { eventId: ereignis.eventId, kundenschluessel: ereignis.kundenschluessel },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: true, hinweis: "bereits verarbeitet" });
    }
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { externalKundenschluessel: ereignis.kundenschluessel },
  });
  if (!user) {
    // Dieser Kunde hat noch nie ein Entitlement-Token hier eingelöst --- es
    // gibt nichts zu aktualisieren. Trotzdem 200, sonst wiederholt die
    // Zentrale diesen Push endlos für ein Konto, das es hier nie geben wird.
    return NextResponse.json({ ok: true, hinweis: "kein Konto hier" });
  }

  const key = `zentrale:${ereignis.kundenschluessel}`;
  const vorhanden = await prisma.license.findUnique({ where: { stripeCheckoutSessionId: key } });

  // Out-of-Order-Schutz: ein verspätet eintreffendes ÄLTERES Ereignis darf
  // einen bereits angewandten NEUEREN Stand nicht überschreiben. Echt
  // GLEICHE Zeitstempel (gesendetUm hat nur Sekundenauflösung --- zwei
  // Ereignisse innerhalb derselben Sekunde sind möglich) zählen bewusst
  // NICHT als "älter": beide haben schon den eventId-Replay-Schutz
  // bestanden, sind also garantiert zwei verschiedene, echte Ereignisse.
  if (vorhanden?.letzterAboEventZeitstempel) {
    const neuesEreignisZeit = new Date(ereignis.gesendetUm * 1000);
    if (neuesEreignisZeit < vorhanden.letzterAboEventZeitstempel) {
      return NextResponse.json({ ok: true, hinweis: "älter als bereits angewandter Stand, ignoriert" });
    }
  }

  const packageId = isPackageId(ereignis.paketId) ? ereignis.paketId : vorhanden?.packageId ?? null;
  const daten = {
    status: ereignis.aktiv ? ("ACTIVE" as const) : ("EXPIRED" as const),
    packageId,
    origin: "zentrale",
    externerAboStatus: ereignis.status,
    statusGueltigBis: new Date(Date.now() + ABOSTATUS_FRISCHE_STUNDEN * 60 * 60 * 1000),
    letzterAboEventZeitstempel: new Date(ereignis.gesendetUm * 1000),
  };

  await prisma.license.upsert({
    where: { stripeCheckoutSessionId: key },
    update: daten,
    create: {
      unlockToken: crypto.randomUUID(),
      stripeCheckoutSessionId: key,
      userId: user.id,
      workspaceId: user.workspaceId,
      ...daten,
    },
  });

  return NextResponse.json({ ok: true });
}
