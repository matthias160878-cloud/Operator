import { prisma } from "@/lib/db";
import { getDefaultWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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
        <h1 className="text-xl font-semibold text-foreground">Einstellungen</h1>
        <p className="mt-1 text-sm text-muted">
          Workspace, Nutzer und Systeminformationen. Zugangsdaten werden ausschließlich über
          Environment-Variablen verwaltet (siehe <code>.env.example</code>).
        </p>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Workspace</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">Name</dt>
            <dd className="text-foreground">{workspace.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Slug</dt>
            <dd className="text-foreground">{workspace.slug}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Erstellt am</dt>
            <dd className="text-foreground">
              {new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(workspace.createdAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Nutzer & Rollen</h2>
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
        <p className="mt-3 text-xs text-muted">
          Multi-Tenant-Datenmodell ist vollständig vorbereitet (Workspace-Isolation für alle
          Tabellen). Eine echte Login-/Auth-Oberfläche mit mehreren Nutzern ist der nächste
          Ausbauschritt — aktuell arbeitet die App mit genau diesem Default-Workspace.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">System</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted">Content-Items</dt>
            <dd className="text-foreground">{contentItems}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Kampagnen</dt>
            <dd className="text-foreground">{campaigns}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Medien-Assets</dt>
            <dd className="text-foreground">{mediaAssets}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Agent-Läufe</dt>
            <dd className="text-foreground">{agentRuns}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          Datenbank: SQLite (lokal, <code>prisma/dev.db</code>) über Prisma ORM. Für Produktion
          <code className="mx-1">DATABASE_URL</code> auf Postgres/MySQL umstellen (Provider in
          <code className="mx-1">prisma/schema.prisma</code> anpassen).
        </p>
      </div>
    </div>
  );
}
