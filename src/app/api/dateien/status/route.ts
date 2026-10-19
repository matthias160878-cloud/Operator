import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Verbindungsstatus für den Arbeitsbereich der Hauptseite: antwortet immer mit 200,
 * damit Besucher ohne Anmeldung keinen Fehler in der Konsole sehen. Gibt ohne Sitzung
 * nichts preis, mit Sitzung nur die Anzahl eigener Dateien und Links.
 */
export async function GET() {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ angemeldet: false }, { headers: { "cache-control": "no-store" } });
  const [dateien, links] = await Promise.all([
    prisma.kundenDatei.count({ where: { workspaceId: u.workspaceId } }),
    prisma.kundenLink.count({ where: { workspaceId: u.workspaceId } }),
  ]);
  return NextResponse.json({ angemeldet: true, dateien, links }, { headers: { "cache-control": "no-store" } });
}
