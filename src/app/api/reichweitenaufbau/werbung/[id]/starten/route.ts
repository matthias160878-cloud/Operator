import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NotFoundError, route } from "@/lib/api";
import { freigeberOderAntwort } from "@/lib/reichweite/zugriff";

/**
 * Bezahlte Kampagnen werden aus dieser App nicht gestartet: Es gibt keine
 * Werbe-Schnittstelle, und in der Vorschau sind echte Ausgaben ausgeschlossen.
 */
async function handlePOST(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await freigeberOderAntwort();
  if (user instanceof Response) return user;
  const { id } = await params;
  if (!(await prisma.werbeplan.findFirst({ where: { id, workspaceId: user.workspaceId } }))) throw new NotFoundError();
  return NextResponse.json(
    { error: "Nicht gestartet: Keine Werbe-Schnittstelle angebunden, und in der Vorschau werden keine bezahlten Kampagnen gestartet. Bitte den Entwurf exportieren." },
    { status: 409 }
  );
}

export const POST = route(handlePOST);
