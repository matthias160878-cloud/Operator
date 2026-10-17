import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { operatorWorkspaceId } from "@/lib/operatorWorkspace";

/**
 * Kontaktformular der Startseite (Zentrale). Öffentlich. Die Anfrage landet
 * als Konversation „Webseite (Kontaktformular)“ im Posteingang des
 * Betreiber-Arbeitsbereichs (SECRET58_OPERATOR_WORKSPACE_ID, sonst der
 * Arbeitsbereich des ersten Betreiberkontos). Es wird keine E-Mail versendet.
 */
const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().max(200).email(),
  nachricht: z.string().trim().min(1).max(5000),
  kampagne: z.string().trim().max(100).optional().default(""),
});

export async function POST(request: Request) {
  if (!(await hitRateLimit(`kontakt:${clientIp(request)}`, 5, 3600))) {
    return NextResponse.json({ meldung: "Zu viele Nachrichten in kurzer Zeit. Bitte später erneut versuchen." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ meldung: "Bitte Name, eine gültige E-Mail-Adresse und Ihre Nachricht angeben." }, { status: 400 });
  }
  const workspaceId = await operatorWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json(
      { meldung: "Das Formular ist gerade nicht erreichbar. Bitte schreiben Sie an info@secret58.com." },
      { status: 503 }
    );
  }
  const { name, email, nachricht, kampagne } = parsed.data;
  await prisma.conversation.create({
    data: {
      workspaceId,
      platform: "WEBSITE",
      participantName: name,
      participantHandle: email,
      messages: { create: { direction: "INBOUND", body: kampagne ? `${nachricht}\n\n(Kampagne: ${kampagne})` : nachricht } },
    },
  });
  return NextResponse.json({ meldung: "Danke, Ihre Nachricht ist angekommen. Wir melden uns per E-Mail." });
}
