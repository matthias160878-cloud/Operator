import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { embedPresent } from "@/lib/website";
import { NotFoundError, route } from "@/lib/api";

/** Verbindungstest: Ist die Domain bestätigt und steht der Einbindungscode auf der Startseite? */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  if (!(await hitRateLimit(`embedtest:${workspaceId}:${clientIp(request)}`, 20, 3600))) {
    return NextResponse.json({ error: "Zu viele Tests. Bitte später erneut." }, { status: 429 });
  }
  const site = await prisma.websiteConnection.findFirst({ where: { id, workspaceId, revokedAt: null } });
  if (!site) throw new NotFoundError();
  const present = await embedPresent(site.origin, site.publicKey);
  return NextResponse.json({ verified: Boolean(site.verifiedAt), embedFound: present });
}

export const POST = route(handlePOST);
