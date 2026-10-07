import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getUsage } from "@/lib/entitlements";
import { route } from "@/lib/api";

/** Tatsächlicher Aktivierungsstatus — so, wie ihn der Webhook gesetzt hat. */
async function handleGET(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const checkoutId = new URL(request.url).searchParams.get("checkout");
  const [plan, checkout, usage] = await Promise.all([
    prisma.workspacePlan.findUnique({ where: { workspaceId } }),
    checkoutId ? prisma.planCheckout.findFirst({ where: { id: checkoutId, workspaceId } }) : null,
    getUsage(workspaceId),
  ]);
  return NextResponse.json({
    plan: plan ? { plan: plan.plan, status: plan.status, billingMode: plan.billingMode, currentPeriodEnd: plan.currentPeriodEnd, cancelAtPeriodEnd: plan.cancelAtPeriodEnd } : null,
    checkout: checkout ? { status: checkout.status, plan: checkout.plan } : null,
    usage,
  });
}

export const GET = route(handleGET);
