import { prisma } from "@/lib/db";
import { getAgentDefinition, type AgentKey } from "@/lib/agents/types";

/**
 * Jeder Agent-Lauf wird in `agent_runs` protokolliert (Start, Ende, Status,
 * Ergebnis/Fehler) — sichtbar im Agent Monitor. Secrets landen nie im
 * geloggten Ergebnis oder Fehlertext.
 */
export async function runAgent<T>(
  key: AgentKey,
  workspaceId: string,
  task: string,
  fn: () => Promise<T>
): Promise<T> {
  const def = getAgentDefinition(key);

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
