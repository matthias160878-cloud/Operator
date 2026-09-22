import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getBrandDNA } from "@/lib/brand";
import { runAgent } from "@/lib/agents/runner";
import { generateScript } from "@/lib/agents/scriptAgent";

const VARIANT_LABELS = ["A", "B", "C", "D", "E", "F"];

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const workspaceId = await getCurrentWorkspaceId();
  const item = await prisma.contentItem.findUnique({
    where: { id },
    include: { scripts: true },
  });
  if (!item) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const brand = await getBrandDNA(workspaceId);

  const { script } = await runAgent("script", workspaceId, `Script-Variante für "${item.title}"`, () =>
    generateScript({ topic: item.title, platform: item.platform, brand })
  );

  const label = VARIANT_LABELS[item.scripts.length] ?? `V${item.scripts.length + 1}`;

  const variant = await prisma.script.create({
    data: { contentItemId: id, variantLabel: label, ...script },
  });

  return NextResponse.json({ script: variant });
}
