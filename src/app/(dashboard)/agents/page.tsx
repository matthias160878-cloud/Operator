import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { AGENTS } from "@/lib/agents/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const runs = await prisma.agentRun.findMany({
    where: { workspaceId },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  const latestByAgent = new Map<string, (typeof runs)[number]>();
  for (const run of runs) {
    if (!latestByAgent.has(run.agentKey)) latestByAgent.set(run.agentKey, run);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Agent Monitor</h1>
        <p className="mt-1 text-sm text-muted">
          Alle SECRET-58-Agenten mit Status, letzter Aufgabe und Ergebnis. Jeder Lauf wird
          protokolliert.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Beschreibung</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Letzte Aufgabe</th>
            </tr>
          </thead>
          <tbody>
            {AGENTS.map((agent) => {
              const run = latestByAgent.get(agent.key);
              return (
                <tr key={agent.key} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 text-foreground">{agent.name}</td>
                  <td className="px-4 py-3 text-muted">{agent.description}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={run?.status ?? "IDLE"} />
                  </td>
                  <td className="px-4 py-3 text-muted">{run?.task ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Lauf-Historie</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-3 py-2 font-medium">Agent</th>
                <th className="px-3 py-2 font-medium">Task</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Start</th>
                <th className="px-3 py-2 font-medium">Ende</th>
                <th className="px-3 py-2 font-medium">Ergebnis / Fehler</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-xs text-muted">
                    Noch keine Agent-Läufe.
                  </td>
                </tr>
              )}
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-border/40 last:border-0 align-top">
                  <td className="px-3 py-2 text-foreground">{run.agentName}</td>
                  <td className="px-3 py-2 text-muted">{run.task}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "medium" }).format(run.startedAt)}
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {run.finishedAt
                      ? new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "medium" }).format(run.finishedAt)
                      : "—"}
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 text-xs">
                    {run.error ? (
                      <span className="text-danger">{run.error}</span>
                    ) : (
                      <span className="text-muted">{run.result ? "Abgeschlossen" : "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
