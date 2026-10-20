import { NextResponse } from "next/server";
import { withBetreiber, formDatei } from "@/lib/dateien/http";
import { betreiberAblegen, betreiberDateien, betreiberKonten, maxDateiBytes } from "@/lib/dateien/service";

export const dynamic = "force-dynamic";

/** Ohne Parameter: Kundenkonten mit Zählern. Mit ?konto=<id>: sichtbare Dateien dieses Kontos. */
export async function GET(req: Request) {
  return withBetreiber(async () => {
    const konto = new URL(req.url).searchParams.get("konto");
    if (!konto) return NextResponse.json({ konten: await betreiberKonten() });
    return NextResponse.json({ dateien: await betreiberDateien(konto) });
  });
}

/** Datei für einen Kunden ablegen (multipart: datei, konto) → Ordner „Von SECRET 58“. */
export async function POST(req: Request) {
  return withBetreiber(async (u) => {
    const f = await formDatei(req, maxDateiBytes());
    const datei = await betreiberAblegen(f.feld("konto"), u.userId, f.name, f.daten, f.mime);
    return NextResponse.json({ datei });
  });
}
