import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { sellerProfileMissing, sellerProfileSchema } from "@/lib/connect/sellerProfile";
import { route } from "@/lib/api";

/** Eigene Anbieterangaben lesen/speichern — Workspace ausschließlich aus der Sitzung. */
async function handleGET() {
  const workspaceId = await getCurrentWorkspaceId();
  const profile = await prisma.sellerProfile.findUnique({ where: { workspaceId } });
  return NextResponse.json({ profile, missing: sellerProfileMissing(profile) });
}

async function handlePUT(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const parsed = sellerProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Angaben." }, { status: 400 });
  }
  const profile = await prisma.sellerProfile.upsert({
    where: { workspaceId },
    create: { workspaceId, ...parsed.data },
    update: parsed.data,
  });
  await prisma.auditLog.create({ data: { workspaceId, action: "seller.profile_updated", detail: "" } });
  return NextResponse.json({ profile, missing: sellerProfileMissing(profile) });
}

export const GET = route(handleGET);
export const PUT = route(handlePUT);
