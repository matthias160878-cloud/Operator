import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { operatorWorkspaceId } from "@/lib/operatorWorkspace";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().max(320).email(),
  nachricht: z.string().trim().max(1000).optional().default(""),
});

/**
 * Besucher fragt einen freien Termin an. Atomar: nur ein Besucher bekommt
 * denselben Termin. Die Anfrage erscheint zusätzlich im Posteingang des
 * Betreibers; bestätigt wird im Betreiberbereich.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hitRateLimit(`termin:${clientIp(request)}`, 5, 3600))) {
    return NextResponse.json({ meldung: "Zu viele Anfragen. Bitte in ein paar Minuten erneut versuchen." }, { status: 429 });
  }
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ meldung: "Bitte Name und E-Mail-Adresse angeben." }, { status: 400 });
  const { name, email, nachricht } = parsed.data;

  const claimed = await prisma.websiteAppointment.updateMany({
    where: { id, status: "FREI", startsAt: { gt: new Date() } },
    data: { status: "ANGEFRAGT", kundeName: name, kundeEmail: email, kundeNachricht: nachricht, angefragtAm: new Date() },
  });
  if (claimed.count !== 1) {
    const exists = await prisma.websiteAppointment.count({ where: { id } });
    return exists
      ? NextResponse.json({ meldung: "Dieser Termin ist leider nicht mehr frei." }, { status: 409 })
      : NextResponse.json({ meldung: "Termin nicht gefunden." }, { status: 404 });
  }
  const termin = await prisma.websiteAppointment.findUniqueOrThrow({ where: { id } });
  const workspaceId = await operatorWorkspaceId();
  if (workspaceId) {
    await prisma.conversation.create({
      data: {
        workspaceId,
        platform: "WEBSITE",
        participantName: name,
        participantHandle: email,
        messages: {
          create: {
            direction: "INBOUND",
            body: `Terminanfrage für ${termin.datum} um ${termin.uhrzeit} Uhr.${nachricht ? `\n\n${nachricht}` : ""}\n\n(Bestätigen im Betreiberbereich unter „Termine“.)`,
          },
        },
      },
    });
  }
  return NextResponse.json({ ok: true, meldung: "Danke — wir bestätigen den Termin in der Regel am selben Werktag." });
}
