import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/api";
import { getCurrentWorkspaceId } from "@/lib/workspace";

/**
 * Prüft, dass ein per ID adressierter Datensatz zum Workspace der aktuellen
 * Sitzung gehört. Fremde IDs ergeben 404 (nicht 403), damit sich nicht
 * einmal die Existenz fremder Datensätze erraten lässt.
 */
export async function ownedContentItem(id: string) {
  const workspaceId = await getCurrentWorkspaceId();
  const item = await prisma.contentItem.findFirst({ where: { id, workspaceId } });
  if (!item) throw new NotFoundError();
  return item;
}

export async function ownedIdea(id: string) {
  const workspaceId = await getCurrentWorkspaceId();
  const row = await prisma.contentIdea.findFirst({ where: { id, workspaceId } });
  if (!row) throw new NotFoundError();
  return row;
}

export async function ownedVoice(id: string) {
  const workspaceId = await getCurrentWorkspaceId();
  const row = await prisma.voice.findFirst({ where: { id, workspaceId } });
  if (!row) throw new NotFoundError();
  return row;
}

export async function ownedRevenueEntry(id: string) {
  const workspaceId = await getCurrentWorkspaceId();
  const row = await prisma.revenueEntry.findFirst({ where: { id, workspaceId } });
  if (!row) throw new NotFoundError();
  return row;
}

export async function ownedConversation(id: string) {
  const workspaceId = await getCurrentWorkspaceId();
  const row = await prisma.conversation.findFirst({ where: { id, workspaceId } });
  if (!row) throw new NotFoundError();
  return row;
}

export async function ownedMessage(id: string) {
  const workspaceId = await getCurrentWorkspaceId();
  const row = await prisma.message.findFirst({ where: { id, conversation: { workspaceId } } });
  if (!row) throw new NotFoundError();
  return row;
}

export async function ownedPlatformAccount(id: string) {
  const workspaceId = await getCurrentWorkspaceId();
  const row = await prisma.platformAccount.findFirst({ where: { id, workspaceId } });
  if (!row) throw new NotFoundError();
  return row;
}
