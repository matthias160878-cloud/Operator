import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getDefaultWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const workspace = await getDefaultWorkspace();
  const [users, counts] = await Promise.all([
    prisma.user.findMany({ where: { workspaceId: workspace.id } }),
    Promise.all([
      prisma.contentItem.count({ where: { workspaceId: workspace.id } }),
      prisma.campaign.count({ where: { workspaceId: workspace.id } }),
      prisma.mediaAsset.count({ where: { workspaceId: workspace.id } }),
      prisma.agentRun.count({ where: { workspaceId: workspace.id } }),
    ]),
  ]);

  const [contentItems, campaigns, mediaAssets, agentRuns] = counts;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t.rich("description", { code: (chunks) => <code>{chunks}</code> })}
        </p>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("workspace.title")}</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">{t("workspace.name")}</dt>
            <dd className="text-foreground">{workspace.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("workspace.slug")}</dt>
            <dd className="text-foreground">{workspace.slug}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("workspace.createdAt")}</dt>
            <dd className="text-foreground">
              {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(workspace.createdAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("users.title")}</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
              <div>
                <div className="text-foreground">{u.name}</div>
                <div className="text-xs text-muted">{u.email}</div>
              </div>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-accent-2">{u.role}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">{t("users.note")}</p>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("system.title")}</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">{t("system.contentItems")}</dt>
            <dd className="text-foreground">{contentItems}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("system.campaigns")}</dt>
            <dd className="text-foreground">{campaigns}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("system.mediaAssets")}</dt>
            <dd className="text-foreground">{mediaAssets}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("system.agentRuns")}</dt>
            <dd className="text-foreground">{agentRuns}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          {t.rich("system.dbNote", {
            code: (chunks) => <code>{chunks}</code>,
            codeSpaced: (chunks) => <code className="mx-1">{chunks}</code>,
          })}
        </p>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("onboarding.title")}</h2>
        <p className="text-sm text-muted">{t("onboarding.description")}</p>
        <Link
          href="/?einrichtung=1"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-surface-2"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent-2" />
          {t("onboarding.reopen")}
        </Link>
      </div>
    </div>
  );
}
