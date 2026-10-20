import { NextResponse } from "next/server";
import { withBetreiber, dateiAntwort } from "@/lib/dateien/http";
import { betreiberInhalt, betreiberLoeschen } from "@/lib/dateien/service";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ id: string }> };

/** Nur Dateien „An SECRET 58“ und eigene Ablagen „Von SECRET 58“ sind abrufbar. */
export async function GET(_req: Request, { params }: P) {
  return withBetreiber(async () => {
    const { id } = await params;
    const { datei, daten } = await betreiberInhalt(id);
    return dateiAntwort(datei.name, daten, false);
  });
}

export async function DELETE(_req: Request, { params }: P) {
  return withBetreiber(async (u) => {
    const { id } = await params;
    await betreiberLoeschen(u.userId, id);
    return NextResponse.json({ ok: true });
  });
}
