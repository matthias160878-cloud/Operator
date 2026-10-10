import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";

const schema = z.object({ action: z.enum(["bestaetigen", "freigeben", "loeschen"]) });

/** Betreiber: Anfrage bestätigen, Termin wieder freigeben oder löschen. */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser();
  if (!user.isOperator) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
  const termin = await prisma.websiteAppointment.findUnique({ where: { id } });
  if (!termin) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  switch (parsed.data.action) {
    case "bestaetigen":
      if (termin.status !== "ANGEFRAGT") return NextResponse.json({ error: "Nur angefragte Termine lassen sich bestätigen." }, { status: 409 });
      await prisma.websiteAppointment.update({ where: { id }, data: { status: "BESTAETIGT" } });
      break;
    case "freigeben":
      await prisma.websiteAppointment.update({
        where: { id },
        data: { status: "FREI", kundeName: null, kundeEmail: null, kundeNachricht: "", angefragtAm: null },
      });
      break;
    case "loeschen":
      await prisma.websiteAppointment.delete({ where: { id } });
      break;
  }
  return NextResponse.json({ ok: true });
}

export const POST = route(handlePOST);
