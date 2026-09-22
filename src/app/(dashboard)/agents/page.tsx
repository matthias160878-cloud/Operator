import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { AGENTS } from "@/lib/agents/types";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const t = await getTranslations("agents");
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
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("description")}</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-4 py-3 font-medium">{t("table.agent")}</th>
              <th className="px-4 py-3 font-medium">{t("table.description")}</th>
              <th className="px-4 py-3 font-medium">{t("table.status")}</th>
              <th className="px-4 py-3 font-medium">{t("table.lastTask")}</th>
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
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("history.title")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-3 py-2 font-medium">{t("history.agent")}</th>
                <th className="px-3 py-2 font-medium">{t("history.task")}</th>
                <th className="px-3 py-2 font-medium">{t("history.status")}</th>
                <th className="px-3 py-2 font-medium">{t("history.start")}</th>
                <th className="px-3 py-2 font-medium">{t("history.end")}</th>
                <th className="px-3 py-2 font-medium">{t("history.resultError")}</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-xs text-muted">
                    {t("history.empty")}
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
                      <span className="text-muted">{run.result ? t("history.completed") : "—"}</span>
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
