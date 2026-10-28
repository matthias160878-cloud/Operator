import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Freie Termine für die Startseite (nur künftige, ohne Notizen). */
export async function GET() {
  const termine = await prisma.websiteAppointment.findMany({
    where: { status: "FREI", startsAt: { gt: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 50,
    select: { id: true, datum: true, uhrzeit: true },
  });
  return NextResponse.json({ termine }, { headers: { "cache-control": "no-store" } });
}
