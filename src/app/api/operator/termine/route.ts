import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { validDatum, validUhrzeit, zonedToUtc } from "@/lib/websiteAppointments";

const schema = z.object({
  datum: z.string().trim(),
  uhrzeit: z.string().trim(),
  notiz: z.string().trim().max(300).optional().default(""),
});

/** Betreiber legt einen freien Termin an (Ortszeit). */
async function handlePOST(request: Request) {
  const user = await requireSessionUser();
  if (!user.isOperator) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !validDatum(parsed.data.datum) || !validUhrzeit(parsed.data.uhrzeit)) {
    return NextResponse.json({ error: "Bitte Datum (JJJJ-MM-TT) und Uhrzeit (HH:MM) angeben." }, { status: 400 });
  }
  const startsAt = zonedToUtc(parsed.data.datum, parsed.data.uhrzeit);
  if (startsAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "Der Termin liegt in der Vergangenheit." }, { status: 400 });
  }
  const termin = await prisma.websiteAppointment.create({ data: { ...parsed.data, startsAt } });
  return NextResponse.json({ termin });
}

export const POST = route(handlePOST);
