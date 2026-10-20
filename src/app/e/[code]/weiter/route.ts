import { NextResponse } from "next/server";
import { istGueltigerCode } from "@/lib/reichweite/codes";
import { ereignisSpeichern, istZaehlbarerAufruf, oeffentlicherLink } from "@/lib/reichweite/service";

/** Zählt einen Klick zur Zielseite (ohne Personenbezug) und leitet weiter. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const link = istGueltigerCode(code) ? await oeffentlicherLink(code) : null;
  const zurueck = new URL(`/e/${istGueltigerCode(code) ? code : ""}`, request.url);
  const ziel = link?.angebotUrl || link?.kampagne.zielUrl;
  if (!link || !link.aktiv || !link.freigeschaltet || !ziel) return NextResponse.redirect(zurueck, 303);
  if (istZaehlbarerAufruf(request.headers)) await ereignisSpeichern(link, "ZIEL_KLICK");
  const res = NextResponse.redirect(ziel, 303);
  res.headers.set("referrer-policy", "no-referrer");
  res.headers.set("x-robots-tag", "noindex");
  return res;
}
