import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { clientIp, hitRateLimit } from "@/lib/rateLimit";
import { VERIFY_PATH, verifyDomain } from "@/lib/website";
import { NotFoundError, route } from "@/lib/api";

async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  if (!(await hitRateLimit(`verify:${workspaceId}:${clientIp(request)}`, 20, 3600))) {
    return NextResponse.json({ error: "Zu viele Prüfungen. Bitte später erneut." }, { status: 429 });
  }
  const site = await prisma.websiteConnection.findFirst({ where: { id, workspaceId, revokedAt: null } });
  if (!site) throw new NotFoundError();
  const ok = await verifyDomain(site.origin, site.verifyToken);
  if (!ok) {
    return NextResponse.json(
      { verified: false, error: `Datei ${site.origin}${VERIFY_PATH} nicht gefunden oder Inhalt passt nicht.` },
      { status: 422 }
    );
  }
  await prisma.websiteConnection.update({ where: { id }, data: { verifiedAt: new Date() } });
  await prisma.auditLog.create({ data: { workspaceId, action: "website.verified", detail: site.origin } });
  return NextResponse.json({ verified: true });
}

export const POST = route(handlePOST);
