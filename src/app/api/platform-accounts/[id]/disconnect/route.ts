import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { route } from "@/lib/api";

async function handlePOST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const account = await prisma.platformAccount.findUnique({ where: { id } });
  if (!account || account.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  await prisma.platformAccount.update({
    where: { id },
    data: {
      status: "NOT_CONFIGURED",
      accountName: "",
      externalAccountId: null,
      accessTokenEnc: null,
      refreshTokenEnc: null,
      tokenExpiresAt: null,
      lastError: null,
    },
  });

  return NextResponse.json({ ok: true });
}

export const POST = route(handlePOST);
