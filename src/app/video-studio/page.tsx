import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { VIDEO_FORMATS } from "@/lib/video/formats";
import { VIDEO_PROVIDERS } from "@/lib/video/provider";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function VideoStudioPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const videos = await prisma.mediaAsset.findMany({
    where: { workspaceId, type: "VIDEO" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Video Studio</h1>
        <p className="mt-1 text-sm text-muted">
          Provider-agnostische Video-Pipeline: Format Manager, austauschbare Video-Provider,
          Voiceover- und Untertitel-Anbindung (siehe Content Factory je Content-Item).
        </p>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Video-Provider</h3>
        <div className="space-y-2">
          {VIDEO_PROVIDERS.map((p) => (
            <div key={p.key} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
              <span className="text-sm text-foreground">{p.name}</span>
              <StatusBadge status={p.isConfigured() ? "CONNECTED" : "NOT_CONFIGURED"} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Weitere Provider (AI-Video-APIs, Stock-Video-Bibliotheken) lassen sich über dieselbe
          <code className="mx-1 rounded bg-surface-2 px-1">VideoProvider</code>
          -Schnittstelle ergänzen, ohne bestehenden Code anzufassen.
        </p>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Format Manager</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VIDEO_FORMATS.map((f) => (
            <div key={f.key} className="rounded-lg border border-border bg-surface-2 p-3">
              <div className="text-sm font-medium text-foreground">{f.ratio}</div>
              <div className="text-xs text-muted">
                {f.width}×{f.height}px
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {f.platforms.map((p) => (
                  <span key={p} className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Video-Assets</h3>
        {videos.length === 0 ? (
          <p className="text-xs text-muted">
            Noch keine Videos gerendert — Rendering läuft über Content-Items in der Content
            Factory, sobald ein Video-Provider konfiguriert ist.
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-foreground">
            {videos.map((v) => (
              <li key={v.id}>{v.url}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
