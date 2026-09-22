import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getBrandDNA } from "@/lib/brand";
import { runAgent } from "@/lib/agents/runner";
import { generateThumbnailConcept } from "@/lib/agents/thumbnailAgent";

const bodySchema = z.object({ topic: z.string().min(3) });

export async function POST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  const brand = await getBrandDNA(workspaceId);
  const result = await runAgent("thumbnail", workspaceId, `Thumbnail-Konzept für "${parsed.data.topic}"`, () =>
    generateThumbnailConcept({ topic: parsed.data.topic, brand })
  );

  return NextResponse.json(result);
}
