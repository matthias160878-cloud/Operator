import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { istGueltigerCode } from "@/lib/reichweite/codes";
import { kuerzen } from "@/lib/reichweite/texte";
import { ereignisSpeichern, ipSchluessel, oeffentlicherLink } from "@/lib/reichweite/service";

const schema = z.object({
  name: z.string().max(120).default(""),
  kontakt: z.string().min(3).max(200),
  nachricht: z.string().min(3).max(3000),
  einwilligung: z.literal(true),
  website: z.string().max(0).optional(), // Honigtopf-Feld, muss leer bleiben
});

/**
 * Öffentlich: Anfrage über die Empfehlungsseite. Landet als Kundenanfrage im
 * Workspace der Kampagne (Kanal „empfehlung“). Kein automatischer Versand.
 */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!istGueltigerCode(code)) return NextResponse.json({ error: "Link nicht gefunden." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte Kontakt, Nachricht und die Einwilligung angeben." }, { status: 400 });
  }
  if (!(await hitRateLimit(ipSchluessel("empf-anfrage", clientIp(request)), 5, 3600))) {
    return NextResponse.json({ error: "Zu viele Anfragen in kurzer Zeit. Bitte später erneut versuchen." }, { status: 429 });
  }
  const link = await oeffentlicherLink(code);
  if (!link || !link.aktiv) return NextResponse.json({ error: "Dieser Link ist nicht mehr aktiv." }, { status: 404 });
  if (!link.freigeschaltet) return NextResponse.json({ error: "Diese Seite ist noch nicht freigeschaltet." }, { status: 403 });
  if (!(await hitRateLimit(`empf-anfrage-link:${link.id}`, 30, 3600))) {
    return NextResponse.json({ error: "Zu viele Anfragen in kurzer Zeit. Bitte später erneut versuchen." }, { status: 429 });
  }
  await prisma.pilotInquiry.create({
    data: {
      workspaceId: link.workspaceId,
      isDemo: link.istDemo,
      channel: "empfehlung",
      subject: kuerzen(`Anfrage über Empfehlungslink: ${link.kampagne.titel}`, 200),
      body: kuerzen(parsed.data.nachricht, 3000),
      senderName: kuerzen(parsed.data.name, 120),
      senderContact: kuerzen(parsed.data.kontakt, 200),
    },
  });
  await ereignisSpeichern(link, "ANFRAGE");
  return NextResponse.json({ ok: true });
}
