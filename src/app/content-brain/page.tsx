import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { currentTextProvider } from "@/lib/ai/textGenerator";
import { CampaignForm } from "@/components/content-brain/CampaignForm";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function ContentBrainPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId },
    include: { _count: { select: { contentItems: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Content Brain</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Eine Idee rein — ein vollständiger, plattformgerechter Content-Plan raus. Der
          ContentBrainAgent berücksichtigt deine Brand DNA und erzeugt für jede gewählte
          Plattform passende Hooks, Scripts, Hashtags und Thumbnail-Konzepte als Entwurf.
        </p>
      </div>

      <CampaignForm textProvider={currentTextProvider()} />

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Kampagnen</h2>
        <div className="space-y-2">
          {campaigns.length === 0 && (
            <p className="text-xs text-muted">Noch keine Kampagnen erstellt.</p>
          )}
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2"
            >
              <div>
                <div className="text-sm text-foreground">{c.title}</div>
                <div className="text-xs text-muted">
                  {c._count.contentItems} Content-Items · {c.targetAudience || "—"}
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
