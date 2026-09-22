import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { ConversationDetail } from "@/components/inbox/ConversationDetail";

export const dynamic = "force-dynamic";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) notFound();

  return (
    <div className="space-y-5">
      <Link href="/inbox" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Zurück zum Posteingang
      </Link>
      <ConversationDetail conversation={conversation} />
    </div>
  );
}
