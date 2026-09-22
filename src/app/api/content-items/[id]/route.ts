import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  title: z.string().optional(),
  hook: z.string().optional(),
  script: z.string().optional(),
  caption: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  language: z.string().optional(),
  thumbnailIdea: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.contentItem.findUnique({
    where: { id },
    include: { scripts: true, mediaAssets: true, analytics: true },
  });
  if (!item) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  const { hashtags, keywords, ...rest } = parsed.data;
  const item = await prisma.contentItem.update({
    where: { id },
    data: {
      ...rest,
      ...(hashtags ? { hashtags: JSON.stringify(hashtags) } : {}),
      ...(keywords ? { keywords: JSON.stringify(keywords) } : {}),
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.contentItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
