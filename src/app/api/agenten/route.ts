import { NextResponse } from "next/server";
// Unverändert aus der Zentrale übernommen (src/lib/zentrale/README.md).
import { alleAgenten, oeffentlich as registerOeffentlich } from "@/lib/zentrale/agenten/register.js";

export const dynamic = "force-dynamic";

/**
 * Knappe Agenten-Übersicht für das Kern-Bild der Startseite (Zentrale):
 * Bereiche und Anzahl je Bereich aus der Registratur der Zentrale.
 * Öffentlich, gibt keine Konfiguration preis.
 */
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("knapp") !== "1") {
    return NextResponse.json({ meldung: "Nur die knappe Übersicht ist öffentlich." }, { status: 404 });
  }
  const gesetzt = (name: string) => Boolean(process.env[name]?.trim());
  const voll = registerOeffentlich(gesetzt, { daten: false });
  const jeKategorie: Record<string, number> = {};
  for (const a of voll.agenten) jeKategorie[a.kategorie] = (jeKategorie[a.kategorie] || 0) + 1;
  const alle = alleAgenten();
  return NextResponse.json(
    {
      fassung: voll.fassung,
      gesamt: voll.gesamt,
      gesamt_alle: alle.length,
      eingebaut: alle.filter((a: { quelle?: string }) => a.quelle === "eingebaut").length,
      kategorien: voll.kategorien.map((k: { schluessel: string; name: string }) => ({
        schluessel: k.schluessel,
        name: k.name,
        anzahl: jeKategorie[k.schluessel] || 0,
      })),
      modell_bereit: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
