import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appOrigin } from "@/lib/composio/origin";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { istGueltigerCode } from "@/lib/reichweite/codes";
import { empfehlungsUrl } from "@/lib/reichweite/teilen";
import { MAX_STUFE, eindeutigerCode, ereignisSpeichern, ipSchluessel, oeffentlicherLink } from "@/lib/reichweite/service";

/**
 * Öffentlich: Eine Person erzeugt ausdrücklich ihren eigenen Empfehlungslink
 * aus dem Link, über den sie gekommen ist (nächste Stufe). Es werden keine
 * Angaben zur Person gespeichert.
 */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!istGueltigerCode(code)) return NextResponse.json({ error: "Link nicht gefunden." }, { status: 404 });
  if (!(await hitRateLimit(ipSchluessel("empf-link", clientIp(request)), 10, 3600))) {
    return NextResponse.json({ error: "Zu viele Links in kurzer Zeit. Bitte später erneut versuchen." }, { status: 429 });
  }
  const eltern = await oeffentlicherLink(code);
  if (!eltern || !eltern.aktiv) return NextResponse.json({ error: "Dieser Link ist nicht mehr aktiv." }, { status: 404 });
  if (eltern.stufe >= MAX_STUFE) {
    return NextResponse.json({ error: "Aus diesem Link kann kein weiterer eigener Link erzeugt werden. Du kannst ihn aber einfach weitergeben." }, { status: 409 });
  }
  const kind = await prisma.empfehlungsLink.create({
    data: {
      workspaceId: eltern.workspaceId,
      kampagneId: eltern.kampagneId,
      parentId: eltern.id,
      stufe: eltern.stufe + 1,
      herkunft: "BESUCHER",
      istDemo: eltern.istDemo,
      code: await eindeutigerCode(),
    },
  });
  await ereignisSpeichern(eltern, "LINK_ERZEUGT");
  return NextResponse.json({ code: kind.code, url: empfehlungsUrl(appOrigin(request), kind.code), stufe: kind.stufe });
}
