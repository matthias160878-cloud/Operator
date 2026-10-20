import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { requireSessionUser } from "@/lib/auth/session";
import { erzeugeVorschlaege, pruefeBriefing, type Briefing } from "@/lib/reichweitenaufbau/ideen";
import { kuerzen } from "@/lib/reichweite/texte";

/** Erzeugt Vorlagen aus dem Briefing. Speichert nichts. */
async function handlePOST(request: Request) {
  await requireSessionUser();
  const b = (await request.json().catch(() => ({}))) as Partial<Briefing>;
  const fehler = pruefeBriefing(b);
  if (fehler) return NextResponse.json({ error: fehler }, { status: 400 });
  const briefing: Briefing = {
    zielgruppe: kuerzen(b.zielgruppe, 200),
    problem: kuerzen(b.problem, 300),
    ergebnis: kuerzen(b.ergebnis, 300),
    plattform: b.plattform!,
    format: kuerzen(b.format, 80),
    tonalitaet: b.tonalitaet!,
    material: kuerzen(b.material, 500),
    aufforderung: b.aufforderung!,
    grundlageVorherNachher: kuerzen(b.grundlageVorherNachher, 500),
  };
  return NextResponse.json({ vorschlaege: erzeugeVorschlaege(briefing) });
}

export const POST = route(handlePOST);
