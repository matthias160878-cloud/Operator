import { NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { generateSocialPostsFromWebsite } from "@/lib/agents/websiteSocialAgent";
import { websitePostsSchema } from "@/lib/api/schemas";

const bodySchema = websitePostsSchema;

export const maxDuration = 120;

/** Erzeugt Social-Posts aus einer Website (WebsiteSocialAgent), ohne sie zu speichern. */
export async function POST(request: Request) {
  const workspaceId = await getCurrentWorkspaceId();
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }
  const { instructions, ...rest } = parsed.data;

  try {
    const result = await runAgent("website-social", workspaceId, `Social-Posts aus ${rest.url}`, () =>
      generateSocialPostsFromWebsite({ workspaceId, ...rest, instructions: instructions || undefined, save: false })
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generierung fehlgeschlagen." },
      { status: 422 }
    );
  }
}
