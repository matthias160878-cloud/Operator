import { NextResponse } from "next/server";
import { withKunde, jsonBody, dateiAntwort } from "@/lib/dateien/http";
import { aendern, inhaltLaden, loeschen } from "@/lib/dateien/service";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ id: string }> };

/** Download (?ansehen=1: Ansicht im Browser für PDF, Bilder, Text). */
export async function GET(req: Request, { params }: P) {
  return withKunde(async (u) => {
    const { id } = await params;
    const { datei, daten } = await inhaltLaden(u.workspaceId, id);
    return dateiAntwort(datei.name, daten, new URL(req.url).searchParams.get("ansehen") === "1");
  });
}

/** Umbenennen oder in einen anderen Ordner verschieben. */
export async function PATCH(req: Request, { params }: P) {
  return withKunde(async (u) => {
    const { id } = await params;
    return NextResponse.json({ datei: await aendern(u.workspaceId, u.userId, id, await jsonBody(req)) });
  });
}

export async function DELETE(_req: Request, { params }: P) {
  return withKunde(async (u) => {
    const { id } = await params;
    await loeschen(u.workspaceId, u.userId, id);
    return NextResponse.json({ ok: true });
  });
}
