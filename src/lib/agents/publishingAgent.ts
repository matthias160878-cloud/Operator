import { prisma } from "@/lib/db";
import type { ContentStatus } from "@prisma/client";
import {
  publishToFacebook,
  publishToInstagram,
  publishToLinkedIn,
  publishToTikTok,
  publishToYouTube,
} from "@/lib/publishing/adapters";

/**
 * PublishingAgent — steuert den Workflow DRAFT -> REVIEW -> APPROVED ->
 * SCHEDULED -> PUBLISHED (Abschnitt 16/34). Es wird NIEMALS automatisch
 * veröffentlicht: `publishContentItem` versucht einen echten API-Aufruf nur,
 * wenn der zugehörige Plattform-Account als CONNECTED markiert ist (echter
 * OAuth-Verbinden-Flow unter /social-media, siehe src/lib/oauth/providers.ts).
 * Jede Plattform ruft die echte native API auf (YouTube-Upload, LinkedIn-
 * UGC-Post, Facebook-Seiten-Post, Instagram-Reel, TikTok-Direct-Post) — bei
 * einem Fehler (fehlende Freigabe, abgelaufener Token, fehlendes Video)
 * bekommt die Nutzerin/der Nutzer die echte Fehlermeldung, nie eine
 * stille Fake-Veröffentlichung.
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
  contentItemId: string,
  publicOrigin: string
): Promise<{ published: boolean; message: string }> {
  const item = await prisma.contentItem.findUniqueOrThrow({
    where: { id: contentItemId },
    include: { mediaAssets: true },
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

  const video = item.mediaAssets.find((a) => a.type === "VIDEO");

  try {
    let result;
    switch (item.platform) {
      case "YOUTUBE":
        result = await publishToYouTube(account, item, video);
        break;
      case "LINKEDIN":
        result = await publishToLinkedIn(account, item);
        break;
      case "FACEBOOK":
        result = await publishToFacebook(account, item, video);
        break;
      case "INSTAGRAM":
        result = await publishToInstagram(account, item, video, publicOrigin);
        break;
      case "TIKTOK":
        result = await publishToTikTok(account, item, video, publicOrigin);
        break;
      default:
        return {
          published: false,
          message: `Veröffentlichen für ${item.platform} ist hier nicht vorgesehen (Blog/Newsletter laufen nicht über eine Plattform-API).`,
        };
    }

    await prisma.platformAccount.update({
      where: { id: account.id },
      data: result.published
        ? { lastPublishedAt: new Date(), lastError: null }
        : { lastError: result.message },
    });
    if (result.published) {
      await prisma.contentItem.update({
        where: { id: item.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
    }
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler beim Veröffentlichen.";
    await prisma.platformAccount.update({ where: { id: account.id }, data: { lastError: message } });
    return { published: false, message };
  }
}
