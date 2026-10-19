import { NextResponse } from "next/server";
import { withKunde, formDatei } from "@/lib/dateien/http";
import { ablegen, maxDateiBytes, ORDNER, uebersicht } from "@/lib/dateien/service";

export const dynamic = "force-dynamic";

/** Übersicht des eigenen Kontos: Dateien (ohne Inhalt), Ordner, Links, aktive Freigaben, Speicher. */
export async function GET() {
  return withKunde(async (u) => NextResponse.json(await uebersicht(u.workspaceId)));
}

/** Upload einer Datei (multipart: datei, ordner). */
export async function POST(req: Request) {
  return withKunde(async (u) => {
    const f = await formDatei(req, maxDateiBytes());
    const datei = await ablegen(u.workspaceId, {
      name: f.name,
      daten: f.daten,
      mime: f.mime,
      ordner: f.feld("ordner") || ORDNER.eigene,
      quelle: "KUNDE",
      quelleName: u.name || u.email,
      userId: u.userId,
    });
    return NextResponse.json({ datei });
  });
}
