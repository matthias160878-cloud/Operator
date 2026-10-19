import { getCurrentWorkspaceId } from "@/lib/workspace";
import { runAgent } from "@/lib/agents/runner";
import { analyzeWebsite } from "@/lib/agents/seoAgent";
import { seoAnalyzeSchema } from "@/lib/api/schemas";
import { apiError, apiJson, apiPreflight, authenticate, readJson } from "@/lib/api/publicApi";

export const maxDuration = 120;

export function OPTIONS(request: Request) {
  return apiPreflight(request);
}

/** Externe API: SEO-/Performance-Analyse einer URL. Auth per API-Schlüssel. */
export async function POST(request: Request) {
  const denied = authenticate(request);
  if (denied) return denied;

  const parsed = seoAnalyzeSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(request, 400, parsed.error.issues[0]?.message ?? "Ungültige Eingabe.");
  }
  const { focusKeyword, ...rest } = parsed.data;

  try {
    const workspaceId = await getCurrentWorkspaceId();
    const report = await runAgent("seo", workspaceId, `SEO-Analyse (API) ${rest.url}`, () =>
      analyzeWebsite({ ...rest, focusKeyword: focusKeyword || undefined })
    );
    return apiJson(request, { report });
  } catch (error) {
    return apiError(request, 422, error instanceof Error ? error.message : "Analyse fehlgeschlagen.");
  }
}
