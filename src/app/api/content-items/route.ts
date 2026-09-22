import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";

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
  title: z.string().min(1),
  platform: z.enum(PLATFORM_VALUES),
  format: z.string().default(""),
  hook: z.string().default(""),
  script: z.string().default(""),
  caption: z.string().default(""),
  language: z.string().default("Deutsch"),
});

export async function GET(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const platform = searchParams.get("platform");

  const items = await prisma.contentItem.findMany({
    where: {
      workspaceId,
      ...(status ? { status: status as never } : {}),
      ...(platform ? { platform: platform as never } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }
  const item = await prisma.contentItem.create({
    data: { workspaceId, status: "DRAFT", ...parsed.data },
  });
  return NextResponse.json({ item });
}
