import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { getCurrentWorkspaceId } from "@/lib/workspace";
import { NewConversationForm } from "@/components/inbox/NewConversationForm";
import { PLATFORM_LABELS, relativeTime } from "@/lib/format";
import { PlatformGlyph, type PlatformGlyphKey } from "@/components/dashboard/PlatformGlyph";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const t = await getTranslations("inbox");
  const workspaceId = await getCurrentWorkspaceId();
  const conversations = await prisma.conversation.findMany({
    where: { workspaceId },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { lastMessageAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t("description")}</p>
        </div>
        <NewConversationForm />
      </div>

      <div className="card divide-y divide-border">
        {conversations.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-muted">
            <MessageCircle className="h-6 w-6" />
            <p className="text-sm">{t("emptyState")}</p>
          </div>
        )}
        {conversations.map((c) => {
          const last = c.messages[0];
          return (
            <Link
              key={c.id}
              href={`/inbox/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-muted">
                <PlatformGlyph platform={c.platform as PlatformGlyphKey} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{c.participantName}</span>
                  <span className="shrink-0 text-xs text-muted">{relativeTime(c.lastMessageAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>{PLATFORM_LABELS[c.platform] ?? c.platform}</span>
                  {last && <span className="truncate">· {last.body}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
