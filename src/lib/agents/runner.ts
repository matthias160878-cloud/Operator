import { prisma } from "@/lib/db";
import { getAgentDefinition, type AgentKey } from "@/lib/agents/types";
import { reserveQuota } from "@/lib/entitlements";
import { currentTextProvider } from "@/lib/ai/textGenerator";
import type { Metric } from "@/lib/plans";

/**
 * Welche Kontingent-Kennzahl ein Agent-Lauf verbraucht. null = kein
 * KI-Anbieter-Aufruf (z. B. Veröffentlichen, Untertitel aus vorhandenem Text).
 * Der Nachrichten-Agent wird für Entwurf (KI) und Versand (keine KI) genutzt —
 * der Entwurf übergibt AI_TEXT ausdrücklich.
 */
const AGENT_METRIC: Partial<Record<AgentKey, Metric>> = {
  "content-brain": "AI_TEXT",
  idea: "IDEAS",
  trend: "AI_TEXT",
  research: "AI_TEXT",
  script: "AI_TEXT",
  hook: "AI_TEXT",
  hashtag: "AI_TEXT",
  thumbnail: "AI_TEXT",
  learning: "AI_TEXT",
  growth: "AI_TEXT",
  voice: "VOICEOVER",
  video: "VIDEO",
};

/** Nur echte Anbieter-Aufrufe kosten Kontingent; der gekennzeichnete Template-Modus nicht. */
function providerConfiguredFor(metric: Metric): boolean {
  if (metric === "VOICEOVER") return Boolean(process.env.ELEVENLABS_API_KEY);
  if (metric === "VIDEO") return true;
  return currentTextProvider() !== "template";
}

/**
 * Jeder Agent-Lauf wird in `agent_runs` protokolliert (Start, Ende, Status,
 * Ergebnis/Fehler) — sichtbar im Agent Monitor. Secrets landen nie im
 * geloggten Ergebnis oder Fehlertext.
 */
export async function runAgent<T>(
  key: AgentKey,
  workspaceId: string,
  task: string,
  fn: () => Promise<T>,
  quota?: Metric | null | { metric: Metric; amount: number }
): Promise<T> {
  const def = getAgentDefinition(key);
  // Mehrfach-Aufträge (z. B. mehrere Plattformen) verbrauchen je Einheit ein Kontingent.
  const metric = quota === undefined ? AGENT_METRIC[key] ?? null : quota && typeof quota === "object" ? quota.metric : quota;
  const amount = quota && typeof quota === "object" ? Math.max(1, quota.amount) : 1;
  // Paketberechtigung immer prüfen; Kontingent nur bei echtem Anbieter-Aufruf verbrauchen.
  let release: (() => Promise<void>) | null = null;
  if (metric) {
    const consume = providerConfiguredFor(metric);
    release = await reserveQuota(workspaceId, metric, consume ? amount : 0);
  }

  const run = await prisma.agentRun.create({
    data: {
      workspaceId,
      agentKey: key,
      agentName: def.name,
      task,
      status: "RUNNING",
    },
  });

  try {
    const result = await fn();
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        result: summarizeResult(result),
      },
    });
    return result;
  } catch (error) {
    // Fehlgeschlagene Anbieter-Aufrufe geben die Reservierung zurück.
    if (release) await release();
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "ERROR",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
    });
    throw error;
  }
}

function summarizeResult(result: unknown): string {
  try {
    const json = JSON.stringify(result);
    if (!json) return "";
    return json.length > 2000 ? `${json.slice(0, 2000)}…` : json;
  } catch {
    return String(result);
  }
}
