import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { route } from "@/lib/api";

const PLATFORM_VALUES = [
  "YOUTUBE",
  "TIKTOK",
  "INSTAGRAM",
  "LINKEDIN",
  "FACEBOOK",
  "BLOG",
  "NEWSLETTER",
] as const;

const createSchema = z.object({
  platform: z.enum(PLATFORM_VALUES).nullable().default(null),
  campaignId: z.string().nullable().default(null),
  type: z.enum(["AD_REVENUE", "SPONSORSHIP", "AFFILIATE", "DONATION", "OTHER"]).default("OTHER"),
  status: z.enum(["PENDING", "RECEIVED"]).default("RECEIVED"),
  source: z.string().default(""),
  amount: z.number(),
  currency: z.string().min(1).default("EUR"),
  note: z.string().default(""),
  recordedAt: z.string().optional(),
});

async function handleGET() {
  const workspaceId = await getCurrentWorkspaceId();
  const entries = await prisma.revenueEntry.findMany({
    where: { workspaceId },
    include: { campaign: { select: { title: true } } },
    orderBy: { recordedAt: "desc" },
  });
  return NextResponse.json({ entries });
}

async function handlePOST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }

  const { recordedAt, ...rest } = parsed.data;
  // Kampagnen-Bezug nur auf eigene Kampagnen — fremde IDs werden abgelehnt.
  if (rest.campaignId && !(await prisma.campaign.findFirst({ where: { id: rest.campaignId, workspaceId } }))) {
    return NextResponse.json({ error: "Kampagne nicht gefunden." }, { status: 404 });
  }

  const entry = await prisma.revenueEntry.create({
    data: {
      workspaceId,
      origin: "MANUAL",
      ...rest,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    },
  });

  return NextResponse.json({ entry });
}

export const GET = route(handleGET);
export const POST = route(handlePOST);
