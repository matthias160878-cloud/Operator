import { prisma } from "@/lib/db";
import type { ContentStatus } from "@prisma/client";

/**
 * PublishingAgent — steuert den Workflow DRAFT -> REVIEW -> APPROVED ->
 * SCHEDULED -> PUBLISHED (Abschnitt 16/34). Es wird NIEMALS automatisch
 * veröffentlicht: `publishContentItem` versucht einen echten API-Aufruf nur,
 * wenn der zugehörige Plattform-Account als CONNECTED markiert ist — was
 * aktuell für keine Plattform der Fall ist, solange keine OAuth-Zugangsdaten
 * hinterlegt sind. In diesem Fall bleibt der Content im aktuellen Status und
 * der Nutzer erhält eine klare Fehlermeldung statt einer stillen Fake-Veröffentlichung.
 */
export async function setContentStatus(
  contentItemId: string,
  status: Extract<ContentStatus, "IN_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED">,
  rejectedReason?: string
) {
  return prisma.contentItem.update({
    where: { id: contentItemId },
    data: { status, rejectedReason: status === "REJECTED" ? rejectedReason ?? "" : null },
  });
}

export async function scheduleContentItem(contentItemId: string, scheduledAt: Date) {
  return prisma.contentItem.update({
    where: { id: contentItemId },
    data: { status: "SCHEDULED", scheduledAt },
  });
}

export async function publishContentItem(
  contentItemId: string
): Promise<{ published: boolean; message: string }> {
  const item = await prisma.contentItem.findUniqueOrThrow({
    where: { id: contentItemId },
  });

  const account = await prisma.platformAccount.findUnique({
    where: {
      workspaceId_platform: {
        workspaceId: item.workspaceId,
        platform: item.platform,
      },
    },
  });

  if (!account || account.status !== "CONNECTED") {
    return {
      published: false,
      message: `${item.platform} ist nicht verbunden. Verbinde den Account unter Social Media, bevor veröffentlicht werden kann.`,
    };
  }

  // Kein Plattform-Account ist aktuell tatsächlich verbunden (siehe
  // Integrations-Status) — der echte Publish-Call ist bewusst nicht
  // implementiert, um keine Fake-Veröffentlichung vorzutäuschen.
  return {
    published: false,
    message: `Publishing-Adapter für ${item.platform} ist vorbereitet, der native API-Aufruf ist noch nicht implementiert.`,
  };
}
