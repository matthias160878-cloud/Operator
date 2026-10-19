import { z } from "zod";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { generateSocialPostsFromWebsite } from "@/lib/agents/websiteSocialAgent";
import { websitePostsSchema } from "@/lib/api/schemas";
import { apiError, apiJson, apiPreflight, authenticate, readJson } from "@/lib/api/publicApi";

export const maxDuration = 120;

const bodySchema = websitePostsSchema.extend({
  /** true: Beiträge zusätzlich als DRAFT-Content-Items speichern. */
  save: z.boolean().default(false),
});

export function OPTIONS(request: Request) {
  return apiPreflight(request);
}

/** Externe API: Social-Posts aus einer Website erzeugen (optional als Entwürfe speichern). */
export async function POST(request: Request) {
  const denied = authenticate(request);
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(request, 400, parsed.error.issues[0]?.message ?? "Ungültige Eingabe.");
  }
  const { instructions, ...rest } = parsed.data;

  try {
    const workspaceId = await getCurrentWorkspaceId();
    const result = await runAgent("website-social", workspaceId, `Social-Posts (API) aus ${rest.url}`, () =>
      generateSocialPostsFromWebsite({ workspaceId, ...rest, instructions: instructions || undefined })
    );
    return apiJson(request, result);
  } catch (error) {
    return apiError(request, 422, error instanceof Error ? error.message : "Generierung fehlgeschlagen.");
  }
}
