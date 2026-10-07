import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { route } from "@/lib/api";

/**
 * Datenexport des eigenen Arbeitsbereichs (Art. 20 DSGVO, technische Grundlage).
 * Ausgenommen: Passwort-Hashes, Sitzungen und verschlüsselte Plattform-Token.
 */
async function handleGET() {
  const user = await requireSessionUser();
  const workspaceId = user.workspaceId;
  const [workspace, users, brand, campaigns, ideas, items, voices, media, revenue, conversations, sales, products, websites, plan, usage, audit, sellerProfile] =
    await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspaceId }, select: { id: true, name: true, slug: true, createdAt: true } }),
      prisma.user.findMany({ where: { workspaceId }, select: { id: true, email: true, name: true, role: true, createdAt: true } }),
      prisma.brand.findUnique({ where: { workspaceId } }),
      prisma.campaign.findMany({ where: { workspaceId } }),
      prisma.contentIdea.findMany({ where: { workspaceId } }),
      prisma.contentItem.findMany({ where: { workspaceId }, include: { scripts: true } }),
      prisma.voice.findMany({ where: { workspaceId } }),
      prisma.mediaAsset.findMany({ where: { workspaceId } }),
      prisma.revenueEntry.findMany({ where: { workspaceId } }),
      prisma.conversation.findMany({ where: { workspaceId }, include: { messages: true } }),
      prisma.customerSale.findMany({ where: { workspaceId } }),
      prisma.merchantProduct.findMany({ where: { workspaceId } }),
      prisma.websiteConnection.findMany({ where: { workspaceId }, select: { origin: true, verifiedAt: true, revokedAt: true, createdAt: true } }),
      prisma.workspacePlan.findUnique({ where: { workspaceId }, select: { plan: true, status: true, billingMode: true, activatedAt: true, currentPeriodEnd: true } }),
      prisma.usageCounter.findMany({ where: { workspaceId }, select: { metric: true, period: true, used: true } }),
      prisma.auditLog.findMany({ where: { workspaceId }, select: { action: true, detail: true, createdAt: true } }),
      prisma.sellerProfile.findUnique({ where: { workspaceId } }),
    ]);
  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), workspace, users, brand, campaigns, ideas, contentItems: items, voices, mediaAssets: media, revenueEntries: revenue, conversations, customerSales: sales, merchantProducts: products, websites, plan, usage, auditLog: audit, sellerProfile },
    null,
    2
  );
  await prisma.auditLog.create({ data: { workspaceId, userId: user.userId, action: "account.export", detail: "" } });
  return new NextResponse(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="secret58-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}

export const GET = route(handleGET);
