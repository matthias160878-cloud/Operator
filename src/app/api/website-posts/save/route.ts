import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { getBrandDNA } from "@/lib/brand";
import { saveWebsitePosts } from "@/lib/agents/websiteSocialAgent";
import { PLATFORM_VALUES } from "@/lib/api/schemas";

const bodySchema = z.object({
  sourceTitle: z.string().max(300).default(""),
  posts: z
    .array(
      z.object({
        platform: z.enum(PLATFORM_VALUES),
        hook: z.string().max(500).default(""),
        caption: z.string().min(1).max(20000),
        hashtags: z.array(z.string().max(100)).max(30).default([]),
        cta: z.string().max(500).default(""),
      })
    )
    .min(1, "Keine Posts ausgewählt.")
    .max(30),
});

/** Speichert ausgewählte (ggf. bearbeitete) Website-Posts als Entwürfe in der Content Factory. */
export async function POST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }
  const brand = await getBrandDNA(workspaceId);
  const ids = await saveWebsitePosts({
    workspaceId,
    posts: parsed.data.posts,
    fallbackTitle: parsed.data.sourceTitle || "Post aus Website",
    language: brand?.language,
  });
  return NextResponse.json({ ids });
}
