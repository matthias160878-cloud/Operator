import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { IdeaBoard } from "@/components/ideas/IdeaBoard";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const workspaceId = await getCurrentWorkspaceId();
  const ideas = await prisma.contentIdea.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Ideen & Inspiration</h1>
        <p className="mt-1 text-sm text-muted">
          Themencluster, Serien und Formate für kommenden Content — generiert vom IdeaAgent
          oder manuell erfasst.
        </p>
      </div>
      <IdeaBoard ideas={ideas} />
    </div>
  );
}
